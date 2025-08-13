import { Request, Response } from 'express';
import { Application, ApplicationInput, UserDocument } from '../models';
import { asyncHandler, deleteHandler, ErrorCodes, generateRandomString, HttpError } from '../utils';

export const createApplication = asyncHandler(async (req: Request, res: Response) => {
  const { description, name } = req.body || {};
  const user: UserDocument = res.locals.user || {};

  if (typeof name !== 'string' || typeof description !== 'string') {
    throw new HttpError(422, 'Name, description, and user are required and must be valid.', ErrorCodes.VALIDATION);
  }

  const applicationInput: ApplicationInput = {
    name: name.trim(),
    description: description.trim(),
    user: (user._id || '').toString(),
  };

  const applicationCreated = await Application.create(applicationInput);

  return res.status(201).json({ data: applicationCreated, message: 'Application created successfully' });
});

export const getAllApplications = asyncHandler(async (req: Request, res: Response) => {
  const applications = await Application.find().sort('-createdAt').exec();

  return res.status(200).json({ data: applications });
});

export const getApplication = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const application = await Application.findOne({ _id: id });

  if (!application) {
    throw new HttpError(404, `Application with id '${id}' not found.`, ErrorCodes.NOT_FOUND);
  }

  return res.status(200).json({ data: application });
});

export const updateApplication = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params || {};
  const { description, name } = req.body || {};

  if (typeof name !== 'string' || typeof description !== 'string') {
    throw new HttpError(422, 'Name, description, and user are required and must be valid.', ErrorCodes.VALIDATION);
  }

  const applicationUpdated = await Application.findByIdAndUpdate(id, { name, description }, { new: true, runValidators: true });

  if (!applicationUpdated) {
    throw new HttpError(404, `Application with id '${id}' not found.`, ErrorCodes.NOT_FOUND);
  }

  return res.status(200).json({
    data: applicationUpdated,
    message: 'Application updated successfully',
  });
});

export const deleteApplication = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params; // single delete
  const { ids } = req.body || {}; // bulk delete

  const result = await deleteHandler({
    model: Application,
    id,
    ids,
    resourceName: 'Application',
    returnDeletedDocs: true,
  });

  return res.status(200).json(result);
});

export const generateApplicationKey = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params || {};

  const apiKey: string = generateRandomString(50, true);

  const applicationUpdated = await Application.findByIdAndUpdate(id, { apiKey }, { new: true, runValidators: true });

  if (!applicationUpdated) {
    throw new HttpError(404, `Application with id '${id}' not found.`, ErrorCodes.NOT_FOUND);
  }

  return res.status(200).json({
    data: {
      apiKey: applicationUpdated.apiKey,
    },
    message: 'Application API key generated successfully',
  });
});
