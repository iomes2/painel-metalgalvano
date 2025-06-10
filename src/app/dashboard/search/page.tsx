
"use client";

import { useState, useEffect, FormEvent, useCallback, useMemo } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth/AuthInitializer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import "@/components/ui/style.css";
import { TableHeader, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowDown, ArrowUp, Download, Eye, Loader2, AlertTriangle, Search as SearchIcon, FileSearch } from 'lucide-react';
import ImageModal from '@/components/search/ImageModal';
import { cn } from '@/lib/utils';

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
  photoUrls?: ReportPhoto[];
}

type SortableColumn = 'formName' | 'submittedAt';

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

  const [sortColumn, setSortColumn] = useState<SortableColumn>('submittedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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
      if (!isInitialLoadSearch) { 
        toast({ title: "Campo Obrigatório", description: "Por favor, insira uma Ordem de Serviço para pesquisar.", variant: "destructive" });
      }
      setResults([]);
      setSearchedOs(null);
      setError(null);
      if (searchParams.get('os')) {
        router.push('/dashboard/search', { scroll: false });
      }
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setSearchedOs(trimmedOsToSearch);

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
          let submittedAtTimestamp = data.submittedAt;
          if (data.submittedAt && typeof data.submittedAt.toDate === 'function') {
            submittedAtTimestamp = data.submittedAt as Timestamp;
          } else if (data.submittedAt instanceof Date) {
            submittedAtTimestamp = Timestamp.fromDate(data.submittedAt);
          } else {
            console.warn("submittedAt was not a Firestore Timestamp or JS Date:", data.submittedAt);
            submittedAtTimestamp = Timestamp.now(); 
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
        if (!sortColumn) {
           setSortColumn('submittedAt');
           setSortDirection('desc');
        }
      }
    } catch (e: any) {
      console.error("Erro ao buscar relatórios: ", e);
      setError("Falha ao buscar relatórios. Verifique o console para mais detalhes ou se o índice necessário no Firestore existe.");
      toast({ title: "Erro na Busca", description: e.message || "Ocorreu um erro desconhecido.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, router, searchParams, sortColumn]);

  useEffect(() => {
    const osFromUrl = searchParams.get('os');
    if (osFromUrl && !hasPerformedInitialSearch) {
      setOsInput(osFromUrl);
      performSearch(osFromUrl, true);
      setHasPerformedInitialSearch(true); 
    } else if (!osFromUrl && !hasPerformedInitialSearch) {
      setHasPerformedInitialSearch(true);
    }
  }, [searchParams, performSearch, hasPerformedInitialSearch]);


  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    performSearch(osInput);
  };

  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      setSortDirection(prevDirection => (prevDirection === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc'); 
    }
  };

  const sortedResults = useMemo(() => {
    if (!sortColumn || results.length === 0) return results;

    const sorted = [...results].sort((a, b) => {
        let comparison = 0;
        if (sortColumn === 'formName') {
            comparison = a.formName.localeCompare(b.formName);
        } else if (sortColumn === 'submittedAt') {
            const dateA = a.submittedAt.toMillis();
            const dateB = b.submittedAt.toMillis();
            comparison = dateA - dateB;
        }

        return sortDirection === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [results, sortColumn, sortDirection]);


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
  
  const SortIndicator = ({ column }: { column: SortableColumn }) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  return (
    <div className="space-y-8 search-container">
      <Card className="shadow-lg overflow-hidden container-consulta">
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
              type="tel"
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
        <Card className="border-destructive bg-destructive/10 shadow-md overflow-hidden">
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
         <Card className="shadow-md overflow-hidden">
          <CardHeader>
            <CardTitle>Nenhum Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Nenhum relatório encontrado para a OS: "{searchedOs}". Verifique o número da OS e tente novamente.</p>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && !isLoading && !error && (
        <Card className="shadow-md overflow-hidden container-resultados-lista">
          <CardHeader>
            <CardTitle>Resultados para OS: {searchedOs}</CardTitle>
            <CardDescription>{results.length} relatório(s) encontrado(s).</CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden card-resultados-lista">
            <div className="max-h-[24rem] overflow-y-auto overflow-x-auto relative border border-border rounded-md w-full max-w-full">
              <table className="w-full caption-bottom text-sm table-os">
                <TableHeader className="sticky top-0 bg-background z-10 [&_tr]:border-b">
                  <TableRow>
                    <TableHead 
                      onClick={() => handleSort('formName')} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center colunas-lista">
                        Nome do Formulário
                        <SortIndicator column="formName" />
                      </div>
                    </TableHead>
                    <TableHead 
                      onClick={() => handleSort('submittedAt')} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center colunas-lista">
                        Data de Envio
                        <SortIndicator column="submittedAt" />
                      </div>
                    </TableHead>
                    <TableHead className="text-center colunas-lista">Fotos Anexadas</TableHead>
                    <TableHead className="text-center colunas-lista">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedResults.map((report, index) => (
                    <TableRow 
                      key={report.id}
                      className={cn(
                        "transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
                        index % 2 !== 0 ? 'bg-[#80808021]' : '' 
                      )}
                    >
                      <TableCell className="font-medium break-words">{report.formName}</TableCell>
                      <TableCell className="date-time-cell whitespace-nowrap text-center">
                        {report.submittedAt.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        <br />
                        {report.submittedAt.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell className="text-center">
                        {report.photoUrls && report.photoUrls.length > 0 ? (
                          <Button variant="outline" size="sm" onClick={() => openImageModal(report.photoUrls![0], report.photoUrls!)}>
                            <Eye className="mr-2 h-4 w-4" /> Ver ({report.photoUrls.length})
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">Nenhuma</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center coluna-acao-lista">
                        <Button 
                          asChild 
                          size="sm"
                          className="bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground whitespace-nowrap"
                        >
                          <Link href={`/dashboard/view-report/${searchedOs}/${report.id}?formType=${report.formType}`}>
                            <FileSearch className="mr-2 h-4 w-4" />
                            Visualizar
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </table>
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
    

    



    