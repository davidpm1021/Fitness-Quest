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
    const goals = await prisma.goals.findMany({
      where: {
        user_id: user.userId,
        is_active: true,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    // Map snake_case DB fields to camelCase for frontend
    const mappedGoals = goals.map((goal) => ({
      id: goal.id,
      name: goal.name,
      goalType: goal.goal_type,
      goalMeasurementType: goal.goal_measurement_type,
      targetValue: goal.target_value,
      targetUnit: goal.target_unit,
      isActive: goal.is_active,
      createdAt: goal.created_at,
      updatedAt: goal.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: { goals: mappedGoals },
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
    const { goalType, goalMeasurementType, name, targetValue, targetUnit } = body;

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

    // Default to TARGET_VALUE if not specified
    const measurementType = goalMeasurementType || 'TARGET_VALUE';

    // Check user doesn't have more than 5 active goals
    const activeGoalsCount = await prisma.goals.count({
      where: {
        user_id: user.userId,
        is_active: true,
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
    const goalId = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const goal = await prisma.goals.create({
      data: {
        id: goalId,
        user_id: user.userId,
        goal_type: goalType.toUpperCase(),
        goal_measurement_type: measurementType,
        name,
        target_value: targetValue ? parseFloat(targetValue) : null,
        target_unit: targetUnit || null,
        is_active: true,
        updated_at: new Date(),
      },
    });

    // Map snake_case DB fields to camelCase for frontend
    const mappedGoal = {
      id: goal.id,
      name: goal.name,
      goalType: goal.goal_type,
      goalMeasurementType: goal.goal_measurement_type,
      targetValue: goal.target_value,
      targetUnit: goal.target_unit,
      isActive: goal.is_active,
      createdAt: goal.created_at,
      updatedAt: goal.updated_at,
    };

    return NextResponse.json(
      {
        success: true,
        data: { goal: mappedGoal },
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
