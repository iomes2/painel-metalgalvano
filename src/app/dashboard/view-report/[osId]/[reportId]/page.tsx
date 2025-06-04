
"use client";

import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthInitializer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, ArrowLeft, FileText, CalendarIcon as CalendarLucideIcon, CheckSquare, Edit3, List, Hash, Image as ImageIcon, Clock, X } from 'lucide-react';
import { getFormDefinition, type FormField, type FormFieldOption, type FormDefinition as FormDefinitionType } from '@/config/forms';
import { getFormIcon } from '@/components/icons/icon-resolver';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ImageModal from '@/components/search/ImageModal'; // Reutilizando o ImageModal
import LinkedReportModal from '@/components/reports/LinkedReportModal'; // Importando o LinkedReportModal

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

const fieldTypeIcons: Record<FormField['type'], React.ElementType> = {
  text: Edit3,
  email: Edit3,
  password: Edit3,
  number: Hash,
  textarea: List,
  select: List,
  checkbox: CheckSquare,
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
  const formType = searchParams.get('formType');

  const [report, setReport] = useState<ReportData | null>(null);
  const [formDefinition, setFormDefinition] = useState<FormDefinitionType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<ReportPhoto | null>(null);
  const [currentImageList, setCurrentImageList] = useState<ReportPhoto[]>([]);

  const [isLinkedReportModalOpen, setIsLinkedReportModalOpen] = useState(false);
  const [selectedLinkedFormType, setSelectedLinkedFormType] = useState<string | null>(null);


  useEffect(() => {
    if (!osId || !reportId || !formType) {
      setError("Parâmetros inválidos na URL.");
      setIsLoading(false);
      return;
    }

    const definition = getFormDefinition(formType);
    if (!definition) {
      setError(`Definição de formulário para o tipo "${formType}" não encontrada.`);
      setIsLoading(false);
      return;
    }
    setFormDefinition(definition);

    const fetchReport = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const reportDocRef = doc(db, "ordens_servico", osId, "relatorios", reportId);
        const docSnap = await getDoc(reportDocRef);

        if (docSnap.exists()) {
          setReport({ id: docSnap.id, ...docSnap.data() } as ReportData);
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

  const openImageModal = (image: ReportPhoto, imageList: ReportPhoto[]) => {
    setCurrentImage(image);
    setCurrentImageList(imageList);
    setIsImageModalOpen(true);
  };

  const handleDownloadPhoto = (url: string, name: string) => {
    const link = document.createElement('a');
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

  const renderFieldValue = (field: FormField, value: any) => {
    if (value === undefined || value === null || value === '') {
      return <span className="italic text-muted-foreground">Não preenchido</span>;
    }

    switch (field.type) {
      case 'date':
        return value instanceof Timestamp ? format(value.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : String(value);
      case 'checkbox':
        return value ? "Sim" : "Não";
      case 'select':
        const option = field.options?.find(opt => opt.value === value);
        return option ? option.label : String(value);
      case 'file':
        if (Array.isArray(value) && value.length > 0) {
          const photos = value as ReportPhoto[];
          return (
            <Button variant="outline" size="sm" onClick={() => openImageModal(photos[0], photos)}>
              <ImageIcon className="mr-2 h-4 w-4" /> Ver ({photos.length}) Foto(s)
            </Button>
          );
        }
        return <span className="italic text-muted-foreground">Nenhuma foto</span>;
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
          <Button variant="outline" onClick={() => router.back()} className="mt-4">
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
          <AlertDescription>Não foi possível carregar os detalhes do relatório.</AlertDescription>
           <Button variant="outline" onClick={() => router.back()} className="mt-4">
             <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </Alert>
      </div>
    );
  }

  const FormSpecificIcon = getFormIcon(formDefinition.iconName);

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div> {/* Left side with title and description */}
              <div className="flex items-center gap-3 mb-2">
                <FormSpecificIcon className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl md:text-3xl">{formDefinition.name}</CardTitle>
              </div>
              <CardDescription className="text-base">
                Visualizando detalhes do relatório para a Ordem de Serviço: <strong className="text-foreground">{osId}</strong>
              </CardDescription>
              <div className="text-sm text-muted-foreground pt-1">
                <p>ID do Relatório: {report.id}</p>
                <p>Submetido em: {report.submittedAt ? format(report.submittedAt.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Data inválida'}</p>
                {report.gerenteId && <p>ID Gerente: {report.gerenteId}</p>}
              </div>
            </div>
            <div> {/* Right side with back button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push('/dashboard/search')}
                aria-label="Voltar para Pesquisa"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div>
            {formDefinition.fields.map((field) => {
              const fieldValue = report.formData[field.id];

              let shouldRenderField = true;
              if (formDefinition.id === 'cronograma-diario-obra') {
                  if (field.id === 'motivoAtrasoDia') shouldRenderField = report.formData['situacaoEtapaDia'] === 'em_atraso';
                  else if (field.id === 'uploadFotosEtapaDia') shouldRenderField = report.formData['fotosEtapaDia'] === 'sim';
                  else if (field.id === 'motivoRetrabalhoParadaDia') shouldRenderField = !!report.formData['horasRetrabalhoParadasDia'] && String(report.formData['horasRetrabalhoParadasDia']).trim() !== '';
                  else if (field.id === 'motivoNaoCumprimentoHorarioInicio') {
                      const efetivo = String(report.formData['horarioEfetivoInicioAtividades'] || '').trim();
                      const previsto = String(report.formData['horarioInicioJornadaPrevisto'] || '').trim();
                      shouldRenderField = efetivo !== '' && efetivo !== previsto;
                  } else if (field.id === 'motivoNaoCumprimentoHorarioSaida') {
                      const efetivo = String(report.formData['horarioEfetivoSaidaObra'] || '').trim();
                      const previsto = String(report.formData['horarioTerminoJornadaPrevisto'] || '').trim();
                      shouldRenderField = efetivo !== '' && efetivo !== previsto;
                  }
              } else if (formDefinition.id === 'rnc-report') {
                  if (field.id === 'uploadFotosNaoConformidade') shouldRenderField = report.formData['fotosNaoConformidade'] === 'sim';
              } else if (formDefinition.id === 'relatorio-inspecao-site') {
                  if (field.id === 'uploadFotosInspecao') shouldRenderField = report.formData['fotosInspecao'] === 'sim';
                  if (field.id === 'itensNaoConformes' || field.id === 'acoesCorretivasSugeridas') {
                      shouldRenderField = report.formData['conformidadeSeguranca'] === 'nao';
                  }
              }

              if (!shouldRenderField && (fieldValue === undefined || fieldValue === null || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0) )) {
                  return null;
              }

              const FieldIcon = fieldTypeIcons[field.type] || FileText;

              return (
                <div key={field.id} className="border border-border rounded-lg overflow-hidden mb-4 shadow-sm">
                  {/* Área da Pergunta/Título */}
                  <div className="bg-accent/20 px-2.5 py-0 flex items-center border-b border-border">
                    <FieldIcon className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                    <h3 className="text-sm font-black text-foreground leading-7">{field.label}</h3>
                  </div>
                  {/* Área da Resposta */}
                  <div className="bg-card px-2.5 py-0">
                    <div className="text-base text-foreground break-words min-h-[2.5rem] flex items-center py-2">
                      {renderFieldValue(field, fieldValue)}
                    </div>
                    {field.linkedForm && fieldValue === field.linkedForm.conditionValue && (
                      <div className="mt-2 py-2 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openLinkedReportModal(field.linkedForm!.targetFormType)}
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
        </CardContent>
        <CardFooter className="pt-6 border-t border-border">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Pesquisa
          </Button>
        </CardFooter>
      </Card>

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
    </div>
  );
}
