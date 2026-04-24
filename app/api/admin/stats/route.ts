import { NextRequest, NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getDashboardOverview, getRecentGenerationRows, searchUsersByPhone } from "@/lib/server/mysql";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const search = request.nextUrl.searchParams.get("phone")?.trim() || "";
    const [overview, recentRows, searchResults] = await Promise.all([
      getDashboardOverview(),
      getRecentGenerationRows(30),
      search ? searchUsersByPhone(search) : Promise.resolve([])
    ]);

    return NextResponse.json({
      overview,
      recentRows,
      searchResults
    });
  } catch (error) {
    console.error("Failed to load admin stats", error);
    return NextResponse.json({ message: "Could not load dashboard stats." }, { status: 500 });
  }
}
