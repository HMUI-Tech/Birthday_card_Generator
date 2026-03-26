import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { setSessionCookie } from "@/lib/auth";
import { publicUserSelect } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().email("Invalid email address").transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        ...publicUserSelect,
        passwordHash: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    const isPasswordValid = await compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    const response = NextResponse.json(
      {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      { status: 200 },
    );

    setSessionCookie(response, user.id);

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Please provide a valid email and password",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("Login error", error);

    return NextResponse.json(
      { message: "Unable to sign in right now" },
      { status: 500 },
    );
  }
}
