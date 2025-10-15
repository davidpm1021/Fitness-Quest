import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    // Check if party_members table has new columns
    let schemaStatus = "unknown";
    try {
      const testQuery = await prisma.$queryRaw<any[]>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'party_members'
        AND column_name IN ('focus_points', 'xp', 'level', 'skill_points')
        ORDER BY column_name
      `;
      const foundColumns = testQuery.map((row) => row.column_name);
      schemaStatus = foundColumns.length === 4 ? "migrations_applied" : `missing_columns: ${4 - foundColumns.length}`;
    } catch (schemaError) {
      schemaStatus = "schema_check_failed";
    }

    return NextResponse.json({
      status: "ok",
      message: "Fitness Quest API is running",
      timestamp: new Date().toISOString(),
      database: "connected",
      schema: schemaStatus,
      environment: process.env.NODE_ENV,
      hasEnvVar: !!process.env.DATABASE_URL,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: "Database connection failed",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
