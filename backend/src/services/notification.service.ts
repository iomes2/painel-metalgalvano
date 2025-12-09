import prisma from "../config/database";
import logger from "../utils/logger";

export class NotificationService {
  /**
   * Create a notification for a specific user
   */
  static async create(data: {
    userId: string;
    title: string;
    message: string;
    type?: "INFO" | "WARNING" | "SUCCESS" | "ERROR";
    link?: string;
  }) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type || "INFO",
          link: data.link,
        },
      });
      return notification;
    } catch (error) {
      logger.error("Error creating notification:", error);
      // Don't throw, just log, to avoid breaking the main flow
      return null;
    }
  }

  /**
   * Notify admins
   */
  static async notifyAdmins(data: {
    title: string;
    message: string;
    type?: string;
    link?: string;
  }) {
    try {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      const notifications = await Promise.all(
        admins.map((admin) =>
          this.create({
            userId: admin.id,
            title: data.title,
            message: data.message,
            type: data.type as any,
            link: data.link,
          })
        )
      );

      return notifications;
    } catch (error) {
      logger.error("Error notifying admins:", error);
      return [];
    }
  }
}

export default NotificationService;
