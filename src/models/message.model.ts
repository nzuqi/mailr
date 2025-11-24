import mongoose, { Schema, Model, Document } from 'mongoose';

export type Attachment = {
  filename: string;
  type: string;
  content: string; // Base64
  disposition?: string; // optional
};

type MessageDocument = Document & {
  from: string;
  to: string[];
  subject: string;
  message: string;
  application: string;
  user: string | null;
  status: number; // 0: Queued, 1: Sent, 2: Failed
  urgent: boolean;
  sentAt?: Date;
  retryCount?: number;
  error?: string;
  attachments?: Attachment[];
};

type MessageInput = {
  from: MessageDocument['from'];
  to: MessageDocument['to'];
  subject: MessageDocument['subject'];
  message: MessageDocument['message'];
  application: MessageDocument['application'];
  user?: MessageDocument['user'];
  status?: MessageDocument['status'];
  urgent?: MessageDocument['urgent'];
  attachments?: Attachment[];
};

const attachmentSchema = new Schema<Attachment>(
  {
    filename: { type: Schema.Types.String, required: true },
    type: { type: Schema.Types.String, required: true },
    content: { type: Schema.Types.String, required: true }, // Base64
    disposition: { type: Schema.Types.String, default: 'attachment' },
  },
  { _id: false },
);

const messageSchema = new Schema(
  {
    from: {
      type: Schema.Types.String,
      required: true,
    },
    to: {
      type: Schema.Types.Array,
      required: true,
    },
    subject: {
      type: Schema.Types.String,
      required: true,
    },
    message: {
      type: Schema.Types.String,
      required: true,
    },
    application: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    user: {
      type: Schema.Types.String,
      default: null,
    },
    status: {
      type: Schema.Types.Number,
      default: 0,
    },
    urgent: {
      type: Schema.Types.Boolean,
      default: false,
    },
    sentAt: {
      type: Schema.Types.Date,
      default: null,
    },
    error: {
      type: Schema.Types.String,
      default: null,
    },
    retryCount: {
      type: Schema.Types.Number,
      default: 0,
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
  },
  {
    collection: 'messages',
    timestamps: true,
  },
);

const Message: Model<MessageDocument> = mongoose.model<MessageDocument>('Message', messageSchema);

export { Message, MessageInput, MessageDocument };
