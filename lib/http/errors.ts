import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function badRequest(message = "Request validation failed.") {
  return new HttpError(400, message);
}

export function unauthorized(message = "Authentication required.") {
  return new HttpError(401, message);
}

export function forbidden(message = "Request is not allowed.") {
  return new HttpError(403, message);
}

export function notFound(message = "Resource not found.") {
  return new HttpError(404, message);
}

export function errorResponse(error: unknown) {
  console.error("[api/error]", error);

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Request validation failed.", issues: error.flatten() },
      { status: 400 }
    );
  }

  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
}
