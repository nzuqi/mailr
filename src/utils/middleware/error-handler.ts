import { Response } from 'express';
import { ErrorCodes } from '../error-codes';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const errorHandler = (err: any, /*req: Request,*/ res: Response /*next: NextFunction*/) => {
  console.error('Error:', err);

  // Handle MongoDB duplicate key error
  // Uncomment to send unnecessary information to clients
  // if (err.code === 11000 && err.keyValue) {
  //     const field = Object.keys(err.keyValue)[0];
  //     const value = err.keyValue[field];

  //     return res.status(409).json({
  //         error: ErrorCodes.DUPLICATE_KEY,
  //         message: `Document with ${field} '${value}' already exists.`,
  //     });
  // }

  // Handle custom errors thrown by HttpError
  if (err.status && err.message) {
    return res.status(err.status).json({
      error: err.code || ErrorCodes.CUSTOM,
      message: err.message,
    });
  }

  // Generic fallback
  res.status(500).json({
    error: ErrorCodes.INTERNAL,
    message: 'An unexpected error occurred.',
  });
};
