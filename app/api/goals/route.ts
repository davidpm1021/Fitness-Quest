import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isErrorResponse } from "@/lib/middleware";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// GET /api/goals - List user's goals
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;

  try {
    const goals = await prisma.goal.findMany({
      where: {
        userId: user.userId,
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: { goals },
    } as ApiResponse);
  } catch (error) {
    console.error("Error fetching goals:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch goals",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// POST /api/goals - Create a new goal
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;

  try {
    const body = await request.json();
    const { goalType, name, targetValue, targetUnit, flexPercentage } = body;

    // Validate required fields
    if (!goalType || !name) {
      return NextResponse.json(
        {
          success: false,
          error: "Goal type and name are required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Check user doesn't have more than 5 active goals
    const activeGoalsCount = await prisma.goal.count({
      where: {
        userId: user.userId,
        isActive: true,
      },
    });

    if (activeGoalsCount >= 5) {
      return NextResponse.json(
        {
          success: false,
          error: "You can have a maximum of 5 active goals",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Create the goal
    const goal = await prisma.goal.create({
      data: {
        userId: user.userId,
        goalType: goalType.toUpperCase(),
        name,
        targetValue: targetValue ? parseFloat(targetValue) : null,
        targetUnit: targetUnit || null,
        flexPercentage: flexPercentage ? parseInt(flexPercentage) : 10,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { goal },
        message: "Goal created successfully",
      } as ApiResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating goal:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create goal",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
