import { Request, Response } from 'express';
import { Setting, SettingInput, User, UserInput } from '../models';
import { asyncHandler, capitalizeFirstLetter, deleteHandler, emailRegex, ErrorCodes, generateRandomString, hashPassword, HttpError } from '../utils';

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
  // TODO; Logic here
});

export const signoutUser = asyncHandler(async (req: Request, res: Response) => {
  // TODO; Logic here
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
