import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Application, Message, User } from '../models';
import { asyncHandler, ErrorCodes, HttpError, responseHandler } from '../utils';

const ranges = { '7d': 7, '30d': 30, '90d': 90 } as const;
const statuses = { queued: 0, sent: 1, failed: 2 } as const;

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const range = typeof req.query.range === 'string' ? req.query.range : '7d';
  const status = typeof req.query.status === 'string' ? req.query.status : 'all';
  const applicationId = typeof req.query.applicationId === 'string' ? req.query.applicationId : undefined;

  if (!(range in ranges)) {
    throw new HttpError(422, "Range must be one of '7d', '30d', or '90d'.", ErrorCodes.VALIDATION);
  }
  if (status !== 'all' && !(status in statuses)) {
    throw new HttpError(422, "Status must be one of 'all', 'queued', 'sent', or 'failed'.", ErrorCodes.VALIDATION);
  }
  if (applicationId && !mongoose.isValidObjectId(applicationId)) {
    throw new HttpError(422, 'Application id must be valid.', ErrorCodes.VALIDATION);
  }

  const days = ranges[range as keyof typeof ranges];
  const start = new Date();

  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const reportFilter: Record<string, unknown> = { createdAt: { $gte: start } };

  if (status !== 'all') {
    reportFilter.status = statuses[status as keyof typeof statuses];
  }
  if (applicationId) {
    reportFilter.application = new mongoose.Types.ObjectId(applicationId);
  }

  const [applications, activeApplications, users, enabledUsers, messageHealth, deliverySeries, recentMessages] = await Promise.all([
    Application.countDocuments(),
    Application.countDocuments({ enabled: true }),
    User.countDocuments(),
    User.countDocuments({ enabled: true }),
    Message.aggregate<{ _id: number; count: number }>([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Message.aggregate<{ _id: string; count: number }>([
      { $match: reportFilter },
      { $group: { _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d', timezone: 'UTC' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Message.find().sort({ createdAt: -1 }).limit(5).select('from subject application status createdAt').lean().exec(),
  ]);

  const byStatus = new Map(messageHealth.map((item) => [item._id, item.count]));
  const queued = byStatus.get(0) ?? 0;
  const sent = byStatus.get(1) ?? 0;
  const failed = byStatus.get(2) ?? 0;
  const messages = queued + sent + failed;
  const seriesMap = new Map(deliverySeries.map((item) => [item._id, item.count]));
  const series = Array.from({ length: days }, (_, index) => {
    const date = new Date(start);

    date.setUTCDate(start.getUTCDate() + index);
    const day = date.toISOString().slice(0, 10);

    return { date: day, count: seriesMap.get(day) ?? 0 };
  });

  return responseHandler(res.status(200), {
    data: {
      totals: { applications, activeApplications, users, enabledUsers, messages },
      delivery: {
        queued,
        sent,
        failed,
        deliveryRate: sent + failed > 0 ? Math.round((sent / (sent + failed)) * 1000) / 10 : 0,
      },
      report: { filters: { range, status, applicationId: applicationId ?? null }, series },
      recentMessages,
    },
    message: 'Successful',
  });
});
