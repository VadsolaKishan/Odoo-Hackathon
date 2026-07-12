import { Request, Response, NextFunction } from "express";
import { AppError } from "../shared/errors";
import { createErrorResponse } from "../shared/response";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Error:", err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json(
      createErrorResponse(err.message, (err as any).errors)
    );
  }

  // Handle generic errors
  res.status(500).json(createErrorResponse("Internal Server Error"));
}
