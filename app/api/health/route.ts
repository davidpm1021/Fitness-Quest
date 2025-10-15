import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();

  try {
    // Test database connection - this will wake up Neon if it's sleeping
    await prisma.$queryRaw`SELECT 1`;

    const responseTime = Date.now() - startTime;

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

    // Determine if this was a cold start (>3 seconds means database was waking up)
    const wasColdStart = responseTime > 3000;

    return NextResponse.json({
      status: "ok",
      message: wasColdStart
        ? "Database was cold starting, now connected"
        : "Fitness Quest API is running",
      timestamp: new Date().toISOString(),
      database: "connected",
      responseTime: responseTime,
      coldStart: wasColdStart,
      schema: schemaStatus,
      missingColumns: missingColumns.length > 0 ? missingColumns : undefined,
      environment: process.env.NODE_ENV,
      hasEnvVar: !!process.env.DATABASE_URL,
    });
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    // Check if it's a timeout/connection error (indicates cold start in progress)
    const isColdStart = responseTime > 5000 ||
      error.message.includes("timeout") ||
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("connect ETIMEDOUT") ||
      error.message.includes("Connection terminated unexpectedly");

    return NextResponse.json(
      {
        status: isColdStart ? "waking_up" : "error",
        message: isColdStart
          ? "Database is waking up from sleep, please wait..."
          : "Database connection failed",
        timestamp: new Date().toISOString(),
        database: isColdStart ? "cold_start" : "disconnected",
        responseTime: responseTime,
        error: error.message,
      },
      { status: isColdStart ? 503 : 500 }
    );
  }
}
