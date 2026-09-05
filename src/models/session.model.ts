import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type SessionDocument = Document & {
  user: Types.ObjectId;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

const sessionSchema = new Schema<SessionDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refreshTokenHash: { type: Schema.Types.String, required: true, select: false },
    expiresAt: { type: Schema.Types.Date, required: true, index: { expires: 0 } },
    revokedAt: { type: Schema.Types.Date, default: null },
    ipAddress: { type: Schema.Types.String, default: null },
    userAgent: { type: Schema.Types.String, default: null },
  },
  { collection: 'sessions', timestamps: true },
);

const Session: Model<SessionDocument> = mongoose.model<SessionDocument>('Session', sessionSchema);

export { Session };
