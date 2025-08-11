import { Request, Response } from 'express';
import { Setting, SettingInput } from '../models';
import { asyncHandler, ErrorCodes, HttpError } from '../utils';

export const getAllSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await Setting.find().sort('-createdAt').exec();

  const data: Record<string, string | number | boolean> = {};

  settings.forEach((s: SettingInput) => (data[s.key] = s.value ? JSON.parse(s.value) : {}));

  return res.status(200).json({ data });
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const { key, value } = req.body || {};

  if (typeof key !== 'string' || typeof value !== 'object') {
    throw new HttpError(422, 'The fields key and value are required and must be valid.', ErrorCodes.VALIDATION);
  }

  const data: Record<string, string | number | boolean> = {};

  for (const i in value) {
    data[i] = value[i];
  }

  const query = { key };
  const update = { $set: { key, value: JSON.stringify(value) } };
  const options = { upsert: true, new: true, runValidators: true };

  await Setting.updateOne(query, update, options);

  return res.status(200).json({
    data: { [key]: data },
    message: 'Settings updated successfully',
  });
});
