
"use client";

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, FileText, CalendarIcon as CalendarLucideIcon, CheckSquare, Edit3, List, Hash, Image as ImageIcon, X } from 'lucide-react';
import { getFormDefinition, type FormField, type FormDefinition as FormDefinitionType } from '@/config/forms';
import { getFormIcon } from '@/components/icons/icon-resolver';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ImageModal from '@/components/search/ImageModal'; // For displaying images within the linked report

interface ReportPhoto {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface LinkedReportData {
  id: string;
  formName: string;
  formData: Record<string, any>;
  submittedAt: Timestamp;
  gerenteId?: string;
}

interface LinkedReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  osId: string;
  targetFormType: string | null;
  mainReportSubmittedAt?: Timestamp; // Optional: could be used for more precise querying if needed
}

const fieldTypeIconsModal: Record<FormField['type'], React.ElementType> = {
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

export default function LinkedReportModal({ isOpen, onClose, osId, targetFormType, mainReportSubmittedAt }: LinkedReportModalProps) {
  const [linkedReport, setLinkedReport] = useState<LinkedReportData | null>(null);
  const [formDefinition, setFormDefinition] = useState<FormDefinitionType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<ReportPhoto | null>(null);
  const [currentImageList, setCurrentImageList] = useState<ReportPhoto[]>([]);

  useEffect(() => {
    if (isOpen && targetFormType && osId) {
      const fetchLinkedReport = async () => {
        setIsLoading(true);
        setError(null);
        setLinkedReport(null);
        setFormDefinition(null);

        const definition = getFormDefinition(targetFormType);
        if (!definition) {
          setError(`Definição de formulário para "${targetFormType}" não encontrada.`);
          setIsLoading(false);
          return;
        }
        setFormDefinition(definition);

        try {
          const reportsSubCollectionRef = collection(db, "ordens_servico", osId, "relatorios");
          // Query for reports of the targetFormType, order by submission date descending to get the latest.
          // If mainReportSubmittedAt is available, you could potentially add a where clause
          // to find reports submitted around the same time or after the main report, if relevant.
          const q = query(
            reportsSubCollectionRef,
            where("formType", "==", targetFormType),
            orderBy("submittedAt", "desc")
            // limit(1) // Uncomment if you only ever want the single most recent one
          );
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            // For simplicity, taking the first (most recent) one.
            // If multiple could be relevant, you might need a way to select which one.
            const docSnap = querySnapshot.docs[0]; 
            setLinkedReport({ id: docSnap.id, ...docSnap.data() } as LinkedReportData);
          } else {
            setError(`Nenhum relatório do tipo "${definition.name}" encontrado para a OS "${osId}".`);
          }
        } catch (e: any) {
          console.error("Erro ao buscar relatório vinculado: ", e);
          setError(`Falha ao buscar relatório vinculado: ${e.message}`);
        } finally {
          setIsLoading(false);
        }
      };
      fetchLinkedReport();
    }
  }, [isOpen, targetFormType, osId, mainReportSubmittedAt]);

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

  const renderFieldValueModal = (field: FormField, value: any) => {
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

  const FormSpecificIcon = formDefinition ? getFormIcon(formDefinition.iconName) : FileText;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b flex flex-row justify-between items-center sticky top-0 bg-background z-10">
          <div className="flex items-center gap-3">
            {formDefinition && <FormSpecificIcon className="h-6 w-6 text-primary" />}
            <DialogTitle className="text-xl">
              {formDefinition ? formDefinition.name : 'Relatório Vinculado'}
            </DialogTitle>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" aria-label="Fechar modal">
              <X className="h-5 w-5" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto p-6 space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3">Carregando relatório vinculado...</p>
            </div>
          )}
          {error && !isLoading && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro ao Carregar</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!isLoading && !error && linkedReport && formDefinition && (
            <>
              <div className="text-sm text-muted-foreground">
                <p>OS: <strong className="text-foreground">{osId}</strong></p>
                <p>ID do Relatório Vinculado: {linkedReport.id}</p>
                <p>Submetido em: {linkedReport.submittedAt ? format(linkedReport.submittedAt.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Data inválida'}</p>
                {linkedReport.gerenteId && <p>ID Gerente: {linkedReport.gerenteId}</p>}
              </div>
              <div className="space-y-3 pt-2">
                {formDefinition.fields.map((field) => {
                  const fieldValue = linkedReport.formData[field.id];
                   // Simplified conditional rendering for linked reports;
                   // Complex inter-field dependencies within the linked form might not be fully handled here
                   // unless explicitly defined or simplified.
                  const FieldIcon = fieldTypeIconsModal[field.type] || FileText;
                  return (
                    <div key={field.id} className="p-3 border rounded-md bg-card/30 shadow-sm">
                      <div className="flex items-center mb-1">
                        <FieldIcon className="h-4 w-4 mr-2 text-primary" />
                        <h4 className="text-xs font-semibold text-foreground">{field.label}</h4>
                      </div>
                      <div className="text-sm text-foreground pl-6">
                        {renderFieldValueModal(field, fieldValue)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {!isLoading && !error && !linkedReport && formDefinition && (
             <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Não Encontrado</AlertTitle>
                <AlertDescription>
                    Nenhum relatório do tipo "{formDefinition.name}" encontrado para a OS "{osId}".
                </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="p-4 border-t flex justify-end bg-background">
          <DialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </DialogClose>
        </DialogFooter>

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
      </DialogContent>
    </Dialog>
  );
}

    