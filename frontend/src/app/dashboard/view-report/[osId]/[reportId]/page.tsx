"use client";

import { useEffect, useState, useCallback } from "react";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthInitializer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  AlertTriangle,
  ArrowLeft,
  FileText,
  CalendarIcon as CalendarLucideIcon,
  CheckSquare,
  Edit3,
  List,
  Hash,
  Image as ImageIcon,
  Clock,
  X,
  Printer,
} from "lucide-react";
import {
  getFormDefinition,
  type FormField,
  type FormFieldOption,
  type FormDefinition as FormDefinitionType,
} from "@/config/forms";
import { getFormIcon } from "@/components/icons/icon-resolver";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ImageModal from "@/components/search/ImageModal"; // Reutilizando o ImageModal
import LinkedReportModal from "@/components/reports/LinkedReportModal"; // Importando o LinkedReportModal
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface ReportPhoto {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface ReportData {
  id: string;
  formName: string;
  formType: string;
  formData: Record<string, any>;
  submittedAt: Timestamp;
  submittedBy: string;
  gerenteId?: string;
  originatingFormId?: string;
}

const fieldTypeIcons: Record<FormField["type"], React.ElementType> = {
  text: Edit3,
  email: Edit3,
  password: Edit3,
  number: Hash,
  textarea: List,
  select: List,
  date: CalendarLucideIcon,
  file: ImageIcon,
};
export default function ViewReportPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const osId = params.osId as string;
  const reportId = params.reportId as string;
  const formType = searchParams.get("formType");
  const [report, setReport] = useState<ReportData | null>(null);
  const [formDefinition, setFormDefinition] =
    useState<FormDefinitionType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<ReportPhoto | null>(null);
  const [currentImageList, setCurrentImageList] = useState<ReportPhoto[]>([]);

  const [isLinkedReportModalOpen, setIsLinkedReportModalOpen] = useState(false);
  const [selectedLinkedFormType, setSelectedLinkedFormType] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!osId || !reportId || !formType) {
      setError("Parâmetros inválidos na URL.");
      setIsLoading(false);
      return;
    }

    const definition = getFormDefinition(formType);
    if (!definition) {
      setError(
        `Definição de formulário para o tipo "${formType}" não encontrada.`
      );
      setIsLoading(false);
      return;
    }
    setFormDefinition(definition);

    const fetchReport = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Importar fetchRelatorioById do api-client
        const { fetchRelatorioById } = await import("@/lib/api-client");
        const reportData = await fetchRelatorioById(osId, reportId);

        if (reportData) {
          // Converter Timestamp para Date se necessário
          const submittedAt =
            reportData.submittedAt instanceof Date
              ? Timestamp.fromDate(reportData.submittedAt)
              : (reportData.submittedAt as Timestamp);

          setReport({
            ...reportData,
            submittedAt,
          } as ReportData);
        } else {
          setError("Relatório não encontrado.");
        }
      } catch (e: any) {
        console.error("Erro ao buscar relatório: ", e);
        setError(`Falha ao buscar relatório: ${e.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [osId, reportId, formType]);

  // Garante que a página não role; somente a coluna de respostas rola
  useEffect(() => {
    const previous = document.body.style.overflowY;
    document.body.style.overflowY = "hidden";
    return () => {
      document.body.style.overflowY = previous;
    };
  }, []);

  const openImageModal = (image: ReportPhoto, imageList: ReportPhoto[]) => {
    setCurrentImage(image);
    setCurrentImageList(imageList);
    setIsImageModalOpen(true);
  };

  const handleDownloadPhoto = (url: string, name: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openLinkedReportModal = (targetFormType: string) => {
    setSelectedLinkedFormType(targetFormType);
    setIsLinkedReportModalOpen(true);
  };

  const isImage = (file: ReportPhoto) => {
    const mime = (file.type || "").toLowerCase();
    if (mime.startsWith("image/")) return true;
    const n = (file.name || "").toLowerCase();
    return (
      n.endsWith(".jpg") ||
      n.endsWith(".jpeg") ||
      n.endsWith(".png") ||
      n.endsWith(".webp") ||
      n.endsWith(".gif")
    );
  };

  const renderFieldValue = (field: FormField, value: any) => {
    if (value === undefined || value === null || value === "") {
      return (
        <span className="italic text-muted-foreground">Não preenchido</span>
      );
    }

    switch (field.type) {
      case "date":
        // Suportar Timestamp do Firebase e objeto {seconds, nanoseconds}
        if (value instanceof Timestamp) {
          return format(value.toDate(), "dd/MM/yyyy 'às' HH:mm", {
            locale: ptBR,
          });
        }
        if (typeof value === "object" && value !== null && "seconds" in value) {
          const date = new Date(
            value.seconds * 1000 + (value.nanoseconds || 0) / 1000000
          );
          return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
        }
        if (
          typeof value === "object" &&
          value !== null &&
          "_seconds" in value
        ) {
          const date = new Date(
            value._seconds * 1000 + (value._nanoseconds || 0) / 1000000
          );
          return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
        }
        return String(value);
      case "checkbox":
        return (
          <Badge variant={value ? "default" : "secondary"}>
            {value ? "Sim" : "Não"}
          </Badge>
        );
      case "select":
        const option = field.options?.find((opt) => opt.value === value);
        return (
          <Badge variant="outline">
            {option ? option.label : String(value)}
          </Badge>
        );
      case "file":
        if (Array.isArray(value) && value.length > 0) {
          const photos = (value as ReportPhoto[]).filter((p) => !!p && !!p.url);
          if (photos.length === 0) {
            return (
              <span className="italic text-muted-foreground">
                Nenhum arquivo
              </span>
            );
          }
          const imageFiles = photos.filter((p) => isImage(p));
          // Se houver imagens, renderiza uma grade de miniaturas clicáveis; senão, botão padrão
          if (imageFiles.length > 0) {
            return (
              <div className="flex flex-wrap gap-2 print:hidden">
                {imageFiles.slice(0, 6).map((photo, idx) => (
                  <button
                    key={`${photo.url}-${idx}`}
                    type="button"
                    className="relative h-12 w-12 overflow-hidden rounded-md ring-1 ring-border hover:ring-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    onClick={() => openImageModal(photo, photos)}
                    aria-label={`Abrir imagem ${photo.name}`}
                  >
                    <Image
                      src={photo.url}
                      alt={photo.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </button>
                ))}
                {photos.length > 6 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openImageModal(imageFiles[0], photos)}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />+{photos.length - 6}
                  </Button>
                )}
              </div>
            );
          }
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openImageModal(photos[0], photos)}
            >
              <ImageIcon className="mr-2 h-4 w-4" /> Ver ({photos.length})
              Arquivo(s)
            </Button>
          );
        }
        return (
          <span className="italic text-muted-foreground">Nenhum arquivo</span>
        );
      default:
        return String(value);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-theme(spacing.16))] items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Carregando relatório...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-theme(spacing.16))] items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao Carregar Relatório</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </Alert>
      </div>
    );
  }

  if (!report || !formDefinition) {
    return (
      <div className="flex min-h-[calc(100vh-theme(spacing.16))] items-center justify-center p-4">
        <Alert className="max-w-lg">
          <AlertTitle>Relatório não encontrado</AlertTitle>
          <AlertDescription>
            Não foi possível carregar os detalhes do relatório.
          </AlertDescription>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </Alert>
      </div>
    );
  }

  const FormSpecificIcon = getFormIcon(formDefinition.iconName);

  // Coleta de todas as imagens para impressão em páginas separadas
  const allImages: ReportPhoto[] = [];
  if (formDefinition && report) {
    formDefinition.fields.forEach((f) => {
      const val = report.formData[f.id];
      if (f.type === "file" && Array.isArray(val)) {
        (val as ReportPhoto[]).forEach((p) => {
          if (p && p.url && isImage(p)) {
            allImages.push(p);
          }
        });
      }
    });
  }

  return (
    <div className="mx-auto max-w-screen-2xl w-full px-3 md:px-6 py-0 overflow-x-hidden">
      <div className="h-[calc(100svh-64px)] sm:h-[calc(100svh-64px-3rem)] lg:h-[calc(100svh-64px-4rem)] w-full max-w-[100vw] flex flex-col rounded-2xl border bg-gradient-to-b from-background to-muted/30 shadow-sm overflow-hidden print:block print:h-auto print:max-w-none print:rounded-none print:border-0 print:shadow-none print:bg-white print-reset-overflow">
        {/* Cabeçalho (fixo dentro do container) */}
        <div className="border-b rounded-t-2xl">
          <div className="flex items-start justify-between gap-3 p-2 md:p-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                <FormSpecificIcon className="h-6 w-6 md:h-7 md:w-7 text-primary" />
                <h1 className="truncate text-lg font-semibold md:text-xl mr-2">
                  {formDefinition.name}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground">
                <span className="hidden md:inline print:inline">
                  Ordem de Serviço:
                </span>
                <Badge
                  variant="secondary"
                  className="font-mono px-1.5 py-0.5 text-[10px] md:text-xs"
                >
                  {osId}
                </Badge>
                <span className="mx-1 hidden md:inline print:inline">•</span>
                <span className="truncate">
                  {report.submittedAt
                    ? format(
                        report.submittedAt.toDate(),
                        "dd/MM/yyyy 'às' HH:mm",
                        { locale: ptBR }
                      )
                    : "Data inválida"}
                </span>
                {report.submittedBy && (
                  <>
                    <span className="mx-1 hidden md:inline print:inline">
                      •
                    </span>
                    <span className="truncate max-w-[50vw] hidden md:inline print:inline">
                      por {report.submittedBy}
                      {report.id && (
                        <span
                          className="font-mono text-[10px] md:text-xs text-muted-foreground ml-2"
                          title={`ID completo do relatório: ${report.id}`}
                        >
                          (ID: {report.id})
                        </span>
                      )}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 print:hidden">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.back()}
                aria-label="Voltar"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.print()}
                aria-label="Imprimir"
              >
                <Printer className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Corpo em Grid: Metadados (col-esq) + Campos (col-dir) */}
        <div className="flex-1 overflow-hidden min-w-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-3 md:p-4 h-full overflow-x-hidden min-w-0 w-full max-w-full">
            {/* Sidebar de Metadados */}
            <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-4 print:hidden">
              <Card className="shadow-none border-border/80">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Resumo</CardTitle>
                  <CardDescription>Informações do relatório</CardDescription>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">ID Relatório</span>
                    <span
                      className="font-mono text-xs md:text-[13px] truncate max-w-[60%]"
                      title={report.id}
                    >
                      {report.id}
                    </span>
                  </div>
                  {report.gerenteId && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">ID Gerente</span>
                      <span
                        className="font-mono text-xs md:text-[13px] truncate max-w-[60%]"
                        title={report.gerenteId}
                      >
                        {report.gerenteId}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Formulário</span>
                    <span
                      className="truncate max-w-[60%]"
                      title={formDefinition.name}
                    >
                      {formDefinition.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {report.submittedAt
                        ? format(
                            report.submittedAt.toDate(),
                            "dd/MM/yyyy HH:mm",
                            { locale: ptBR }
                          )
                        : "Data inválida"}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                  </Button>
                </CardFooter>
              </Card>
            </aside>

            {/* Conteúdo: Campos do formulário - rolável */}
            <section className="lg:col-span-8 xl:col-span-9 h-full overflow-y-auto overflow-x-hidden overscroll-contain pr-1 min-w-0 print:overflow-visible print:h-auto print-reset-overflow">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 pb-3 min-w-0 w-full max-w-full">
                {formDefinition.fields.map((field) => {
                  const fieldValue = report.formData[field.id];

                  let shouldRenderField = true;
                  if (formDefinition.id === "cronograma-diario-obra") {
                    if (field.id === "motivoAtrasoDia")
                      shouldRenderField =
                        report.formData["situacaoEtapaDia"] === "em_atraso";
                    else if (field.id === "uploadFotosEtapaDia")
                      shouldRenderField =
                        report.formData["fotosEtapaDia"] === "sim";
                    else if (field.id === "motivoRetrabalhoParadaDia")
                      shouldRenderField =
                        !!report.formData["horasRetrabalhoParadasDia"] &&
                        String(
                          report.formData["horasRetrabalhoParadasDia"]
                        ).trim() !== "";
                    else if (field.id === "motivoNaoCumprimentoHorarioInicio") {
                      const efetivo = String(
                        report.formData["horarioEfetivoInicioAtividades"] || ""
                      ).trim();
                      const previsto = String(
                        report.formData["horarioInicioJornadaPrevisto"] || ""
                      ).trim();
                      shouldRenderField =
                        efetivo !== "" && efetivo !== previsto;
                    } else if (
                      field.id === "motivoNaoCumprimentoHorarioSaida"
                    ) {
                      const efetivo = String(
                        report.formData["horarioEfetivoSaidaObra"] || ""
                      ).trim();
                      const previsto = String(
                        report.formData["horarioTerminoJornadaPrevisto"] || ""
                      ).trim();
                      shouldRenderField =
                        efetivo !== "" && efetivo !== previsto;
                    }
                  } else if (formDefinition.id === "rnc-report") {
                    if (field.id === "uploadFotosNaoConformidade")
                      shouldRenderField =
                        report.formData["fotosNaoConformidade"] === "sim";
                  } else if (formDefinition.id === "relatorio-inspecao-site") {
                    if (field.id === "uploadFotosInspecao")
                      shouldRenderField =
                        report.formData["fotosInspecao"] === "sim";
                    if (
                      field.id === "itensNaoConformes" ||
                      field.id === "acoesCorretivasSugeridas"
                    ) {
                      shouldRenderField =
                        report.formData["conformidadeSeguranca"] === "nao";
                    }
                  }

                  if (
                    !shouldRenderField &&
                    (fieldValue === undefined ||
                      fieldValue === null ||
                      fieldValue === "" ||
                      (Array.isArray(fieldValue) && fieldValue.length === 0))
                  ) {
                    return null;
                  }

                  const FieldIcon = fieldTypeIcons[field.type] || FileText;

                  const isLargeField =
                    field.type === "textarea" || field.type === "file";
                  return (
                    <div
                      key={field.id}
                      className={`rounded-md border bg-card shadow-sm hover:shadow transition-shadow overflow-hidden min-w-0 print-avoid-break-inside ${
                        isLargeField ? "sm:col-span-2 xl:col-span-3" : ""
                      }`}
                    >
                      {/* Título do campo */}
                      <div className="flex items-center gap-1.5 border-b bg-muted/40 px-2.5 py-1">
                        <FieldIcon className="h-3 w-3 text-primary" />
                        <h3
                          className="text-[11px] font-medium leading-5 truncate"
                          title={field.label}
                        >
                          {field.label}
                        </h3>
                      </div>
                      {/* Valor */}
                      <div className="px-2.5 py-1.5 text-[13px] leading-relaxed break-words break-all whitespace-pre-wrap min-w-0 max-w-full">
                        {renderFieldValue(field, fieldValue)}
                        {field.linkedForm &&
                          fieldValue === field.linkedForm.conditionValue && (
                            <div className="mt-2 pt-2 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full sm:w-auto whitespace-normal break-words text-[12px] leading-tight text-center max-w-full"
                                onClick={() =>
                                  openLinkedReportModal(
                                    field.linkedForm!.targetFormType
                                  )
                                }
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                {field.linkedForm.linkButtonLabel}
                              </Button>
                            </div>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>

      {currentImage && currentImageList.length > 0 && (
        <ImageModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          image={currentImage}
          imageList={currentImageList}
          onDownload={handleDownloadPhoto}
          onNavigate={(nextImage) => setCurrentImage(nextImage)}
        />
      )}

      {selectedLinkedFormType && (
        <LinkedReportModal
          isOpen={isLinkedReportModalOpen}
          onClose={() => {
            setIsLinkedReportModalOpen(false);
            setSelectedLinkedFormType(null);
          }}
          osId={osId}
          targetFormType={selectedLinkedFormType}
          mainReportSubmittedAt={report.submittedAt}
        />
      )}
      {/* Seção somente para impressão com cada imagem em página própria */}
      {allImages.length > 0 && (
        <div className="hidden print:block print-images-section">
          {allImages.map((img, idx) => (
            <div key={img.url + idx} className="print-image-page">
              <img
                src={img.url}
                alt={img.name}
                className="max-w-full h-auto mx-auto"
              />
              <div className="mt-2 text-center text-xs text-muted-foreground">
                {img.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
