import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isErrorResponse } from "@/lib/middleware";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// GET /api/announcements - Get all published announcements
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;

  try {
    // Get all published announcements
    const announcements = await prisma.feature_announcements.findMany({
      where: {
        is_published: true,
      },
      orderBy: [
        {
          category: "asc", // Group by category
        },
        {
          release_date: "desc", // Most recent first within category
        },
      ],
    });

    // Get user's announcement views
    const viewedAnnouncements = await prisma.announcement_views.findMany({
      where: {
        user_id: user.userId,
      },
      select: {
        announcement_id: true,
        viewed_at: true,
      },
    });

    const viewedMap = new Map(
      viewedAnnouncements.map((v) => [v.announcement_id, v.viewed_at])
    );

    // Map to camelCase and add viewed status
    const mappedAnnouncements = announcements.map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      description: announcement.description,
      category: announcement.category,
      version: announcement.version,
      releaseDate: announcement.release_date,
      isPublished: announcement.is_published,
      sortOrder: announcement.sort_order,
      createdAt: announcement.created_at,
      updatedAt: announcement.updated_at,
      isViewed: viewedMap.has(announcement.id),
      viewedAt: viewedMap.get(announcement.id) || null,
    }));

    // Count unread announcements (not viewed)
    const unreadCount = mappedAnnouncements.filter((a) => !a.isViewed).length;

    // Get user's last seen timestamp
    const userInfo = await prisma.users.findUnique({
      where: { id: user.userId },
      select: { last_seen_announcement_at: true },
    });

    // Find new announcements since last seen
    const newAnnouncements = userInfo?.last_seen_announcement_at
      ? mappedAnnouncements.filter(
          (a) =>
            !a.isViewed &&
            new Date(a.releaseDate) > new Date(userInfo.last_seen_announcement_at!)
        )
      : mappedAnnouncements.filter((a) => !a.isViewed);

    return NextResponse.json({
      success: true,
      data: {
        announcements: mappedAnnouncements,
        unreadCount,
        newAnnouncementsCount: newAnnouncements.length,
        newAnnouncements: newAnnouncements.slice(0, 5), // Show max 5 in popup
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch announcements",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// POST /api/announcements/mark-read - Mark announcements as read
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { user } = authResult;

  try {
    const body = await request.json();
    const { announcementIds } = body as { announcementIds?: string[] };

    if (!announcementIds || announcementIds.length === 0) {
      // Mark all published announcements as read
      const allPublished = await prisma.feature_announcements.findMany({
        where: { is_published: true },
        select: { id: true },
      });

      const ids = allPublished.map((a) => a.id);

      // Create view records for announcements not already viewed
      const existingViews = await prisma.announcement_views.findMany({
        where: {
          user_id: user.userId,
          announcement_id: { in: ids },
        },
        select: { announcement_id: true },
      });

      const existingViewIds = new Set(existingViews.map((v) => v.announcement_id));
      const newViewRecords = ids
        .filter((id) => !existingViewIds.has(id))
        .map((id) => ({
          id: crypto.randomUUID(),
          user_id: user.userId,
          announcement_id: id,
        }));

      if (newViewRecords.length > 0) {
        await prisma.announcement_views.createMany({
          data: newViewRecords,
        });
      }

      // Update user's last seen timestamp
      await prisma.users.update({
        where: { id: user.userId },
        data: { last_seen_announcement_at: new Date() },
      });

      return NextResponse.json({
        success: true,
        message: `Marked ${newViewRecords.length} announcements as read`,
        data: { markedCount: newViewRecords.length },
      } as ApiResponse);
    }

    // Mark specific announcements as read
    const existingViews = await prisma.announcement_views.findMany({
      where: {
        user_id: user.userId,
        announcement_id: { in: announcementIds },
      },
      select: { announcement_id: true },
    });

    const existingViewIds = new Set(existingViews.map((v) => v.announcement_id));
    const newViewRecords = announcementIds
      .filter((id) => !existingViewIds.has(id))
      .map((id) => ({
        id: crypto.randomUUID(),
        user_id: user.userId,
        announcement_id: id,
      }));

    if (newViewRecords.length > 0) {
      await prisma.announcement_views.createMany({
        data: newViewRecords,
      });
    }

    // Update user's last seen timestamp
    await prisma.users.update({
      where: { id: user.userId },
      data: { last_seen_announcement_at: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: `Marked ${newViewRecords.length} announcements as read`,
      data: { markedCount: newViewRecords.length },
    } as ApiResponse);
  } catch (error) {
    console.error("Error marking announcements as read:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to mark announcements as read",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
