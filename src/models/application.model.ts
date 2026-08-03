import mongoose, { Schema, Model, Document } from 'mongoose';

export type SmtpData = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
};

type ApplicationDocument = Document & {
  name: string;
  description: string | null;
  apiKey?: string | null;
  user: string;
  enabled?: boolean;
  smtp?: SmtpData;
};

type ApplicationInput = {
  name: ApplicationDocument['name'];
  description: ApplicationDocument['description'];
  apiKey?: ApplicationDocument['apiKey'];
  user: ApplicationDocument['user'];
  enabled?: ApplicationDocument['enabled'];
  smtp?: ApplicationDocument['smtp'];
};

const applicationSchema = new Schema(
  {
    name: {
      type: Schema.Types.String,
      required: true,
      unique: true,
    },
    description: {
      type: Schema.Types.String,
      default: null,
    },
    apiKey: {
      type: Schema.Types.String,
      default: null,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    smtp: {
      type: Schema.Types.Map,
      default: null,
    },
    enabled: {
      type: Schema.Types.Boolean,
      default: true,
    },
  },
  {
    collection: 'applications',
    timestamps: true,
  },
);

// Applications without a key are allowed, while every issued key must identify
// exactly one application. A partial index avoids treating the default `null`
// value as a duplicate.
applicationSchema.index(
  { apiKey: 1 },
  {
    unique: true,
    partialFilterExpression: { apiKey: { $type: 'string' } },
  },
);

const Application: Model<ApplicationDocument> = mongoose.model<ApplicationDocument>('Application', applicationSchema);

export { Application, ApplicationInput, ApplicationDocument };
