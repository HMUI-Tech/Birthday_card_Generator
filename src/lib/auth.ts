import type { NextRequest, NextResponse } from "next/server";
import { sign, verify } from "jsonwebtoken";

export const sessionCookieName = "session";

const sessionMaxAge = 60 * 60 * 24 * 7;

type SessionPayload = {
  userId: string;
};

function getJwtSecret() {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET environment variable is not defined");
  }

  return jwtSecret;
}

export function createSessionToken(userId: string) {
  return sign({ userId }, getJwtSecret(), {
    expiresIn: "7d",
  });
}

export function getSessionUserId(request: NextRequest) {
  const token = request.cookies.get(sessionCookieName)?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = verify(token, getJwtSecret()) as SessionPayload;
    return typeof payload.userId === "string" ? payload.userId : null;
  } catch {
    return null;
  }
}

export function setSessionCookie(response: NextResponse, userId: string) {
  response.cookies.set({
    name: sessionCookieName,
    value: createSessionToken(userId),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionMaxAge,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: sessionCookieName,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
