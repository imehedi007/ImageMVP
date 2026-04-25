import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getExportRowsPage } from "@/lib/server/mysql";

export const runtime = "nodejs";

function escapeCsvValue(value: unknown) {
  const text = String(value ?? "");

  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const rows = await getExportRowsPage(page, 2000);
    const header = [
      "userId",
      "name",
      "phone",
      "age",
      "otpVerifiedAt",
      "bikeType",
      "environment",
      "status",
      "provider",
      "errorMessage",
      "generatedAt"
    ];

    const csv = [
      header.join(","),
      ...rows.map((row) =>
        [
          row.userId,
          row.name,
          row.phone,
          row.age,
          row.otpVerifiedAt,
          row.bikeType,
          row.environment,
          row.status,
          row.provider,
          row.errorMessage,
          row.generatedAt
        ]
          .map(escapeCsvValue)
          .join(",")
      )
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="yamaha-ai-export-page-${page}.csv"`
      }
    });
  } catch (error) {
    console.error("Failed to export admin CSV", error);
    return NextResponse.json({ message: "Could not export CSV." }, { status: 500 });
  }
}
