import type { ApiError } from "./models";

export class ServiceError extends Error {
  apiError: ApiError;

  constructor(apiError: ApiError) {
    super(apiError.title || apiError.type);
    this.apiError = apiError;
  }
}
