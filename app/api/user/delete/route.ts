import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/types/api";
import bcrypt from "bcryptjs";

export async function DELETE(req: NextRequest) {
  try {
    // Get token from header
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - No token provided",
        } as ApiResponse,
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Invalid token",
        } as ApiResponse,
        { status: 401 }
      );
    }

    const { password } = await req.json();

    // Validate password
    if (!password) {
      return NextResponse.json(
        {
          success: false,
          error: "Password is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        passwordHash: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Incorrect password",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Delete user and all related data in a transaction
    // Prisma cascade delete will handle related records
    await prisma.$transaction(async (tx) => {
      // Delete character appearance
      await tx.characterAppearance.deleteMany({
        where: { userId: user.id },
      });

      // Delete goals and their check-ins
      const goals = await tx.goal.findMany({
        where: { userId: user.id },
        select: { id: true },
      });

      if (goals.length > 0) {
        const goalIds = goals.map((g) => g.id);

        // Delete goal check-ins
        await tx.goalCheckIn.deleteMany({
          where: { goalId: { in: goalIds } },
        });

        // Delete goals
        await tx.goal.deleteMany({
          where: { userId: user.id },
        });
      }

      // Get party memberships
      const partyMemberships = await tx.partyMember.findMany({
        where: { userId: user.id },
        select: { id: true, partyId: true },
      });

      if (partyMemberships.length > 0) {
        const memberIds = partyMemberships.map((m) => m.id);

        // Delete check-ins associated with this user's party memberships
        await tx.checkIn.deleteMany({
          where: { partyMemberId: { in: memberIds } },
        });

        // Delete party memberships
        await tx.partyMember.deleteMany({
          where: { userId: user.id },
        });

        // Check if any parties are now empty and delete them
        for (const membership of partyMemberships) {
          const remainingMembers = await tx.partyMember.count({
            where: { partyId: membership.partyId },
          });

          if (remainingMembers === 0) {
            // Delete party monsters
            await tx.partyMonster.deleteMany({
              where: { partyId: membership.partyId },
            });

            // Delete the party
            await tx.party.delete({
              where: { id: membership.partyId },
            });
          }
        }
      }

      // Finally, delete the user
      await tx.user.delete({
        where: { id: user.id },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account deleted successfully",
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete account",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
