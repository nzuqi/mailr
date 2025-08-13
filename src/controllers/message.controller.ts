import { Request, Response } from 'express';
import { Application, Message, MessageInput, UserDocument } from '../models';
import { asyncHandler, emailRegex, ErrorCodes, HttpError } from '../utils';

export const queueMessage = asyncHandler(async (req: Request, res: Response) => {
  const { from, key, message, subject, to, urgent } = req.body || {};
  const user: UserDocument = res.locals.user || {};

  if (
    typeof from !== 'object' ||
    typeof from?.name !== 'string' ||
    typeof from?.email !== 'string' ||
    !Array.isArray(to) ||
    to.length === 0 ||
    typeof subject !== 'string' ||
    typeof message !== 'string' ||
    typeof key !== 'string'
  ) {
    throw new HttpError(422, 'From (name and email), to, subject, message and key are required and must be valid.', ErrorCodes.VALIDATION);
  }

  if (!emailRegex.test(from?.email)) {
    throw new HttpError(422, `Invalid sender email format: ${from?.email}`, ErrorCodes.VALIDATION);
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
    from: {
      name: from?.name,
      email: (from?.email || '').toLowerCase(),
    },
    to: recipients,
    subject: subject.trim(),
    message: message.trim(),
    user: (user._id || '').toString(),
    application: (application._id || '').toString(),
    urgent: typeof urgent === 'boolean' ? urgent : false,
  };

  const messageQueued = await Message.create(messageInput);

  return res.status(201).json({ data: messageQueued, message: 'Message queued successfully' });
});
