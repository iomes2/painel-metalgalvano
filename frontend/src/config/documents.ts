import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  ClipboardList,
  ClipboardCheck,
  Truck,
  ShieldAlert,
  CalendarRange,
  Users,
  FileWarning,
  SearchCheck,
  CalendarClock,
  BarChart3,
} from "lucide-react";

export interface DocumentDefinition {
  id: string;
  title: string;
  description: string;
  category:
    | "Processo"
    | "Técnico"
    | "Administrativo"
    | "Segurança"
    | "Formulário";
  type: "pdf" | "image" | "excel";
  fileUrl: string;
  icon?: any;
}

export const documentDefinitions: DocumentDefinition[] = [
  {
    id: "fl-003",
    title: "FL-003: Fluxograma de Instalação",
    description: "Fluxograma detalhado do processo de instalação em obra.",
    category: "Processo",
    type: "pdf",
    fileUrl: "/documents/FL-003 Fluxograma Instalação.pdf",
    icon: FileText,
  },
  {
    id: "doc-001",
    title: "DOC-001: Reunião de Projeto",
    description: "Alinhamento inicial de projeto, mão de obra e equipamentos.",
    category: "Formulário",
    type: "pdf",
    fileUrl: "/documents/DOC-001 REUNIÃO DE PROJETO.pdf",
    icon: ClipboardList,
  },
  {
    id: "doc-002",
    title: "DOC-002: Checklist Pré-Obra",
    description: "Verificação prévia das condições do canteiro e logística.",
    category: "Formulário",
    type: "pdf",
    fileUrl: "/documents/DOC-002 Checklist pré obra 2.pdf",
    icon: ClipboardCheck,
  },
  {
    id: "doc-003",
    title: "DOC-003: Checklist Início de Obra",
    description: "Avaliação Civil e Recebimento de Materiais.",
    category: "Formulário",
    type: "pdf",
    fileUrl: "/documents/DOC-003 Checklist Inicio de obra.pdf",
    icon: ClipboardList,
  },
  {
    id: "doc-004",
    title: "DOC-004: Checklist de Carga e Descarga",
    description: "Controle de Carga, Descarga e Verificação de Veículos.",
    category: "Formulário",
    type: "pdf",
    fileUrl: "/documents/DOC-004 Cheklist de carga e descarga.pdf",
    icon: Truck,
  },
  {
    id: "doc-005",
    title: "DOC-005: Relatório de Inspeção de Obra",
    description: "Inspeção de Içamento, Estrutura Montada, Telhas e Final.",
    category: "Formulário",
    type: "pdf",
    fileUrl: "/documents/DOC-005 Relatório de  Inspeção de Obra (1).pdf",
    icon: ClipboardCheck,
  },
  {
    id: "doc-007",
    title: "DOC-007: APR - Análise Preliminar de Risco",
    description:
      "Análise de riscos para atividades de içamento, altura, soldagem, etc.",
    category: "Segurança",
    type: "pdf",
    fileUrl: "/documents/DOC-007 APR Análise Preliminar de Risco.doc.pdf",
    icon: ShieldAlert,
  },
  {
    id: "doc-008",
    title: "DOC-008: Cronograma de Execução da Obra",
    description: "Planejamento das etapas e prazos da obra.",
    category: "Formulário",
    type: "pdf",
    fileUrl: "/documents/DOC-008 Cronograma de Obra.pdf",
    icon: CalendarRange,
  },
  {
    id: "doc-009",
    title: "DOC-009: Diálogo de Segurança - DDS",
    description: "Registro diário de segurança e presença.",
    category: "Segurança",
    type: "pdf",
    fileUrl: "/documents/DOC-009 Dialogo de Segurança -DDS.pdf",
    icon: Users,
  },
  {
    id: "doc-010",
    title: "DOC-010: Relatório de Não-Conformidade - RNC",
    description: "Registro de não conformidades e ações corretivas.",
    category: "Formulário",
    type: "pdf",
    fileUrl: "/documents/DOC-010 Relatorio de Não Conformidade -RNC.pdf",
    icon: FileWarning,
  },
  {
    id: "doc-011",
    title: "DOC-011: Permissão de Trabalho Especial (PTE)",
    description: "Permissão para trabalhos de risco e Ficha de EPI.",
    category: "Segurança",
    type: "pdf",
    fileUrl: "/documents/DOC-011 Permissao_de_Trabalho_Especial 2.pdf",
    icon: ShieldAlert,
  },
  {
    id: "doc-012",
    title: "DOC-012: Relatório Interno de Conclusão de Obra",
    description:
      "Declaração final de conclusão e checklist de documentos (Dossiê).",
    category: "Formulário",
    type: "pdf",
    fileUrl: "/documents/DOC-012 Relatorio Interno de Conclusão de Obra.pdf",
    icon: ClipboardList,
  },
  {
    id: "doc-015",
    title: "DOC-015: Indicador de Desempenho de Obra (ADO)",
    description: "Comparativo de Projetado x Realizado.",
    category: "Formulário",
    type: "pdf",
    fileUrl: "/documents/DOC-015 Indicador de Desempenho de Obra (2).pdf",
    icon: BarChart3,
  },
  {
    id: "doc-020",
    title: "DOC-020: Diário de Obra e Cronograma",
    description: "Registro diário de desenvolvimento da etapa e ocorrências.",
    category: "Formulário",
    type: "pdf",
    fileUrl:
      "/documents/Doc-020 ACOMPANHAMENTO de CRONOGRAMA e DIÁRIO de OBRA.pdf",
    icon: CalendarClock,
  },
  {
    id: "relatorio-inspecao-site",
    title: "RIO - Relatório de Inspeção de Site",
    description: "Detalha a inspeção de segurança e conformidade no local.",
    category: "Formulário",
    type: "pdf",
    fileUrl: "/documents/RIO-Inspecao-Site.pdf",
    icon: SearchCheck,
  },
];
