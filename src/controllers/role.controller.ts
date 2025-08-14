import { Request, Response } from 'express';
import { Role, RoleInput } from '../models';
import { asyncHandler, buildQueryOptions, deleteHandler, ErrorCodes, HttpError, responseHandler } from '../utils';

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const { core, description, enabled, name, permissions } = req.body || {};

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

  return responseHandler(res.status(201), { data: roleCreated, message: 'Role created successfully' }, [
    'name',
    'description',
    'permissions',
    'core',
    'enabled',
    'createdAt',
    'updatedAt',
  ]);
});

export const getAllRoles = asyncHandler(async (req: Request, res: Response) => {
  const { filter, pagination, sort } = buildQueryOptions(req, ['name', 'description', 'createdAt', 'updatedAt']);

  const [data, total] = await Promise.all([
    Role.find(filter).sort(sort).skip(pagination.skip).limit(pagination.limit).exec(),
    Role.countDocuments(filter),
  ]);

  return responseHandler(
    res.status(200),
    {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
      data,
      message: 'Successful',
    },
    ['name', 'description', 'permissions', 'core', 'enabled', 'createdAt', 'updatedAt'],
  );
});

export const getRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const role = await Role.findOne({ _id: id });

  if (!role) {
    throw new HttpError(404, `Role with id '${id}' not found.`, ErrorCodes.NOT_FOUND);
  }

  return responseHandler(res.status(200), { data: role }, ['name', 'description', 'permissions', 'core', 'enabled', 'createdAt', 'updatedAt']);
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { core, description, enabled, name, permissions } = req.body || {};

  if (typeof name !== 'string' || typeof description !== 'string' || !Array.isArray(permissions) || permissions.length === 0) {
    throw new HttpError(422, 'Name, description, and permissions are required and must be valid.', ErrorCodes.VALIDATION);
  }

  const roleUpdated = await Role.findByIdAndUpdate(id, { name, description, permissions, core, enabled }, { new: true, runValidators: true });

  if (!roleUpdated) {
    throw new HttpError(404, `Role with id '${id}' not found.`, ErrorCodes.NOT_FOUND);
  }

  return responseHandler(
    res.status(200),
    {
      data: roleUpdated,
      message: 'Role updated successfully',
    },
    ['name', 'description', 'permissions', 'core', 'enabled', 'createdAt', 'updatedAt'],
  );
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

  return responseHandler(res.status(200), result, ['name', 'description', 'permissions', 'core', 'enabled', 'createdAt', 'updatedAt']);
});
