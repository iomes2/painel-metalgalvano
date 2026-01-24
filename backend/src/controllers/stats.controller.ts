import { Request, Response } from "express";
import prisma from "../config/database";
import { catchAsync } from "../middleware/errorHandler";
import logger from "../utils/logger";
import { Prisma } from "@prisma/client";

/**
 * GET /api/v1/stats/dashboard
 * Aggregated stats for dashboard charts
 */
export const getDashboardStats = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === "ADMIN";

    logger.info(
      `[Stats Dashboard] Iniciando fetch para userId: ${userId}, isAdmin: ${isAdmin}`,
    );

    // 1. Basic Counts
    logger.info(`[Stats Dashboard] Contando formulários...`);
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
    logger.info(
      `[Stats Dashboard] Contagens: totalForms=${totalForms}, totalUsers=${totalUsers}, pendingReviews=${pendingReviews}`,
    );

    // 2. Forms by Status
    logger.info(`[Stats Dashboard] Agrupando por status...`);
    const statusGrouping = await prisma.form.groupBy({
      by: ["status"],
      where: isAdmin ? {} : { userId },
      _count: {
        status: true,
      },
    });
    logger.info(
      `[Stats Dashboard] Statuses encontrados: ${JSON.stringify(statusGrouping)}`,
    );

    const formsByStatus = statusGrouping.map((g) => ({
      name: g.status,
      value: g._count.status,
    }));

    // 3. Forms by Month
    logger.info(`[Stats Dashboard] Agrupando por mês...`);
    const formsByMonth: any[] = await prisma.$queryRaw`
    SELECT TO_CHAR("createdAt", 'YYYY-MM') as month, COUNT(*)::int as count 
    FROM forms 
    WHERE "createdAt" >= NOW() - INTERVAL '6 months'
    ${isAdmin ? Prisma.empty : Prisma.sql`AND "userId" = ${userId}`}
    GROUP BY month 
    ORDER BY month ASC
  `;
    logger.info(
      `[Stats Dashboard] Meses encontrados: ${JSON.stringify(formsByMonth)}`,
    );

    // 4. Forms by Type
    logger.info(`[Stats Dashboard] Agrupando por tipo...`);
    const typeGrouping = await prisma.form.groupBy({
      by: ["formType"],
      where: isAdmin ? {} : { userId },
      _count: {
        formType: true,
      },
    });
    logger.info(
      `[Stats Dashboard] Tipos encontrados: ${JSON.stringify(typeGrouping)}`,
    );

    const formsByType = typeGrouping.map((g) => ({
      name: g.formType,
      value: g._count.formType,
    }));

    logger.info(`[Stats Dashboard] Enviando resposta com sucesso`);
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
  },
);

export default { getDashboardStats };
