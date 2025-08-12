import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { HttpError, ErrorCodes } from '../';
import { User } from '../../models';

type RoleType = string | string[];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const authenticate = (allowedRoles?: RoleType) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new HttpError(401, 'Authorization token missing', ErrorCodes.UNAUTHORIZED);
    }

    const token = authHeader.slice(7).trim();
    const jwtSecret = process.env.JWT_SECRET || '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let decoded: any;

    try {
      decoded = jwt.verify(token, jwtSecret);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      throw new HttpError(401, 'Invalid or expired token', ErrorCodes.UNAUTHORIZED);
    }

    // Find user with matching ID and accessToken
    const user = await User.findOne({ _id: decoded.id, accessToken: token, enabled: true, emailVerified: true }).populate('role').exec();

    if (!user) {
      throw new HttpError(401, 'Invalid token or user not found', ErrorCodes.UNAUTHORIZED);
    }

    // Role-based access control
    if (allowedRoles) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { role }: any = user;
      const userRoleName = typeof user.role === 'object' && role?.name ? role?.name : String(user.role);

      const allowedRolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      if (!allowedRolesArray.includes(userRoleName)) {
        throw new HttpError(403, 'Insufficient permissions', ErrorCodes.NOT_ALLOWED);
      }
    }

    // Attach user to request for downstream handlers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).user = user;

    next();
  } catch (err) {
    next(err);
  }
};
