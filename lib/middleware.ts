import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromHeader, verifyToken, JWTPayload } from "./auth";

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

/**
 * Middleware to authenticate requests using JWT
 * Returns user data if authenticated, or error response if not
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<{ user: JWTPayload } | NextResponse> {
  const authHeader = request.headers.get("authorization");
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return NextResponse.json(
      { success: false, error: "No authentication token provided" },
      { status: 401 }
    );
  }

  const user = verifyToken(token);

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Invalid or expired token" },
      { status: 401 }
    );
  }

  return { user };
}

/**
 * Helper to check if the result is an error response
 */
export function isErrorResponse(
  result: { user: JWTPayload } | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
