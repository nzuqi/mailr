import { HttpError } from './http-error';
import { ErrorCodes } from './error-codes';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type DeleteHandlerOptions<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any;
  id?: string;
  ids?: string[];
  resourceName: string;
  returnDeletedDocs?: boolean;
};

export async function deleteHandler<T>({ id, ids, model, resourceName, returnDeletedDocs = false }: DeleteHandlerOptions<T>) {
  // Single delete
  if (id) {
    const deletedDoc = await model.findByIdAndDelete(id);

    if (!deletedDoc) {
      throw new HttpError(404, `${resourceName} with id '${id}' not found.`, ErrorCodes.NOT_FOUND);
    }
    return {
      message: `${resourceName} deleted successfully.`,
      data: returnDeletedDocs ? deletedDoc : undefined,
    };
  }

  // Bulk delete
  if (Array.isArray(ids) && ids.length > 0) {
    let docsToDelete: T[] = [];

    if (returnDeletedDocs) {
      docsToDelete = await model.find({ _id: { $in: ids } });
    }

    const result = await model.deleteMany({ _id: { $in: ids } });

    if (result.deletedCount === 0) {
      throw new HttpError(404, `No matching ${resourceName.toLowerCase()}s found for deletion.`, ErrorCodes.NOT_FOUND);
    }

    return {
      message: `Deleted ${result.deletedCount} ${resourceName.toLowerCase()}(s) successfully.`,
      deletedCount: result.deletedCount,
      data: returnDeletedDocs ? docsToDelete : undefined,
    };
  }

  throw new HttpError(422, 'Provide either a single id or a non-empty array of ids.', ErrorCodes.VALIDATION);
}
