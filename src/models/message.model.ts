import mongoose, { Schema, Model, Document } from 'mongoose';

type MessageDocument = Document & {
  from: string;
  to: string[];
  subject: string;
  message: string;
  application: string;
  user: string;
  status: number; // 0: Queued, 1: Sent, 2: Failed
  urgent: boolean;
  sentAt?: Date;
  retryCount?: number;
  error?: string;
};

type MessageInput = {
  from: MessageDocument['from'];
  to: MessageDocument['to'];
  subject: MessageDocument['subject'];
  message: MessageDocument['message'];
  application: MessageDocument['application'];
  user: MessageDocument['user'];
  status?: MessageDocument['status'];
  urgent?: MessageDocument['urgent'];
};

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
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
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
  },
  {
    collection: 'messages',
    timestamps: true,
  },
);

const Message: Model<MessageDocument> = mongoose.model<MessageDocument>('Message', messageSchema);

export { Message, MessageInput, MessageDocument };
