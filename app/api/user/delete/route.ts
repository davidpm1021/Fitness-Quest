import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isErrorResponse } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/types";
import bcrypt from "bcryptjs";

export async function DELETE(req: NextRequest) {
  const authResult = await authenticateRequest(req);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;

  try {

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

    // Get user data
    const userData = await prisma.users.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        password_hash: true,
        email: true,
      },
    });

    if (!userData) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.password_hash);

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
      await tx.character_appearances.deleteMany({
        where: { user_id: userData.id },
      });

      // Delete goals and their check-ins
      const goals = await tx.goals.findMany({
        where: { user_id: userData.id },
        select: { id: true },
      });

      if (goals.length > 0) {
        const goalIds = goals.map((g) => g.id);

        // Delete goal check-ins
        await tx.goal_check_ins.deleteMany({
          where: { goal_id: { in: goalIds } },
        });

        // Delete goals
        await tx.goals.deleteMany({
          where: { user_id: userData.id },
        });
      }

      // Get party memberships
      const partyMemberships = await tx.party_members.findMany({
        where: { user_id: userData.id },
        select: { id: true, party_id: true },
      });

      if (partyMemberships.length > 0) {
        const memberIds = partyMemberships.map((m) => m.id);

        // Delete check-ins associated with this user's party memberships
        await tx.check_ins.deleteMany({
          where: { party_member_id: { in: memberIds } },
        });

        // Delete party memberships
        await tx.party_members.deleteMany({
          where: { user_id: userData.id },
        });

        // Check if any parties are now empty and delete them
        for (const membership of partyMemberships) {
          const remainingMembers = await tx.party_members.count({
            where: { party_id: membership.party_id },
          });

          if (remainingMembers === 0) {
            // Delete party monsters
            await tx.party_monsters.deleteMany({
              where: { party_id: membership.party_id },
            });

            // Delete the party
            await tx.parties.delete({
              where: { id: membership.party_id },
            });
          }
        }
      }

      // Finally, delete the user
      await tx.users.delete({
        where: { id: userData.id },
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
