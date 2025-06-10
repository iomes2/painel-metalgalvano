
"use client";

import { useState, useEffect, FormEvent, useCallback, useMemo } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth/AuthInitializer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import "@/components/ui/style.css";
import { TableHeader, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowDown, ArrowUp, Download, Eye, Loader2, AlertTriangle, Search as SearchIcon, FileSearch, Users } from 'lucide-react';
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

interface OsData {
  id: string; // OS number
  os: string;
  lastReportAt: Timestamp;
  // Add any other relevant OS-level data you might want to display
}

type SortableColumn = 'formName' | 'submittedAt';
type SortableOsColumn = 'os' | 'lastReportAt';

// Lista estática de gerentes. No futuro, isso poderia vir de uma coleção no Firestore.
const gerentesRegistrados = [
  { id: 'MG001', nome: 'Renan Iomes' },
  { id: 'MG002', nome: 'Gerente Silva' },
  { id: 'MG003', nome: 'Gerente Oliveira' },
  { id: 'MG004', nome: 'Gerente Souza' },
];

export default function SearchPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados para busca por OS
  const [osInput, setOsInput] = useState('');
  const [searchedOs, setSearchedOs] = useState<string | null>(null);
  const [results, setResults] = useState<ReportData[]>([]);
  const [sortColumn, setSortColumn] = useState<SortableColumn>('submittedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Estados para busca por Gerente
  const [selectedGerenteIdParaBusca, setSelectedGerenteIdParaBusca] = useState<string | undefined>(undefined);
  const [searchedGerenteId, setSearchedGerenteId] = useState<string | null>(null);
  const [osResultsByGerente, setOsResultsByGerente] = useState<OsData[]>([]);
  const [sortOsColumn, setSortOsColumn] = useState<SortableOsColumn>('lastReportAt');
  const [sortOsDirection, setSortOsDirection] = useState<'asc' | 'desc'>('desc');

  // Estados gerais
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<ReportPhoto | null>(null);
  const [currentImageList, setCurrentImageList] = useState<ReportPhoto[]>([]);
  const [hasPerformedInitialSearch, setHasPerformedInitialSearch] = useState(false);
  const [activeSearchType, setActiveSearchType] = useState<'os' | 'gerente' | null>(null);


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

  const performSearchByOs = useCallback(async (osToSearch: string, isInitialLoadSearch = false) => {
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
      setActiveSearchType(null);
      setOsResultsByGerente([]); // Limpa resultados da busca por gerente
      setSearchedGerenteId(null); // Limpa ID do gerente pesquisado
      if (searchParams.get('os')) router.push('/dashboard/search', { scroll: false });
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setSearchedOs(trimmedOsToSearch);
    setActiveSearchType('os');
    setOsResultsByGerente([]); 
    setSearchedGerenteId(null);

    if (trimmedOsToSearch !== searchParams.get('os')) {
      router.push(`/dashboard/search?os=${trimmedOsToSearch}`, { scroll: false });
    }

    try {
      const reportsSubCollectionRef = collection(db, "ordens_servico", trimmedOsToSearch, "relatorios");
      const q = query(reportsSubCollectionRef, orderBy('submittedAt', 'desc'));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError(`Nenhum relatório encontrado para a OS: ${trimmedOsToSearch}`);
      } else {
        const fetchedResults = querySnapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            formName: data.formName || 'Nome do Formulário Indisponível',
            formType: data.formType || 'unknown_form',
            submittedAt: data.submittedAt as Timestamp,
            formData: data.formData || {},
            photoUrls: extractPhotos(data.formData || {}),
          } as ReportData;
        });
        setResults(fetchedResults);
      }
    } catch (e: any) {
      console.error("Erro ao buscar relatórios por OS: ", e);
      setError("Falha ao buscar relatórios. Verifique o console ou se o índice do Firestore existe.");
      toast({ title: "Erro na Busca por OS", description: e.message || "Ocorreu um erro.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, router, searchParams]);


  const performSearchByGerente = useCallback(async (gerenteIdToSearch: string) => {
    if (!user) {
      toast({ title: "Autenticação Necessária", variant: "destructive" });
      return;
    }
    if (!gerenteIdToSearch) {
      toast({ title: "Seleção Obrigatória", description: "Por favor, selecione um gerente.", variant: "destructive" });
      setOsResultsByGerente([]);
      setSearchedGerenteId(null);
      setError(null);
      setActiveSearchType(null);
      setResults([]); // Limpa resultados da busca por OS
      setSearchedOs(null); // Limpa OS pesquisada
      return;
    }

    setIsLoading(true);
    setError(null);
    setOsResultsByGerente([]);
    setSearchedGerenteId(gerenteIdToSearch);
    setActiveSearchType('gerente');
    setResults([]); 
    setSearchedOs(null);
    
    // Limpa o parâmetro 'os' da URL se houver, pois estamos buscando por gerente
    if (searchParams.get('os')) {
      router.push('/dashboard/search', { scroll: false });
    }

    try {
      const osCollectionRef = collection(db, "ordens_servico");
      // Importante: Esta consulta requer um índice composto no Firestore:
      // Coleção: ordens_servico, Campos: updatedByGerenteId (ASC), lastReportAt (DESC)
      const q = query(osCollectionRef,
                      where("updatedByGerenteId", "==", gerenteIdToSearch),
                      orderBy("lastReportAt", "desc"));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError(`Nenhuma Ordem de Serviço encontrada para o gerente ID: ${gerenteIdToSearch}`);
      } else {
        const fetchedOsResults = querySnapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id, // O ID do documento é o número da OS
            os: data.os || docSnap.id, // Garante que temos o número da OS
            lastReportAt: data.lastReportAt as Timestamp,
          } as OsData;
        });
        setOsResultsByGerente(fetchedOsResults);
      }
    } catch (e: any) {
      console.error("Erro ao buscar OS por gerente: ", e);
      setError("Falha ao buscar Ordens de Serviço. Verifique o console ou se o índice necessário no Firestore existe (updatedByGerenteId ASC, lastReportAt DESC na coleção 'ordens_servico').");
      toast({ title: "Erro na Busca por Gerente", description: e.message || "Ocorreu um erro.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, router, searchParams]);


  useEffect(() => {
    const osFromUrl = searchParams.get('os');
    if (osFromUrl && !hasPerformedInitialSearch) {
      setOsInput(osFromUrl);
      performSearchByOs(osFromUrl, true);
      setHasPerformedInitialSearch(true);
    } else if (!osFromUrl && !hasPerformedInitialSearch) {
      setHasPerformedInitialSearch(true);
    }
  }, [searchParams, performSearchByOs, hasPerformedInitialSearch]);


  const handleSearchByOsSubmit = (e: FormEvent) => {
    e.preventDefault();
    performSearchByOs(osInput);
  };

  const handleSearchByGerenteSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (selectedGerenteIdParaBusca) {
      performSearchByGerente(selectedGerenteIdParaBusca);
    } else {
      toast({ title: "Seleção Obrigatória", description: "Por favor, selecione um gerente para pesquisar.", variant: "destructive" });
    }
  };
  
  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      setSortDirection(prevDirection => (prevDirection === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleSortOs = (column: SortableOsColumn) => {
    if (sortOsColumn === column) {
      setSortOsDirection(prevDirection => (prevDirection === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortOsColumn(column);
      setSortOsDirection('asc');
    }
  };

  const sortedResults = useMemo(() => {
    if (!sortColumn || results.length === 0) return results;
    return [...results].sort((a, b) => {
      let comparison = 0;
      if (sortColumn === 'formName') comparison = a.formName.localeCompare(b.formName);
      else if (sortColumn === 'submittedAt') comparison = a.submittedAt.toMillis() - b.submittedAt.toMillis();
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [results, sortColumn, sortDirection]);

  const sortedOsResultsByGerente = useMemo(() => {
    if (!sortOsColumn || osResultsByGerente.length === 0) return osResultsByGerente;
    return [...osResultsByGerente].sort((a, b) => {
      let comparison = 0;
      if (sortOsColumn === 'os') comparison = a.os.localeCompare(b.os);
      else if (sortOsColumn === 'lastReportAt') comparison = a.lastReportAt.toMillis() - b.lastReportAt.toMillis();
      return sortOsDirection === 'asc' ? comparison : -comparison;
    });
  }, [osResultsByGerente, sortOsColumn, sortOsDirection]);


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
  
  const SortIndicator = ({ column, type }: { column: SortableColumn | SortableOsColumn, type: 'report' | 'os' }) => {
    const currentSortCol = type === 'report' ? sortColumn : sortOsColumn;
    const currentSortDir = type === 'report' ? sortDirection : sortOsDirection;
    if (currentSortCol !== column) return null;
    return currentSortDir === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const handleViewReportsForOs = (os: string) => {
    setOsInput(os);
    performSearchByOs(os);
  };

  return (
    <div className="space-y-8 search-container">
      <Card className="shadow-lg overflow-hidden container-consulta">
        <CardHeader>
          <div className="flex items-center gap-3">
            <SearchIcon className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold">Consultar Relatórios</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formulário de Busca por OS */}
          <form onSubmit={handleSearchByOsSubmit} className="flex flex-col sm:flex-row gap-4">
            <Input
              type="tel"
              value={osInput}
              onChange={(e) => setOsInput(e.target.value)}
              placeholder="Buscar por OS (ex: 123)"
              className="flex-grow text-base md:text-sm"
              aria-label="Ordem de Serviço"
            />
            <Button type="submit" disabled={isLoading && activeSearchType === 'os'} className="bg-primary hover:bg-primary/90 text-base md:text-sm">
              {isLoading && activeSearchType === 'os' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SearchIcon className="mr-2 h-4 w-4" />}
              Buscar OS
            </Button>
          </form>

          {/* Formulário de Busca por Gerente (apenas desktop) */}
          <div className="hidden md:block border-t border-border pt-6 mt-6">
            <form onSubmit={handleSearchByGerenteSubmit} className="flex flex-col sm:flex-row gap-4 items-center">
                <Users className="h-6 w-6 text-muted-foreground sm:hidden" /> {/* Ícone para mobile, se fosse visível */}
                <Select onValueChange={setSelectedGerenteIdParaBusca} value={selectedGerenteIdParaBusca}>
                  <SelectTrigger className="flex-grow text-base md:text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <SelectValue placeholder="Buscar OS por Gerente..." />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {gerentesRegistrados.map((gerente) => (
                      <SelectItem key={gerente.id} value={gerente.id} className="py-2">
                        {gerente.nome} ({gerente.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              <Button type="submit" disabled={isLoading && activeSearchType === 'gerente' || !selectedGerenteIdParaBusca} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground text-base md:text-sm">
                {isLoading && activeSearchType === 'gerente' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SearchIcon className="mr-2 h-4 w-4" />}
                Buscar por Gerente
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Buscando...</p>
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

      {/* Resultados da Busca por OS */}
      {activeSearchType === 'os' && !isLoading && !error && searchedOs && results.length === 0 && (
         <Card className="shadow-md overflow-hidden">
          <CardHeader><CardTitle>Nenhum Relatório</CardTitle></CardHeader>
          <CardContent><p>Nenhum relatório encontrado para a OS: "{searchedOs}".</p></CardContent>
        </Card>
      )}

      {activeSearchType === 'os' && results.length > 0 && !isLoading && !error && (
        <Card className="shadow-md overflow-hidden container-resultados-lista">
          <CardHeader>
            <CardTitle>Relatórios para OS: {searchedOs}</CardTitle>
            <CardDescription>{results.length} relatório(s) encontrado(s).</CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden card-resultados-lista">
            <div className="max-h-[24rem] overflow-y-auto overflow-x-auto relative border border-border rounded-md w-full max-w-full">
              <table className="w-full caption-bottom text-sm table-os">
                <TableHeader className="sticky top-0 bg-background z-10 [&_tr]:border-b">
                  <TableRow>
                    <TableHead onClick={() => handleSort('formName')} className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center colunas-lista">Nome do Formulário <SortIndicator column="formName" type="report"/></div>
                    </TableHead>
                    <TableHead onClick={() => handleSort('submittedAt')} className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center colunas-lista">Data de Envio <SortIndicator column="submittedAt" type="report"/></div>
                    </TableHead>
                    <TableHead className="text-center colunas-lista">Fotos</TableHead>
                    <TableHead className="text-center colunas-lista">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedResults.map((report, index) => (
                    <TableRow key={report.id} className={cn("transition-colors hover:bg-muted/50", index % 2 !== 0 ? 'bg-[#80808021]' : '')}>
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
                        ) : (<span className="text-muted-foreground">Nenhuma</span>)}
                      </TableCell>
                      <TableCell className="text-center coluna-acao-lista">
                        <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground whitespace-nowrap">
                          <Link href={`/dashboard/view-report/${searchedOs}/${report.id}?formType=${report.formType}`}>
                            <FileSearch className="mr-2 h-4 w-4" />Visualizar
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

      {/* Resultados da Busca por Gerente */}
      {activeSearchType === 'gerente' && !isLoading && !error && searchedGerenteId && osResultsByGerente.length === 0 && (
         <Card className="shadow-md overflow-hidden">
          <CardHeader><CardTitle>Nenhuma OS Encontrada</CardTitle></CardHeader>
          <CardContent><p>Nenhuma Ordem de Serviço encontrada para o gerente ID: "{searchedGerenteId}".</p></CardContent>
        </Card>
      )}

      {activeSearchType === 'gerente' && osResultsByGerente.length > 0 && !isLoading && !error && (
        <Card className="shadow-md overflow-hidden container-resultados-lista">
          <CardHeader>
             <CardTitle>Ordens de Serviço para Gerente: {gerentesRegistrados.find(g => g.id === searchedGerenteId)?.nome || searchedGerenteId}</CardTitle>
            <CardDescription>{osResultsByGerente.length} OS(s) encontrada(s).</CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden card-resultados-lista">
             <div className="max-h-[24rem] overflow-y-auto overflow-x-auto relative border border-border rounded-md w-full max-w-full">
              <table className="w-full caption-bottom text-sm table-os">
                <TableHeader className="sticky top-0 bg-background z-10 [&_tr]:border-b">
                  <TableRow>
                    <TableHead onClick={() => handleSortOs('os')} className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center colunas-lista">Ordem de Serviço (OS) <SortIndicator column="os" type="os"/></div>
                    </TableHead>
                    <TableHead onClick={() => handleSortOs('lastReportAt')} className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center colunas-lista">Último Relatório em <SortIndicator column="lastReportAt" type="os"/></div>
                    </TableHead>
                    <TableHead className="text-center colunas-lista">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedOsResultsByGerente.map((osItem, index) => (
                    <TableRow key={osItem.id} className={cn("transition-colors hover:bg-muted/50", index % 2 !== 0 ? 'bg-[#80808021]' : '')}>
                      <TableCell className="font-medium">{osItem.os}</TableCell>
                      <TableCell className="date-time-cell whitespace-nowrap text-center">
                        {osItem.lastReportAt.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        <br />
                        {osItem.lastReportAt.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell className="text-center coluna-acao-lista">
                        <Button 
                          size="sm" 
                          className="bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground whitespace-nowrap"
                          onClick={() => handleViewReportsForOs(osItem.os)}
                        >
                          <FileSearch className="mr-2 h-4 w-4" />Ver Relatórios
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
          isOpen={isImageModalOpen}
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
