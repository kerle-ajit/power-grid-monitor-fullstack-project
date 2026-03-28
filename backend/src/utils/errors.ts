export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const httpError = (
  statusCode: number,
  message: string,
  code?: string,
  details?: unknown
) => {
  return new AppError(statusCode, message, code, details);
};

