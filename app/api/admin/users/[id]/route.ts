import { NextRequest, NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getUserDetail } from "@/lib/server/mysql";

export const runtime = "nodejs";

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const userId = Number(id);

    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ message: "Invalid user id." }, { status: 400 });
    }

    const detail = await getUserDetail(userId);

    if (!detail) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    console.error("Failed to load user detail", error);
    return NextResponse.json({ message: "Could not load user detail." }, { status: 500 });
  }
}
