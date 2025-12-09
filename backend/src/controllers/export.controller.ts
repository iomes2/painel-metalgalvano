import { Request, Response } from "express";
import exportService from "../services/export.service";
import { catchAsync } from "../middleware/errorHandler";

/**
 * GET /api/v1/export/forms
 * Export forms to Excel based on generic filters
 */
export const exportForms = catchAsync(async (req: Request, res: Response) => {
  const { formType, osNumber, status, startDate, endDate } = req.query;

  const buffer = await exportService.exportFormsToExcel({
    formType: formType as string,
    osNumber: osNumber as string,
    status: status as string,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    // Add userId from req if needed to restrict to own forms, or allow all if admin
  });

  const filename = `relatorios_export_${
    new Date().toISOString().split("T")[0]
  }.xlsx`;

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
});

export default { exportForms };
