import { NotificationService } from "../../services/notification.service";
import prisma from "../../config/database";
import logger from "../../utils/logger";

// Mocks
jest.mock("../../config/database", () => ({
  __esModule: true,
  default: {
    notification: {
      create: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock("../../utils/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

describe("NotificationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    const mockData = {
      userId: "user-123",
      title: "Test Notification",
      message: "Test Message",
      type: "INFO" as const,
      link: "/test/link",
    };

    it("should create a notification successfully", async () => {
      (prisma.notification.create as jest.Mock).mockResolvedValue({
        id: "notif-1",
        ...mockData,
        createdAt: new Date(),
        read: false,
      });

      const result = await NotificationService.create(mockData);

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining(mockData),
      });
      expect(result).toHaveProperty("id", "notif-1");
    });

    it("should log error and return null if creation fails", async () => {
      const error = new Error("Database error");
      (prisma.notification.create as jest.Mock).mockRejectedValue(error);

      const result = await NotificationService.create(mockData);

      expect(logger.error).toHaveBeenCalledWith(
        "Error creating notification:",
        error
      );
      expect(result).toBeNull();
    });

    it("should use INFO type by default", async () => {
      const dataWithoutType = {
        userId: "user-123",
        title: "Test",
        message: "Message",
      };

      await NotificationService.create(dataWithoutType);
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ type: "INFO" }),
      });
    });
  });

  describe("notifyAdmins", () => {
    const mockData = {
      title: "Admin Alert",
      message: "Something happened",
      type: "WARNING",
    };

    it("should notify all admins successfully", async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: "admin-1" },
        { id: "admin-2" },
      ]);
      (prisma.notification.create as jest.Mock).mockResolvedValue({
        id: "new-notif",
      });

      const results = await NotificationService.notifyAdmins(mockData);

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      // Should call create for each admin
      expect(prisma.notification.create).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(2);
    });

    it("should handle error when notifying admins", async () => {
      const error = new Error("DB Error");
      (prisma.user.findMany as jest.Mock).mockRejectedValue(error);

      const results = await NotificationService.notifyAdmins(mockData);

      expect(logger.error).toHaveBeenCalledWith(
        "Error notifying admins:",
        error
      );
      expect(results).toEqual([]);
    });

    it("should handle no admins found", async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      const results = await NotificationService.notifyAdmins(mockData);

      expect(prisma.notification.create).not.toHaveBeenCalled();
      expect(results).toHaveLength(0);
    });
  });
});
