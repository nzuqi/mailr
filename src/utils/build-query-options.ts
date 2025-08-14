import { Request } from 'express';

type Pagination = {
  page: number;
  limit: number;
  skip: number;
};

type Sort = Record<string, 1 | -1>;

type BuildQueryResult = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter: Record<string, any>;
  pagination: Pagination;
  sort: Sort;
};

/**
 * Build pagination, sorting, and filtering options from request query.
 * Supports:
 * - Case-insensitive partial matches
 * - Date ranges (field_gte, field_lte)
 * - Number ranges (field_min, field_max)
 *
 * Example requests supported;
 *
 * Pagination & sorting
 * GET /v1/users?page=2&limit=20&sortBy=name&sortOrder=asc
 *
 * Partial search
 * GET /v1/users?name=john&email=gmail
 *
 * Date range
 * GET /v1/messages?createdAt_gte=2025-08-01&createdAt_lte=2025-08-14
 *
 * Number range
 * GET /v1/products?price_min=100&price_max=500
 *
 */
export const buildQueryOptions = (req: Request, allowedFilters: string[]): BuildQueryResult => {
  // Pagination
  const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 10));
  const skip = (page - 1) * limit;

  // Sorting
  const sortBy = (req.query.sortBy as string) || 'createdAt';
  const sortOrder = (req.query.sortOrder as string)?.toLowerCase() === 'asc' ? 1 : -1;
  const sort: Sort = { [sortBy]: sortOrder };

  // Filtering
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};

  for (const key of allowedFilters) {
    const value = req.query[key];
    const gte = req.query[`${key}_gte`];
    const lte = req.query[`${key}_lte`];
    const min = req.query[`${key}_min`];
    const max = req.query[`${key}_max`];

    // Partial text match
    if (value) {
      filter[key] = { $regex: String(value), $options: 'i' };
    }

    // Date range
    if (gte || lte) {
      filter[key] = {
        ...(filter[key] || {}),
        ...(gte ? { $gte: new Date(String(gte)) } : {}),
        ...(lte ? { $lte: new Date(String(lte)) } : {}),
      };
    }

    // Number range
    if (min || max) {
      filter[key] = {
        ...(filter[key] || {}),
        ...(min ? { $gte: Number(min) } : {}),
        ...(max ? { $lte: Number(max) } : {}),
      };
    }
  }

  return {
    filter,
    pagination: { page, limit, skip },
    sort,
  };
};
