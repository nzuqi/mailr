import nodemailer from 'nodemailer';
import { Application, Message } from '../models';
import { MessageDocument } from '../models/message.model';
import { htmlToText, logger } from '../utils';

const MAX_RETRIES = 3;
const PROCESS_LIMIT = 10;

const isRetryableError = (error: unknown) => {
  const smtpError = error as { code?: string; responseCode?: number };

  // Authentication, invalid envelopes, and SMTP 5xx responses require a
  // configuration or content change; retrying them cannot succeed.
  if (smtpError.code === 'EAUTH' || smtpError.code === 'EENVELOPE' || smtpError.code === 'ESMTP_CONFIG') {
    return false;
  }

  if (smtpError.responseCode === undefined) {
    return true;
  }

  return smtpError.responseCode < 500;
};

export const processQueuedMessages = async () => {
  try {
    const queuedMessages: MessageDocument[] = await Message.find({
      status: 0,
      $or: [{ retryCount: { $lt: MAX_RETRIES } }, { retryCount: { $exists: false } }],
    })
      .sort({ urgent: -1, createdAt: 1 }) // urgent first, oldest first
      .limit(PROCESS_LIMIT)
      .exec();

    if (!queuedMessages.length) {
      logger.info('No queued messages to process.');
      return;
    }

    logger.info(`Processing ${queuedMessages.length} queued message(s)...`);

    for (const msg of queuedMessages) {
      try {
        // New messages always carry this immutable snapshot. The fallback keeps
        // pre-existing queue records deliverable during rollout.
        let smtpConfig = msg.smtp;

        if (!smtpConfig) {
          const application = await Application.findById(msg.application).select('smtp').exec();

          smtpConfig = application?.smtp instanceof Map ? Object.fromEntries(application.smtp) : application?.smtp || null;
        }

        if (!smtpConfig) {
          throw Object.assign(new Error(`SMTP configuration missing for application ${msg.application}`), { code: 'ESMTP_CONFIG' });
        }

        // Create Nodemailer transport for this application
        const transporter = nodemailer.createTransport({
          host: smtpConfig.host,
          port: smtpConfig.port || 587,
          secure: smtpConfig.port === 465 ? true : smtpConfig.secure, // true for port 465
          auth: {
            user: smtpConfig.user,
            pass: smtpConfig.password,
          },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let mailAttachments: any[] = [];

        if (Array.isArray(msg.attachments) && msg.attachments.length > 0) {
          mailAttachments = msg.attachments.map((a) => ({
            filename: a.filename,
            content: Buffer.from(a.content, 'base64'),
            contentType: a.type,
            disposition: a.disposition || 'attachment',
          }));
        }

        await transporter.sendMail({
          from: `"${msg.from}" <${smtpConfig.user}>`,
          to: msg.to.join(', '),
          subject: msg.subject,
          text: htmlToText(msg.message),
          html: msg.message,
          attachments: mailAttachments,
        });

        msg.status = 1;
        msg.sentAt = new Date();
        await msg.save();

        logger.info(`✅ Message ${msg._id} sent successfully.`);
      } catch (err) {
        const retryable = isRetryableError(err);

        msg.retryCount = retryable ? (msg.retryCount || 0) + 1 : MAX_RETRIES;

        if (!retryable || msg.retryCount >= MAX_RETRIES) {
          msg.status = 2;
          logger.error(`❌ Message ${msg._id} permanently failed${retryable ? ` after ${MAX_RETRIES} retries` : ''}.`);
        } else {
          logger.warn(`⚠️ Message ${msg._id} failed (retry ${msg.retryCount}/${MAX_RETRIES}).`);
        }

        msg.error = (err as Error).message;
        await msg.save();
      }
    }
  } catch (error) {
    logger.error('Error processing queued messages: ', error);
  }
};
