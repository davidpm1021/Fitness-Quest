import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      message: "Fitness Quest API is running",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Database connection failed",
        timestamp: new Date().toISOString(),
        database: "disconnected",
      },
      { status: 500 }
    );
  }
}
