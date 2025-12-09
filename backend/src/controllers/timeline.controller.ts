import { Request, Response } from "express";
import prisma from "../config/database";
import { catchAsync, AppError } from "../middleware/errorHandler";

/**
 * GET /api/v1/timeline/:osNumber
 * Returns the history (audit logs, form updates) for a specific Work (OS)
 */
export const getTimelineByOs = catchAsync(
  async (req: Request, res: Response) => {
    const { osNumber } = req.params;

    if (!osNumber) {
      throw new AppError("Número da OS é obrigatório", 400);
    }

    // 1. Find all forms associated with this OS
    const forms = await prisma.form.findMany({
      where: { osNumber },
      select: { id: true, formType: true, status: true, updatedAt: true },
    });

    if (forms.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const formIds = forms.map((f) => f.id);

    // 2. Find Audit Logs related to these forms
    const logs = await prisma.auditLog.findMany({
      where: {
        entity: "Form",
        entityId: { in: formIds },
      },
      include: {
        user: {
          select: { name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. Format the response
    const timeline = logs.map((log) => ({
      id: log.id,
      action: log.action,
      date: log.createdAt,
      user: log.user?.name || "Sistema",
      details: log.details,
      entityId: log.entityId,
      // Add form type context if needed
      context: forms.find((f) => f.id === log.entityId)?.formType,
    }));

    return res.json({
      success: true,
      data: timeline,
      meta: {
        totalEvents: timeline.length,
        relatedForms: forms.length,
      },
    });
  }
);

export default { getTimelineByOs };
