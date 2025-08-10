import { Request, Response } from 'express';
import { Role, RoleInput } from '../models';
import { asyncHandler, deleteHandler, ErrorCodes, HttpError } from '../utils';

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const { core, description, enabled, name, permissions } = req.body;

  if (typeof name !== 'string' || typeof description !== 'string' || !Array.isArray(permissions) || permissions.length === 0) {
    throw new HttpError(422, 'Name, description, and permissions are required and must be valid.', ErrorCodes.VALIDATION);
  }

  const roleInput: RoleInput = {
    name: name.trim(),
    description: description.trim(),
    permissions,
    core,
    enabled,
  };

  const roleCreated = await Role.create(roleInput);

  return res.status(201).json({ data: roleCreated, message: 'Role created successfully' });
});

export const getAllRoles = asyncHandler(async (req: Request, res: Response) => {
  const roles = await Role.find().sort('-createdAt').exec();

  return res.status(200).json({ data: roles });
});

export const getRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const role = await Role.findOne({ _id: id });

  if (!role) {
    throw new HttpError(404, `Role with id '${id}' not found.`, ErrorCodes.NOT_FOUND);
  }

  return res.status(200).json({ data: role });
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { core, description, enabled, name, permissions } = req.body;

  if (typeof name !== 'string' || typeof description !== 'string' || !Array.isArray(permissions) || permissions.length === 0) {
    throw new HttpError(422, 'Name, description, and permissions are required and must be valid.', ErrorCodes.VALIDATION);
  }

  const roleUpdated = await Role.findByIdAndUpdate(id, { name, description, permissions, core, enabled }, { new: true, runValidators: true });

  if (!roleUpdated) {
    throw new HttpError(404, `Role with id '${id}' not found.`, ErrorCodes.NOT_FOUND);
  }

  return res.status(200).json({
    data: roleUpdated,
    message: 'Role updated successfully',
  });
});

export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params; // single delete
  const { ids } = req.body || {}; // bulk delete

  const result = await deleteHandler({
    model: Role,
    id,
    ids,
    resourceName: 'Role',
    returnDeletedDocs: true,
  });

  return res.status(200).json(result);
});
