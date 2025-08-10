import mongoose, { Schema, Model, Document } from 'mongoose';

type RoleDocument = Document & {
  name: string;
  description: string | null;
  permissions: string[];
  core?: boolean;
  enabled?: boolean;
};

type RoleInput = {
  name: RoleDocument['name'];
  description: RoleDocument['description'];
  permissions: RoleDocument['permissions'];
  core?: RoleDocument['core'];
  enabled?: RoleDocument['enabled'];
};

const roleSchema = new Schema(
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
    permissions: {
      type: Schema.Types.Array,
      default: [],
    },
    core: {
      type: Schema.Types.Boolean,
      default: false,
    },
    enabled: {
      type: Schema.Types.Boolean,
      default: true,
    },
  },
  {
    collection: 'roles',
    timestamps: true,
  },
);

const Role: Model<RoleDocument> = mongoose.model<RoleDocument>('Role', roleSchema);

export { Role, RoleInput, RoleDocument };
