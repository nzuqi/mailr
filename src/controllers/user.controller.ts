import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Session, Setting, SettingInput, User, UserInput } from '../models';
import { TwoFactorService } from '../services';
import {
  asyncHandler,
  capitalizeFirstLetter,
  deleteHandler,
  emailRegex,
  ErrorCodes,
  generateRandomString,
  hashPassword,
  hashToken,
  comparePassword,
  HttpError,
  obscureEmail,
  responseHandler,
  buildQueryOptions,
} from '../utils';

const twoFactorService = new TwoFactorService();
const twoFactorCodeRegex = /^\d{6}$/;
const accessTokenDuration = '15m';
const refreshTokenDuration = '7d';

const issueTokens = (user: InstanceType<typeof User>, sessionId: string) => {
  const jwtSecret = process.env.JWT_SECRET || '';
  const base = { id: user._id, role: user.role, sessionId };

  return {
    accessToken: jwt.sign({ ...base, type: 'access' }, jwtSecret, { expiresIn: accessTokenDuration }),
    refreshToken: jwt.sign({ id: user._id, sessionId, type: 'refresh' }, jwtSecret, { expiresIn: refreshTokenDuration }),
  };
};

const refreshExpiry = (token: string) => {
  const decoded = jwt.decode(token);

  if (!decoded || typeof decoded === 'string' || !decoded.exp) {
    throw new HttpError(401, 'Invalid refresh token', ErrorCodes.UNAUTHORIZED);
  }

  return new Date(decoded.exp * 1000);
};

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const setting: SettingInput | null = await Setting.findOne({ key: 'app' });
  let signupAllowed = false;
  const _data = setting?.value ? JSON.parse(setting?.value) : {};

  signupAllowed = _data?.signupAllowed;

  if (!signupAllowed) {
    throw new HttpError(405, "Oops! We're not allowing new registrations for now", ErrorCodes.NOT_ALLOWED);
  }

  const { email, firstName, lastName, password, role } = req.body || {};

  if (
    typeof firstName !== 'string' ||
    typeof lastName !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    typeof role !== 'string'
  ) {
    throw new HttpError(422, 'The fields email, firstName, firstName, password and role are required', ErrorCodes.VALIDATION);
  }

  if (!emailRegex.test(email)) {
    throw new HttpError(422, 'Invalid email format', ErrorCodes.VALIDATION);
  }

  const verificationCode = generateRandomString(20);
  const current = new Date();
  const expires = current.getTime() + 86400000; // + 1 day in ms

  const userInput: UserInput = {
    name: `${capitalizeFirstLetter(firstName)} ${capitalizeFirstLetter(lastName)}`,
    email: email.toLowerCase(),
    password: hashPassword(password),
    role,
    verificationInfo: {
      email: verificationCode,
      expires,
    },
  };

  const userCreated = await User.create(userInput);

  // TODO: Send verification email

  return responseHandler(res.status(201), { data: userCreated, message: 'User created successfully' }, ['name', 'email', 'emailVerified']);
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { filter, pagination, sort } = buildQueryOptions(req, ['name', 'email', 'createdAt', 'message']);

  const [data, total] = await Promise.all([
    User.find(filter).sort(sort).skip(pagination.skip).limit(pagination.limit).exec(),
    User.countDocuments(filter),
  ]);

  return responseHandler(
    res.status(200),
    {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
      data,
      message: 'Successful',
    },
    ['name', 'email', 'emailVerified', 'role', 'enabled'],
  );
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await User.findOne({ _id: id }).exec();

  if (!user) {
    throw new HttpError(404, `User with id '${id}' not found.`, ErrorCodes.NOT_FOUND);
  }

  return responseHandler(res.status(200), { data: user }, ['name', 'email', 'emailVerified', 'role', 'enabled']);
});

export const signinUser = asyncHandler(async (req: Request, res: Response) => {
  const { code, email, password } = req.body || {};

  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new HttpError(422, 'Email and password are required', ErrorCodes.VALIDATION);
  }

  if (!emailRegex.test(email)) {
    throw new HttpError(422, 'Invalid email format', ErrorCodes.VALIDATION);
  }

  const user = await User.findOne({ email: email.toLowerCase() }).exec();

  if (!user) {
    // throw new HttpError(404, 'User not found', ErrorCodes.NOT_FOUND);
    throw new HttpError(401, 'Invalid credentials', ErrorCodes.UNAUTHORIZED);
  }

  if (!user.emailVerified) {
    throw new HttpError(403, 'Email not verified', ErrorCodes.NOT_ALLOWED);
  }

  if (!user.enabled) {
    throw new HttpError(403, 'Account disabled', ErrorCodes.ACCOUNT_DISABLED);
  }

  const passwordsMatch = comparePassword(password, user.password);

  if (!passwordsMatch) {
    throw new HttpError(401, 'Invalid credentials', ErrorCodes.UNAUTHORIZED);
  }

  if (user.twoFactorEnabled) {
    if (typeof code !== 'string' || !twoFactorCodeRegex.test(code)) {
      throw new HttpError(428, 'Enter the 6-digit code from your authenticator app', ErrorCodes.TWO_FA);
    }

    if (!(await twoFactorService.verifyCode(user._id.toString(), code))) {
      throw new HttpError(401, 'Invalid two-factor authentication code', ErrorCodes.UNAUTHORIZED);
    }
  }

  const session = new Session({
    user: user._id,
    refreshTokenHash: 'pending',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || null,
  });
  const { accessToken, refreshToken } = issueTokens(user, session._id.toString());

  session.refreshTokenHash = hashToken(refreshToken);
  session.expiresAt = refreshExpiry(refreshToken);
  await session.save();

  return responseHandler(res.status(200), {
    accessToken,
    refreshToken,
    sessionId: session._id,
    user: {
      id: user._id,
      email: obscureEmail(user.email),
      name: user.name,
      role: user.role,
      twoFactorEnabled: Boolean(user.twoFactorEnabled),
    },
    message: 'Signed in successfully',
  });
});

