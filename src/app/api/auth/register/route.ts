import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { setSessionCookie } from "@/lib/auth";
import { publicUserSelect } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const registerSchema = z.object({
  email: z.string().email("Invalid email address").transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be 72 characters or fewer"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "An account with that email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
      select: publicUserSelect,
    });

    const response = NextResponse.json(user, { status: 201 });
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

    console.error("Register error", error);

    return NextResponse.json(
      { message: "Unable to create your account right now" },
      { status: 500 },
    );
  }
}
