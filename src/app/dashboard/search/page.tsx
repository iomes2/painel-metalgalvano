
"use client";

import { useState, useEffect, FormEvent, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth/AuthInitializer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Download, Eye, Loader2, AlertTriangle, Search as SearchIcon, FileSearch } from 'lucide-react';
import ImageModal from '@/components/search/ImageModal';

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
  submittedAt: Timestamp;
  formData: Record<string, any>; 
  photoUrls?: ReportPhoto[]; // Made optional as it might not always be present directly
}

export default function SearchPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [osInput, setOsInput] = useState('');
  const [searchedOs, setSearchedOs] = useState<string | null>(null);
  const [results, setResults] = useState<ReportData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<ReportPhoto | null>(null);
  const [currentImageList, setCurrentImageList] = useState<ReportPhoto[]>([]);
  const [hasPerformedInitialSearch, setHasPerformedInitialSearch] = useState(false);

  const extractPhotos = (formData: Record<string, any>): ReportPhoto[] => {
    const photos: ReportPhoto[] = [];
    for (const key in formData) {
      if (Array.isArray(formData[key])) {
        const fieldData = formData[key] as any[];
        if (fieldData.every(item => typeof item === 'object' && item !== null && 'name' && 'url' in item)) {
           fieldData.forEach(photo => {
            if (photo.url && typeof photo.url === 'string' && (photo.url.startsWith('http') || photo.url.startsWith('data:image'))) {
              photos.push({
                name: photo.name || 'Unnamed Photo',
                url: photo.url,
                type: photo.type || 'image/unknown',
                size: photo.size || 0
              });
            }
          });
        }
      }
    }
    return photos;
  };

  const performSearch = useCallback(async (osToSearch: string, isInitialLoadSearch = false) => {
    if (!user) {
      toast({ title: "Autenticação Necessária", description: "Você precisa estar logado para pesquisar.", variant: "destructive" });
      return;
    }

    const trimmedOsToSearch = osToSearch.trim();

    if (!trimmedOsToSearch) {
      if (!isInitialLoadSearch) { // Only show toast if it's a user-initiated empty search
        toast({ title: "Campo Obrigatório", description: "Por favor, insira uma Ordem de Serviço para pesquisar.", variant: "destructive" });
      }
      setResults([]);
      setSearchedOs(null);
      setError(null);
      // Remove 'os' from URL if search is cleared
      if (searchParams.get('os')) {
        router.push('/dashboard/search', { scroll: false });
      }
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setSearchedOs(trimmedOsToSearch);

    // Update URL if the new search term is different from the current URL param or if no param exists
    if (trimmedOsToSearch !== searchParams.get('os')) {
      router.push(`/dashboard/search?os=${trimmedOsToSearch}`, { scroll: false });
    }

    try {
      const reportsSubCollectionRef = collection(db, "ordens_servico", trimmedOsToSearch, "relatorios");
      const q = query(reportsSubCollectionRef, orderBy('submittedAt', 'desc'));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError(`Nenhum relatório encontrado para a OS: ${trimmedOsToSearch}`);
        setResults([]);
      } else {
        const fetchedResults = querySnapshot.docs.map(docSnap => {
          const data = docSnap.data();
          const formData = data.formData || {};
          // Ensure submittedAt is a Timestamp, convert if it's a Date object from a direct state set or similar
          let submittedAtTimestamp = data.submittedAt;
          if (data.submittedAt && typeof data.submittedAt.toDate === 'function') {
            submittedAtTimestamp = data.submittedAt as Timestamp;
          } else if (data.submittedAt instanceof Date) {
            submittedAtTimestamp = Timestamp.fromDate(data.submittedAt);
          } else {
            // Fallback or default if somehow not a valid type, or log an error
            console.warn("submittedAt was not a Firestore Timestamp or JS Date:", data.submittedAt);
            submittedAtTimestamp = Timestamp.now(); // Or handle as an error
          }

          return {
            id: docSnap.id,
            formName: data.formName || 'Nome do Formulário Indisponível',
            formType: data.formType || 'unknown_form', 
            submittedAt: submittedAtTimestamp,
            formData: formData,
            photoUrls: extractPhotos(formData),
          } as ReportData;
        });
        setResults(fetchedResults);
      }
    } catch (e: any) {
      console.error("Erro ao buscar relatórios: ", e);
      setError("Falha ao buscar relatórios. Verifique o console para mais detalhes ou se o índice necessário no Firestore existe.");
      toast({ title: "Erro na Busca", description: e.message || "Ocorreu um erro desconhecido.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, router, searchParams]);

  useEffect(() => {
    const osFromUrl = searchParams.get('os');
    if (osFromUrl && !hasPerformedInitialSearch) {
      setOsInput(osFromUrl);
      performSearch(osFromUrl, true);
      setHasPerformedInitialSearch(true); 
    } else if (!osFromUrl && !hasPerformedInitialSearch) {
      // Ensure we mark initial phase as done even if there's no OS in URL
      // to prevent re-triggering if searchParams change for other reasons.
      setHasPerformedInitialSearch(true);
    }
  }, [searchParams, performSearch, hasPerformedInitialSearch]);


  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    performSearch(osInput);
  };

  const openImageModal = (image: ReportPhoto, imageList: ReportPhoto[]) => {
    setCurrentImage(image);
    setCurrentImageList(imageList);
    setIsModalOpen(true);
  };

  const handleDownloadPhoto = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Download Iniciado", description: `Baixando ${name}` });
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <SearchIcon className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold">Consultar Relatórios por OS</CardTitle>
          </div>
          <CardDescription className="text-lg text-muted-foreground">
            Digite o número da Ordem de Serviço para encontrar relatórios associados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-4">
            <Input
              type="text"
              value={osInput}
              onChange={(e) => setOsInput(e.target.value)}
              placeholder="Digite a OS (ex: 123)"
              className="flex-grow text-base md:text-sm"
              aria-label="Ordem de Serviço"
            />
            <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-base md:text-sm">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SearchIcon className="mr-2 h-4 w-4" />}
              Pesquisar
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Buscando relatórios...</p>
        </div>
      )}

      {error && !isLoading && (
        <Card className="border-destructive bg-destructive/10 shadow-md">
          <CardHeader className="flex flex-row items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive">Erro na Pesquisa</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
            <Button variant="link" onClick={() => setError(null)} className="p-0 h-auto mt-2 text-destructive">
              Tentar nova pesquisa
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && searchedOs && results.length === 0 && (
         <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Nenhum Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Nenhum relatório encontrado para a OS: "{searchedOs}". Verifique o número da OS e tente novamente.</p>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && !isLoading && !error && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Resultados para OS: {searchedOs}</CardTitle>
            <CardDescription>{results.length} relatório(s) encontrado(s).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Formulário</TableHead>
                    <TableHead>Data de Envio</TableHead>
                    <TableHead className="text-center">Fotos Anexadas</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.formName}</TableCell>
                      <TableCell>{report.submittedAt.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</TableCell>
                      <TableCell className="text-center">
                        {report.photoUrls && report.photoUrls.length > 0 ? (
                          <Button variant="outline" size="sm" onClick={() => openImageModal(report.photoUrls![0], report.photoUrls!)}>
                            <Eye className="mr-2 h-4 w-4" /> Ver ({report.photoUrls.length})
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">Nenhuma</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/view-report/${searchedOs}/${report.id}?formType=${report.formType}`}>
                            <FileSearch className="mr-2 h-4 w-4" />
                            Visualizar
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Button variant="outline" onClick={() => router.push('/dashboard')} className="mt-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para o Painel Principal
      </Button>

      {currentImage && currentImageList.length > 0 && (
        <ImageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          image={currentImage}
          imageList={currentImageList}
          onDownload={handleDownloadPhoto}
          onNavigate={(nextImage) => setCurrentImage(nextImage)}
        />
      )}
    </div>
  );
}