export const beginTwoFactorSetup = asyncHandler(async (_req: Request, res: Response) => {
  const { user } = res.locals;

  if (user.twoFactorEnabled) {
    throw new HttpError(409, 'Two-factor authentication is already enabled', ErrorCodes.NOT_ALLOWED);
  }

  const setup = await twoFactorService.generateSecret(user._id.toString(), user.email);

  return responseHandler(res.status(200), { data: setup, message: 'Two-factor setup started' });
});

export const verifyTwoFactorSetup = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.body || {};
  const { user } = res.locals;

  if (typeof code !== 'string' || !twoFactorCodeRegex.test(code)) {
    throw new HttpError(422, 'A valid 6-digit code is required', ErrorCodes.VALIDATION);
  }

  if (!(await twoFactorService.verifyCode(user._id.toString(), code))) {
    throw new HttpError(403, 'Invalid two-factor authentication code', ErrorCodes.NOT_ALLOWED);
  }

  await twoFactorService.enable(user._id.toString());
  return res.status(200).json({ message: 'Two-factor authentication enabled' });
});

export const disableTwoFactor = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.body || {};
  const { user } = res.locals;

  if (!user.twoFactorEnabled) {
    throw new HttpError(409, 'Two-factor authentication is not enabled', ErrorCodes.NOT_ALLOWED);
  }

  if (typeof code !== 'string' || !twoFactorCodeRegex.test(code)) {
    throw new HttpError(422, 'A valid 6-digit code is required', ErrorCodes.VALIDATION);
  }

  if (!(await twoFactorService.verifyCode(user._id.toString(), code))) {
    throw new HttpError(403, 'Invalid two-factor authentication code', ErrorCodes.NOT_ALLOWED);
  }

  await twoFactorService.disable(user._id.toString());
  return res.status(200).json({ message: 'Two-factor authentication disabled' });
});

export const signoutUser = asyncHandler(async (req: Request, res: Response) => {
  const { session, user } = res.locals;

  if (!user) {
    throw new HttpError(404, 'User not found', ErrorCodes.NOT_FOUND);
  }

  if (session) {
    session.revokedAt = new Date();
    await session.save();
  }

  return res.status(200).json({ message: 'Signed out successfully' });
});

export const refreshTokenUser = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body || {};

  if (!refreshToken || typeof refreshToken !== 'string') {
    throw new HttpError(400, 'Refresh token is required', ErrorCodes.VALIDATION);
  }

  const jwtSecret = process.env.JWT_SECRET || '';

  let decoded: jwt.JwtPayload;

  try {
    const payload = jwt.verify(refreshToken, jwtSecret);

    if (typeof payload === 'string' || payload.type !== 'refresh' || !payload.id || !payload.sessionId) {
      throw new Error('Invalid token payload');
    }
    decoded = payload;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    throw new HttpError(401, 'Invalid or expired refresh token', ErrorCodes.UNAUTHORIZED);
  }

  const session = await Session.findOne({
    _id: decoded.sessionId,
    user: decoded.id,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  })
    .select('+refreshTokenHash')
    .exec();

  if (!session || session.refreshTokenHash !== hashToken(refreshToken)) {
    if (session) {
      session.revokedAt = new Date();
      await session.save();
    }
    throw new HttpError(401, 'Invalid refresh token', ErrorCodes.UNAUTHORIZED);
  }

  const user = await User.findOne({ _id: decoded.id, emailVerified: true }).populate('role').exec();

  if (!user) {
    throw new HttpError(401, 'Invalid refresh token', ErrorCodes.UNAUTHORIZED);
  }

  if (!user.enabled) {
    throw new HttpError(403, 'Account disabled', ErrorCodes.ACCOUNT_DISABLED);
  }

  const { accessToken: newAccessToken, refreshToken: newRefreshToken } = issueTokens(user, session._id.toString());

  session.refreshTokenHash = hashToken(newRefreshToken);
  session.expiresAt = refreshExpiry(newRefreshToken);
  await session.save();

  return responseHandler(res.status(200), {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    sessionId: session._id,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      twoFactorEnabled: Boolean(user.twoFactorEnabled),
    },
    message: 'Token refreshed successfully',
  });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const verifyEmailUser = asyncHandler(async (req: Request, res: Response) => {
  // TODO; Logic here
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const resendVerificationUser = asyncHandler(async (req: Request, res: Response) => {
  // TODO; Logic here
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params || {};
  const { ids } = req.body || {};

  const result = await deleteHandler({
    model: User,
    id,
    ids,
    resourceName: 'User',
    returnDeletedDocs: true,
  });

  return responseHandler(res.status(200), result, ['name', 'email', 'emailVerified']);
});
