import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Setting, SettingInput, User, UserInput } from '../models';
import { asyncHandler, capitalizeFirstLetter, deleteHandler, emailRegex, ErrorCodes, generateRandomString, hashPassword, comparePassword, HttpError, obscureEmail } from '../utils';

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const setting: SettingInput | null = await Setting.findOne({ key: 'app' });
  let signupAllowed = false;
  const _data = setting?.value ? JSON.parse(setting?.value) : {};
  signupAllowed = _data?.signupAllowed;

  if (!signupAllowed) {
    throw new HttpError(405, "Oops! We're not allowing new registrations for now", ErrorCodes.NOT_ALLOWED);
  }

  const { email, firstName, lastName, password, role } = req.body;

  if (typeof firstName !== 'string' || typeof lastName !== 'string' || typeof email !== 'string' || typeof password !== 'string' || typeof role !== 'string') {
    throw new HttpError(422, 'The fields email, firstName, firstName, password and role are required', ErrorCodes.VALIDATION);
  }

  if (!emailRegex.test(email)) {
    throw new HttpError(422, 'Invalid email format', ErrorCodes.VALIDATION);
  }

  const verificationCode = generateRandomString(20);
  const current = new Date();
  const expires = current.getTime() + 86400000;// + 1 day in ms

  const userInput: UserInput = {
    name: `${capitalizeFirstLetter(firstName)} ${capitalizeFirstLetter(lastName)}`,
    email: email.toLowerCase(),
    password: hashPassword(password),
    role,
    verificationInfo: {
      email: verificationCode,
      expires
    }
  };

  const userCreated = await User.create(userInput);

  // TODO: Send verification email

  return res.status(201).json({ data: userCreated, message: 'User created successfully' });
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await User.find().populate('role').sort('-createdAt').exec();

  return res.status(200).json({ data: users });
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await User.findOne({ _id: id }).populate('role').exec();

  if (!user) {
    throw new HttpError(404, `User with id '${id}' not found.`, ErrorCodes.NOT_FOUND);
  }

  return res.status(200).json({ data: user });
});

export const signinUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

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

  return res.status(200).json({
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
  let token = req.headers['authorization'];
  if (!token || typeof token !== 'string') {
    throw new HttpError(401, 'Authorization token missing', ErrorCodes.UNAUTHORIZED);
  }
  if (token.startsWith('Bearer ')) token = token.slice(7);

  const user = await User.findOne({ accessToken: token }).exec();
  if (!user) {
    throw new HttpError(404, 'User not found', ErrorCodes.NOT_FOUND);
  }

  user.accessToken = null;
  user.refreshToken = null;
  await user.save();

  return res.status(200).json({ message: 'Signed out successfully' });
});

export const verifyEmailUser = asyncHandler(async (req: Request, res: Response) => {
  // TODO; Logic here
});

export const resendVerificationUser = asyncHandler(async (req: Request, res: Response) => {
  // TODO; Logic here
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { ids } = req.body || {};

  const result = await deleteHandler({
    model: User,
    id,
    ids,
    resourceName: 'User',
    returnDeletedDocs: true,
  });

  return res.status(200).json(result);
});
