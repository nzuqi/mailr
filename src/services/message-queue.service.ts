import nodemailer from 'nodemailer';
import { Application, Message, SmtpData } from '../models';
import { MessageDocument } from '../models/message.model';
import { htmlToText, logger } from '../utils';

const MAX_RETRIES = 3;
const PROCESS_LIMIT = 10;

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
        // Fetch application to get SMTP details
        const application = await Application.findById(msg.application).exec();

        if (!application || !application.smtp) {
          throw new Error(`SMTP configuration missing for application ${msg.application}`);
        }

        const smtpConfig: SmtpData = application.smtp instanceof Map ? Object.fromEntries(application.smtp) : application.smtp || {};

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
        msg.retryCount = (msg.retryCount || 0) + 1;

        if (msg.retryCount >= MAX_RETRIES) {
          msg.status = 2;
          logger.error(`❌ Message ${msg._id} permanently failed after ${MAX_RETRIES} retries.`);
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
