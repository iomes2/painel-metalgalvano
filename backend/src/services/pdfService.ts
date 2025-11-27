import PdfPrinter from "pdfmake";
import type {
  TDocumentDefinitions,
  Content,
  DynamicContent,
} from "pdfmake/interfaces";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logger from "../utils/logger";

// Tipos espelhados do frontend
interface FormFieldOption {
  value: string;
  label: string;
}

interface FormField {
  id: string;
  label: string;
  type:
    | "text"
    | "email"
    | "password"
    | "number"
    | "textarea"
    | "select"
    | "checkbox"
    | "date"
    | "file";
  options?: FormFieldOption[];
  required?: boolean;
}

interface FormDefinition {
  id: string;
  name: string;
  description: string;
  iconName?: string;
  fields: FormField[];
}

interface ReportPhoto {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface ReportData {
  id: string;
  formType: string;
  formName: string;
  formData: Record<string, any>;
  submittedAt: Date;
  submittedBy: string;
  gerenteId?: string;
  originatingFormId?: string;
}

interface OsData {
  osNumber: string;
  lastReportAt?: Date;
}

/**
 * Serviço para geração de PDFs de relatórios
 */
export class PdfService {
  private printer: PdfPrinter;

  constructor() {
    // Usando fontes do sistema (Courier como fallback universal)
    const fonts = {
      Courier: {
        normal: "Courier",
        bold: "Courier-Bold",
        italics: "Courier-Oblique",
        bolditalics: "Courier-BoldOblique",
      },
    };
    this.printer = new PdfPrinter(fonts);
  }

  /**
   * Gera PDF de um relatório
   */
  async generateReportPdf(
    reportData: ReportData,
    formDefinition: FormDefinition,
    osData: OsData
  ): Promise<Buffer> {
    try {
      const docDefinition = this.buildDocumentDefinition(
        reportData,
        formDefinition,
        osData
      );

      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        const pdfDoc = this.printer.createPdfKitDocument(docDefinition);

        pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));
        pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
        pdfDoc.on("error", reject);

