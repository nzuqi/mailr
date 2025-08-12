import mongoose, { Schema, Model, Document } from 'mongoose';

type UserDocument = Document & {
  name: string;
  email: string;
  password: string;
  emailVerified?: boolean;
  verificationInfo?: Record<string, string | number | boolean> | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  passwordResetInfo?: Record<string, string | number | boolean> | null;
  enabled?: boolean;
  role: string;
};

type UserInput = {
  name: string;
  email: UserDocument['email'];
  password: UserDocument['password'];
  role: UserDocument['role'];
  verificationInfo?: UserDocument['verificationInfo'];
};

const usersSchema = new Schema(
  {
    name: {
      type: Schema.Types.String,
      required: true,
    },
    email: {
      type: Schema.Types.String,
      required: true,
      unique: true,
    },
    password: {
      type: Schema.Types.String,
      required: true,
    },
    emailVerified: {
      type: Schema.Types.Boolean,
      default: false,
    },
    verificationInfo: {
      type: Schema.Types.Map,
      default: null,
    },
    accessToken: {
      type: Schema.Types.String,
      default: null,
    },
    refreshToken: {
      type: Schema.Types.String,
      default: null,
    },
    passwordResetInfo: {
      type: Schema.Types.Map,
      default: null,
    },
    enabled: {
      type: Schema.Types.Boolean,
      default: true,
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
      index: true,
    },
  },
  {
    collection: 'users',
    timestamps: true,
  },
);

const User: Model<UserDocument> = mongoose.model<UserDocument>('User', usersSchema);

export { User, UserInput, UserDocument };
