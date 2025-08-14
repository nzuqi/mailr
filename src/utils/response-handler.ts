import { Response } from 'express';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toPlain = (item: any): AnyObj => {
  if (item && typeof item.toObject === 'function') {
    return item.toObject({ flattenMaps: true, versionKey: false, virtuals: false });
  }
  return item as AnyObj;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getByPath = (obj: AnyObj, path: string) => path.split('.').reduce((acc: any, key) => (acc == null ? undefined : acc[key]), obj);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setByPath = (obj: AnyObj, path: string, value: any) => {
  const parts = path.split('.');
  let curr = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];

    if (typeof curr[k] !== 'object' || curr[k] === null) {
      curr[k] = {};
    }
    curr = curr[k];
  }
  curr[parts[parts.length - 1]] = value;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pickOne = (item: any, fieldsToKeep: string[]) => {
  const plain = toPlain(item);
  const out: AnyObj = {};

  if (plain && typeof plain === 'object') {
    if (plain._id !== undefined) {
      out._id = plain._id;
    }
    for (const path of fieldsToKeep) {
      const val = getByPath(plain, path);

      if (val !== undefined) {
        setByPath(out, path, val);
      }
    }
  }
  return out;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const responseHandler = (res: Response, payload: any, fieldsToKeep?: string[]) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any = payload;

  if (!fieldsToKeep) {
    return res.json(result);
  }

  // Case: Paginated object { page, limit, total, totalPages, data: [...] }
  if (payload && typeof payload === 'object' && Array.isArray(payload.data)) {
    result = {
      ...payload,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: payload.data.map((item: any) => pickOne(item, fieldsToKeep)),
    };
  }
  // Case: Array of items
  else if (Array.isArray(payload)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result = payload.map((item: any) => pickOne(item, fieldsToKeep));
  }
  // Case: Single object
  else {
    result = pickOne(payload.data || payload, fieldsToKeep);
  }

  return res.json(result);
};
