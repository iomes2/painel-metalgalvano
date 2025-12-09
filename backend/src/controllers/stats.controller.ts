import { Request, Response } from "express";
import prisma from "../config/database";
import { catchAsync } from "../middleware/errorHandler";
import { Prisma } from "@prisma/client";

/**
 * GET /api/v1/stats/dashboard
 * Aggregated stats for dashboard charts
 */
export const getDashboardStats = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === "ADMIN";

    // 1. Basic Counts
    const [totalForms, totalUsers, pendingReviews] = await Promise.all([
      prisma.form.count({
        where: isAdmin ? {} : { userId },
      }),
      isAdmin ? prisma.user.count() : Promise.resolve(0),
      prisma.form.count({
        where: {
          status: "SUBMITTED",
          ...(isAdmin ? {} : { userId }),
        },
      }),
    ]);

    // 2. Forms by Status
    const statusGrouping = await prisma.form.groupBy({
      by: ["status"],
      where: isAdmin ? {} : { userId },
      _count: {
        status: true,
      },
    });

    const formsByStatus = statusGrouping.map((g) => ({
      name: g.status,
      value: g._count.status,
    }));

    // 3. Forms by Month
    const formsByMonth: any[] = await prisma.$queryRaw`
    SELECT TO_CHAR("createdAt", 'YYYY-MM') as month, COUNT(*)::int as count 
    FROM forms 
    WHERE "createdAt" >= NOW() - INTERVAL '6 months'
    ${isAdmin ? Prisma.empty : Prisma.sql`AND "userId" = ${userId}`}
    GROUP BY month 
    ORDER BY month ASC
  `;

    // 4. Forms by Type
    const typeGrouping = await prisma.form.groupBy({
      by: ["formType"],
      where: isAdmin ? {} : { userId },
      _count: {
        formType: true,
      },
    });

    const formsByType = typeGrouping.map((g) => ({
      name: g.formType,
      value: g._count.formType,
    }));

    res.json({
      success: true,
      data: {
        counts: {
          totalForms,
          totalUsers: isAdmin ? totalUsers : null,
          pendingReviews,
        },
        charts: {
          formsByStatus,
          formsByMonth: formsByMonth.map((f) => ({
            name: f.month,
            value: f.count,
          })),
          formsByType,
        },
      },
    });
  }
);

export default { getDashboardStats };
