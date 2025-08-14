import { Request, Response } from 'express';
import { Application, ApplicationInput, SmtpData, UserDocument } from '../models';
import { asyncHandler, buildQueryOptions, deleteHandler, ErrorCodes, generateRandomString, HttpError, responseHandler } from '../utils';

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

  return responseHandler(res.status(201), { data: applicationCreated, message: 'Application created successfully' }, ['name', 'description']);
});

export const getAllApplications = asyncHandler(async (req: Request, res: Response) => {
  const { filter, pagination, sort } = buildQueryOptions(req, ['name', 'description', 'createdAt', 'updatedAt']);

  const [data, total] = await Promise.all([
    Application.find(filter).sort(sort).skip(pagination.skip).limit(pagination.limit).exec(),
    Application.countDocuments(filter),
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
    ['name', 'description', 'enabled', 'smtp.host', 'smtp.port', 'smtp.secure', 'smtp.user', 'createdAt', 'updatedAt'],
  );
});

export const getApplication = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const application = await Application.findOne({ _id: id });

  if (!application) {
    throw new HttpError(404, `Application with id '${id}' not found.`, ErrorCodes.NOT_FOUND);
  }

  return responseHandler(res.status(200), { data: application }, [
    'name',
    'description',
    'enabled',
    'smtp.host',
    'smtp.port',
    'smtp.secure',
    'smtp.user',
    'createdAt',
    'updatedAt',
  ]);
});

export const updateApplication = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params || {};
  const { description, enabled } = req.body || {};

  if ((description && typeof description !== 'string') || (enabled && typeof enabled !== 'boolean')) {
    throw new HttpError(422, `You can only update using 'description' and 'enabled' fields`, ErrorCodes.VALIDATION);
  }

  const updateData: { description: string; enabled?: boolean } = { description };

  if (typeof enabled === 'boolean') {
    updateData.enabled = enabled;
  }
  const applicationUpdated = await Application.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

  if (!applicationUpdated) {
    throw new HttpError(404, `Application with id '${id}' not found.`, ErrorCodes.NOT_FOUND);
  }

  return responseHandler(
    res.status(200),
    {
      data: applicationUpdated,
      message: 'Application updated successfully',
    },
    ['name', 'description', 'enabled', 'smtp.host', 'smtp.port', 'smtp.secure', 'smtp.user', 'createdAt', 'updatedAt'],
  );
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

  return responseHandler(res.status(200), result, [
    'name',
    'description',
    'enabled',
    'smtp.host',
    'smtp.port',
    'smtp.secure',
    'smtp.user',
    'createdAt',
    'updatedAt',
  ]);
});

export const generateApplicationKey = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params || {};

  const apiKey: string = generateRandomString(50, true);

  const applicationUpdated = await Application.findByIdAndUpdate(id, { apiKey }, { new: true, runValidators: true });

  if (!applicationUpdated) {
    throw new HttpError(404, `Application with id '${id}' not found.`, ErrorCodes.NOT_FOUND);
  }

  return responseHandler(res.status(200), {
    data: {
      apiKey: applicationUpdated.apiKey,
    },
    message: 'Application API key generated successfully',
  });
});

export const updateApplicationSmtp = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params || {};
  const { host, password, port, secure, user } = req.body || {};

  if (typeof host !== 'string' || typeof port !== 'number' || typeof user !== 'string' || typeof password !== 'string') {
    throw new HttpError(422, 'Host, port, user and password are required and must be valid.', ErrorCodes.VALIDATION);
  }

  const smtp: SmtpData = { host, port, secure: typeof secure === 'boolean' ? secure : false, user, password };
  const applicationUpdated = await Application.findByIdAndUpdate(id, { smtp }, { new: true, runValidators: true });

  if (!applicationUpdated) {
    throw new HttpError(404, `Application with id '${id}' not found.`, ErrorCodes.NOT_FOUND);
  }

  return responseHandler(
    res.status(200),
    {
      data: applicationUpdated,
      message: 'Application updated successfully',
    },
    ['name', 'description', 'enabled', 'smtp.host', 'smtp.port', 'smtp.secure', 'smtp.user', 'createdAt', 'updatedAt'],
  );
});
