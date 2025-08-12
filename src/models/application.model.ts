import mongoose, { Schema, Model, Document } from 'mongoose';

type ApplicationDocument = Document & {
  name: string;
  description: string | null;
  apiKey?: string | null;
  user: string;
  enabled?: boolean;
};

type ApplicationInput = {
  name: ApplicationDocument['name'];
  description: ApplicationDocument['description'];
  apiKey?: ApplicationDocument['apiKey'];
  user: ApplicationDocument['user'];
  enabled?: ApplicationDocument['enabled'];
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

const Application: Model<ApplicationDocument> = mongoose.model<ApplicationDocument>('Application', applicationSchema);

export { Application, ApplicationInput, ApplicationDocument };
