import ExcelJS from "exceljs";
import { FormService } from "./formService";

const formService = new FormService();

export class ExportService {
  /**
   * Generates an Excel buffer from a list of forms
   */
  async exportFormsToExcel(filters: {
    formType?: string;
    osNumber?: string;
    status?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Buffer> {
    // 1. Fetch data using existing listForms logic
    // We cast status to any because distinct types might clash, but runtime string is fine
    const { forms } = await formService.listForms({
      ...filters,
      status: filters.status as any,
      limit: 1000, // Reasonable limit for export
    });

    // 2. Create Workbook and Worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Relatórios");

    // 3. Define Columns
    worksheet.columns = [
      { header: "ID", key: "id", width: 36 },
      { header: "Tipo de Formuário", key: "formType", width: 25 },
      { header: "Número OS", key: "osNumber", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Autor", key: "author", width: 20 },
      { header: "Gerente", key: "manager", width: 15 },
      { header: "Criado em", key: "createdAt", width: 20 },
      { header: "Submetido em", key: "submittedAt", width: 20 },
    ];

    // 4. Add Rows
    forms.forEach((form) => {
      worksheet.addRow({
        id: form.id,
        formType: form.formType,
        osNumber: form.osNumber,
        status: form.status,
        author: form.user?.name || form.user?.email || "N/A",
        manager: form.user?.email?.split("@")[0] || "N/A",
        createdAt: form.createdAt.toISOString().split("T")[0],
        submittedAt: form.submittedAt
          ? form.submittedAt.toISOString().split("T")[0]
          : "-",
      });
    });

    // 5. Stylize
    worksheet.getRow(1).font = { bold: true };

    // 6. Generate Buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
  }
}

export default new ExportService();
