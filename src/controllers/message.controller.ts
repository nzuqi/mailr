import { Request, Response } from 'express';
import { Application, Message, MessageInput, UserDocument } from '../models';
import { asyncHandler, buildQueryOptions, emailRegex, ErrorCodes, HttpError, responseHandler } from '../utils';

export const queueMessage = asyncHandler(async (req: Request, res: Response) => {
  const { from, key, message, subject, to, urgent } = req.body || {};
  const user: UserDocument = res.locals.user || {};

  if (
    typeof from !== 'string' ||
    !Array.isArray(to) ||
    to.length === 0 ||
    typeof subject !== 'string' ||
    typeof message !== 'string' ||
    typeof key !== 'string'
  ) {
    throw new HttpError(422, 'From (sender name), to, subject, message and key are required and must be valid.', ErrorCodes.VALIDATION);
  }

  const recipients: string[] = to.map((email: string) => email.toLowerCase());
  const invalidEmail = recipients.find((email: string) => !emailRegex.test(email));

  if (invalidEmail) {
    throw new HttpError(422, `Invalid recipient email format: ${invalidEmail}`, ErrorCodes.VALIDATION);
  }

  const application = await Application.findOne({ apiKey: key, enabled: true }).exec();

  if (!application) {
    throw new HttpError(401, 'Invalid credentials', ErrorCodes.UNAUTHORIZED);
  }

  const messageInput: MessageInput = {
    from,
    to: recipients,
    subject: subject.trim(),
    message: message.trim(),
    user: (user._id || '').toString(),
    application: (application._id || '').toString(),
    urgent: typeof urgent === 'boolean' ? urgent : false,
  };

  const messageQueued = await Message.create(messageInput);

  return responseHandler(
    res.status(201),
    {
      data: messageQueued,
      message: 'Message queued successfully',
    },
    ['from', 'to', 'subject', 'message', 'urgent', 'createdAt'],
  );
});

export const getAllMessages = asyncHandler(async (req: Request, res: Response) => {
  const { filter, pagination, sort } = buildQueryOptions(req, ['subject', 'from', 'createdAt', 'message']);

  const [data, total] = await Promise.all([
    Message.find(filter).sort(sort).skip(pagination.skip).limit(pagination.limit).exec(),
    Message.countDocuments(filter),
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
    ['from', 'subject', 'createdAt', 'updatedAt'],
  );
});
