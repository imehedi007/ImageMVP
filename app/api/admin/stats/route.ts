import { NextRequest, NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  getDashboardOverview,
  getExportRowCount,
  getRecentGenerationRows,
  searchUsersByPhone
} from "@/lib/server/mysql";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const search = request.nextUrl.searchParams.get("phone")?.trim() || "";
    const [overview, recentRows, searchResults, exportRowCount] = await Promise.all([
      getDashboardOverview(),
      getRecentGenerationRows(20),
      search ? searchUsersByPhone(search) : Promise.resolve([]),
      getExportRowCount()
    ]);

    return NextResponse.json({
      overview,
      recentRows,
      searchResults,
      exportPageCount: Math.max(1, Math.ceil(exportRowCount / 2000))
    });
  } catch (error) {
    console.error("Failed to load admin stats", error);
    return NextResponse.json({ message: "Could not load dashboard stats." }, { status: 500 });
  }
}
