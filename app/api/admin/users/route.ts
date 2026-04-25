import { NextRequest, NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPaginatedUsers, getUsersCount } from "@/lib/server/mysql";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(5, Number(request.nextUrl.searchParams.get("limit") || "15")));

    const [rows, total] = await Promise.all([getPaginatedUsers(page, limit), getUsersCount()]);

    return NextResponse.json({
      rows,
      total,
      page,
      pageCount: Math.max(1, Math.ceil(total / limit))
    });
  } catch (error) {
    console.error("Failed to load paginated users", error);
    return NextResponse.json({ message: "Could not load users." }, { status: 500 });
  }
}
