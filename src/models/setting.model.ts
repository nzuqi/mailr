import mongoose, { Schema, Model, Document } from 'mongoose';

type SettingDocument = Document & {
  key: string;
  value: string | null;
};

type SettingInput = {
  key: SettingDocument['key'];
  value: SettingDocument['value'];
};

const settingSchema = new Schema(
  {
    key: {
      type: Schema.Types.String,
      required: true,
      unique: true,
    },
    value: {
      type: Schema.Types.String,
      default: null,
    },
  },
  {
    collection: 'settings',
    timestamps: true,
  },
);

const Setting: Model<SettingDocument> = mongoose.model<SettingDocument>('Setting', settingSchema);

export { Setting, SettingInput, SettingDocument };
