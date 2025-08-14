import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Setting, SettingInput, User, UserInput } from '../models';
import {
  asyncHandler,
  capitalizeFirstLetter,
  deleteHandler,
  emailRegex,
  ErrorCodes,
  generateRandomString,
  hashPassword,
  comparePassword,
  HttpError,
  obscureEmail,
  responseHandler,
  buildQueryOptions,
} from '../utils';

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
  const { email, password } = req.body || {};

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

  const jwtSecret = process.env.JWT_SECRET || '';
  const accessToken = jwt.sign({ id: user._id, role: user.role }, jwtSecret, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ id: user._id, role: user.role }, jwtSecret, { expiresIn: '7d' });

  user.accessToken = accessToken;
  user.refreshToken = refreshToken;

  await user.save();

  return responseHandler(res.status(200), {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      email: obscureEmail(user.email),
      name: user.name,
      role: user.role,
    },
    message: 'Signed in successfully',
  });
});

export const signoutUser = asyncHandler(async (req: Request, res: Response) => {
  const { user } = res.locals;

  console.log(user);

  if (!user) {
    throw new HttpError(404, 'User not found', ErrorCodes.NOT_FOUND);
  }

  user.accessToken = null;
  user.refreshToken = null;
  await user.save();

  return res.status(200).json({ message: 'Signed out successfully' });
});

export const refreshTokenUser = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body || {};

  if (!refreshToken || typeof refreshToken !== 'string') {
    throw new HttpError(400, 'Refresh token is required', ErrorCodes.VALIDATION);
  }

  const jwtSecret = process.env.JWT_SECRET || '';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let decoded: any;

  try {
    decoded = jwt.verify(refreshToken, jwtSecret);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    throw new HttpError(401, 'Invalid or expired refresh token', ErrorCodes.UNAUTHORIZED);
  }

  // Find user with matching refreshToken
  const user = await User.findOne({ _id: decoded.id, refreshToken, emailVerified: true }).populate('role').exec();

  if (!user) {
    throw new HttpError(401, 'Invalid refresh token', ErrorCodes.UNAUTHORIZED);
  }

  if (!user.enabled) {
    throw new HttpError(403, 'Account disabled', ErrorCodes.ACCOUNT_DISABLED);
  }

  // Generate new tokens
  const newAccessToken = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '1h' });
  const newRefreshToken = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '7d' });

  // Update tokens in DB
  user.accessToken = newAccessToken;
  user.refreshToken = newRefreshToken;
  await user.save();

  return responseHandler(res.status(200), {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
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
