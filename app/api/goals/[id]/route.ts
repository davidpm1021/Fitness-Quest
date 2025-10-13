import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isErrorResponse } from "@/lib/middleware";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// PUT /api/goals/:id - Update a goal
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;
  const { id } = await params;

  try {
    // Check if goal exists and belongs to user
    const existingGoal = await prisma.goals.findUnique({
      where: { id },
    });

    if (!existingGoal) {
      return NextResponse.json(
        {
          success: false,
          error: "Goal not found",
        } as ApiResponse,
        { status: 404 }
      );
    }

    if (existingGoal.userId !== user.userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized to update this goal",
        } as ApiResponse,
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, targetValue, targetUnit, flexPercentage, isActive } = body;

    // Update the goal
    const goal = await prisma.goals.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(targetValue !== undefined && { targetValue: parseFloat(targetValue) }),
        ...(targetUnit !== undefined && { targetUnit }),
        ...(flexPercentage !== undefined && { flexPercentage: parseInt(flexPercentage) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({
      success: true,
      data: { goal },
      message: "Goal updated successfully",
    } as ApiResponse);
  } catch (error) {
    console.error("Error updating goal:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update goal",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// DELETE /api/goals/:id - Deactivate a goal (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;
  const { id } = await params;

  try {
    // Check if goal exists and belongs to user
    const existingGoal = await prisma.goals.findUnique({
      where: { id },
    });

    if (!existingGoal) {
      return NextResponse.json(
        {
          success: false,
          error: "Goal not found",
        } as ApiResponse,
        { status: 404 }
      );
    }

    if (existingGoal.userId !== user.userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized to delete this goal",
        } as ApiResponse,
        { status: 403 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.goals.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: "Goal deactivated successfully",
    } as ApiResponse);
  } catch (error) {
    console.error("Error deleting goal:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete goal",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
