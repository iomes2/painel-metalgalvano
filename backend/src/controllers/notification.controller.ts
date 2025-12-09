import { Request, Response } from "express";
import prisma from "../config/database";
import { catchAsync } from "../middleware/errorHandler";

/**
 * GET /api/v1/notifications
 * List user notifications
 */
export const getNotifications = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json({
      success: true,
      data: notifications,
    });
  }
);

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark as read
 */
export const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });

  res.json({ success: true });
});

/**
 * PATCH /api/v1/notifications/read-all
 * Mark all as read
 */
export const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  res.json({ success: true });
});

export default { getNotifications, markAsRead, markAllAsRead };
