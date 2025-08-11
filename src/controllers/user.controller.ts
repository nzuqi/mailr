import { Request, Response } from 'express';
import crypto from 'crypto';
import { Setting, SettingInput, User, UserInput } from '../models';
import { asyncHandler, deleteHandler, ErrorCodes, HttpError } from '../utils';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(16).toString('hex');

  // Hashing salt and password with 100 iterations, 64 length and sha512 digest
  return crypto.pbkdf2Sync(password, salt, 100, 64, `sha512`).toString(`hex`);
};

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const setting: SettingInput | null = await Setting.findOne({ key: 'app' });
  let signupAllowed = false;

  try {
    const _data = setting?.value ? JSON.parse(setting?.value) : {};

    signupAllowed = _data?.signupAllowed;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // Do nothing here
  }
  if (!signupAllowed) {
    throw new HttpError(405, "Oops! We're not allowing new registrations for now", ErrorCodes.NOT_ALLOWED);
  }

  const { email, name, password, role } = req.body;

  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string' || typeof role !== 'string') {
    throw new HttpError(422, 'The fields email, name, password and role are required', ErrorCodes.VALIDATION);
  }

  if (!emailRegex.test(email)) {
    throw new HttpError(422, 'Invalid email format', ErrorCodes.VALIDATION);
  }

  const userInput: UserInput = {
    name,
    email,
    password: hashPassword(password),
    role,
  };

  const userCreated = await User.create(userInput);

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

export const deleteUser = async (req: Request, res: Response) => {
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
};