        pdfDoc.end();
      });
    } catch (error) {
      logger.error("Erro ao gerar PDF:", error);
      throw error;
    }
  }

  /**
   * Constrói a definição do documento PDF
   */
  private buildDocumentDefinition(
    reportData: ReportData,
    formDefinition: FormDefinition,
    osData: OsData
  ): TDocumentDefinitions {
    const content: Content[] = [];

    // Cabeçalho
    content.push(this.buildHeader(formDefinition, osData));
    content.push({ text: "", margin: [0, 20] }); // Espaçamento

    // Metadados do relatório
    content.push(this.buildMetadata(reportData));
    content.push({ text: "", margin: [0, 20] }); // Espaçamento

    // Campos do formulário
    content.push(this.buildFormFields(formDefinition, reportData.formData));

    return {
      content,
      footer: this.buildFooter(reportData),
      pageSize: "A4",
      pageMargins: [40, 60, 40, 60],
      defaultStyle: {
        fontSize: 10,
        font: "Courier",
      },
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: "center",
          color: "#1e40af",
        },
        subheader: {
          fontSize: 14,
          bold: true,
          color: "#374151",
          margin: [0, 10, 0, 5],
        },
        fieldLabel: {
          fontSize: 9,
          bold: true,
          color: "#6b7280",
        },
        fieldValue: {
          fontSize: 10,
          color: "#111827",
          margin: [0, 2, 0, 10],
        },
        metadata: {
          fontSize: 9,
          color: "#6b7280",
          italics: true,
        },
      },
    };
  }

  /**
   * Constrói o cabeçalho do PDF
   */
  private buildHeader(formDefinition: FormDefinition, osData: OsData): Content {
    return {
      stack: [
        {
          text: "METALGALVANO",
          style: "header",
          color: "#1e40af",
        },
        {
          text: formDefinition.name,
          fontSize: 14,
          bold: true,
          alignment: "center",
          margin: [0, 5, 0, 0],
        },
        {
          text: `OS: ${osData.osNumber}`,
          fontSize: 12,
          alignment: "center",
          color: "#059669",
          margin: [0, 5, 0, 0],
        },
        {
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 10,
              x2: 515,
              y2: 10,
              lineWidth: 2,
              lineColor: "#e5e7eb",
            },
          ],
        },
      ],
    };
  }

  /**
   * Constrói metadados do relatório
   */
  private buildMetadata(reportData: ReportData): Content {
    const submittedDate = format(
      new Date(reportData.submittedAt),
      "dd/MM/yyyy 'às' HH:mm",
      {
        locale: ptBR,
      }
    );

    return {
      columns: [
        {
          width: "50%",
          stack: [
            { text: "Relatório ID:", style: "fieldLabel" },
            { text: reportData.id, style: "metadata" },
          ],
        },
        {
          width: "50%",
          stack: [
            { text: "Data de Submissão:", style: "fieldLabel" },
            { text: submittedDate, style: "metadata" },
          ],
        },
      ],
    };
  }

  /**
   * Constrói os campos do formulário
   */
  private buildFormFields(
    formDefinition: FormDefinition,
    formData: Record<string, any>
  ): Content {
    const content: Content[] = [
      { text: "Dados do Formulário", style: "subheader" },
    ];

    formDefinition.fields.forEach((field) => {
      const value = formData[field.id];
      const formattedValue = this.formatFieldValue(field, value);

      // Se o campo é de arquivo/foto, trata separadamente
      if (field.type === "file" && Array.isArray(value) && value.length > 0) {
        content.push({
          stack: [
            { text: field.label, style: "fieldLabel" },
            {
              text: `${value.length} foto(s) anexada(s)`,
              style: "fieldValue",
              color: "#059669",
            },
            ...this.buildPhotoLinks(value as ReportPhoto[]),
          ],
          margin: [0, 0, 0, 10],
        });
      } else {
        content.push({
          stack: [
            { text: field.label, style: "fieldLabel" },
            { text: formattedValue, style: "fieldValue" },
          ],
        });
      }
    });

    return content;
  }

  /**
   * Formata valor de campo baseado no tipo
   */
  private formatFieldValue(field: FormField, value: any): string {
    if (value === undefined || value === null || value === "") {
      return "Não preenchido";
    }

    switch (field.type) {
      case "date":
        try {
          const date = value instanceof Date ? value : new Date(value);
          return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
        } catch {
          return String(value);
        }

      case "checkbox":
        return value ? "Sim" : "Não";

      case "select":
        if (field.options) {
          const option = field.options.find((opt) => opt.value === value);
          return option ? option.label : String(value);
        }
        return String(value);

      case "file":
        if (Array.isArray(value)) {
          return `${value.length} arquivo(s)`;
        }
        return "Nenhum arquivo";

      case "number":
        return typeof value === "number"
          ? value.toLocaleString("pt-BR")
          : String(value);

      default:
        return String(value);
    }
  }

  /**
   * Constrói links para fotos
   */
  private buildPhotoLinks(photos: ReportPhoto[]): Content[] {
    return photos.map((photo, index) => ({
      text: `  📷 ${index + 1}. ${photo.name}`,
      fontSize: 8,
      color: "#3b82f6",
      margin: [10, 2, 0, 0],
      link: photo.url,
    }));
  }

  /**
   * Constrói o rodapé do PDF
   */
  private buildFooter(reportData: ReportData): DynamicContent {
    return (currentPage: number, pageCount: number) => {
      return {
        columns: [
          {
            width: "50%",
            text: [
              { text: "Gerente: ", bold: true, fontSize: 8 },
              { text: reportData.gerenteId || "N/A", fontSize: 8 },
            ],
            margin: [40, 0, 0, 0],
          },
          {
            width: "50%",
            text: `Página ${currentPage} de ${pageCount}`,
            alignment: "right",
            fontSize: 8,
            margin: [0, 0, 40, 0],
          },
        ],
        margin: [0, 10],
      };
    };
  }
}

export default new PdfService();
