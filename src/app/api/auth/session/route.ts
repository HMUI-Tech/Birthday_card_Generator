import { NextResponse, type NextRequest } from "next/server";

import { clearSessionCookie } from "@/lib/auth";
import { cardSummarySelect, getSessionUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);

    if (!user) {
      return NextResponse.json({ message: "Not signed in" }, { status: 401 });
    }

    const cards = await prisma.card.findMany({
      where: { userId: user.id },
      select: cardSummarySelect,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ user, cards }, { status: 200 });
  } catch (error) {
    console.error("Session error", error);

    if (
      error instanceof Error &&
      error.name === "PrismaClientValidationError" &&
      error.message.includes("Unknown field")
    ) {
      return NextResponse.json(
        {
          message:
            "The running Next.js dev server is using an outdated Prisma runtime. Run db push and prisma generate, stop all next dev processes, delete .next, and restart the dev server.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Unable to load the current session" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json(
    { message: "Signed out successfully" },
    { status: 200 },
  );

  clearSessionCookie(response);

  return response;
}
