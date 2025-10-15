import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    // Check if party_members table has ALL required columns
    let schemaStatus = "unknown";
    let missingColumns: string[] = [];
    try {
      const requiredColumns = [
        'focus_points',
        'xp',
        'level',
        'skill_points',
        'welcome_back_active',
        'welcome_back_remaining',
        'welcome_back_activated_at',
        'welcome_back_acknowledged'
      ];

      const testQuery = await prisma.$queryRaw<any[]>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'party_members'
        ORDER BY column_name
      `;
      const foundColumns = testQuery.map((row) => row.column_name);
      missingColumns = requiredColumns.filter(col => !foundColumns.includes(col));

      if (missingColumns.length === 0) {
        schemaStatus = "all_migrations_applied";
      } else {
        schemaStatus = `missing_${missingColumns.length}_columns`;
      }
    } catch (schemaError) {
      schemaStatus = "schema_check_failed";
    }

    return NextResponse.json({
      status: "ok",
      message: "Fitness Quest API is running",
      timestamp: new Date().toISOString(),
      database: "connected",
      schema: schemaStatus,
      missingColumns: missingColumns.length > 0 ? missingColumns : undefined,
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
