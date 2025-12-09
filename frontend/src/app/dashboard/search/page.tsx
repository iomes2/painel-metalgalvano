"use client";

import { useState, useEffect, FormEvent, useCallback, useMemo } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchGerentes,
  fetchRelatoriosByOs,
  fetchOsByGerente,
} from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import "@/components/ui/style.css";
import {
  TableHeader,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Download,
  Eye,
  Loader2,
  AlertTriangle,
  Search as SearchIcon,
  FileSearch,
  Users,
} from "lucide-react";
import ImageModal from "@/components/search/ImageModal";
import { cn } from "@/lib/utils";

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
  submittedAt: Date | Timestamp;
  formData: Record<string, any>;
  photoUrls?: ReportPhoto[];
}

interface OsData {
  id: string; // OS number
  os: string;
  lastReportAt: Date | Timestamp;
}

interface Gerente {
  id: string;
  nome: string;
}

type SortableColumn = "formName" | "submittedAt";
type SortableOsColumn = "os" | "lastReportAt";

export default function SearchPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados para busca por OS
  const [osInput, setOsInput] = useState("");
  const [searchedOs, setSearchedOs] = useState<string | null>(null);
  const [results, setResults] = useState<ReportData[]>([]);
  const [sortColumn, setSortColumn] = useState<SortableColumn>("submittedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Estados para busca por Gerente
  const [firestoreGerentes, setFirestoreGerentes] = useState<Gerente[]>([]);
  const [isLoadingGerentes, setIsLoadingGerentes] = useState(true);
  const [selectedGerenteIdParaBusca, setSelectedGerenteIdParaBusca] = useState<
    string | undefined
  >(undefined);
  const [searchedGerenteId, setSearchedGerenteId] = useState<string | null>(
    null
  );
  const [osResultsByGerente, setOsResultsByGerente] = useState<OsData[]>([]);
  const [sortOsColumn, setSortOsColumn] =
    useState<SortableOsColumn>("lastReportAt");
  const [sortOsDirection, setSortOsDirection] = useState<"asc" | "desc">(
    "desc"
  );

  // Estados gerais
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isImageModalOpen, setIsModalOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<ReportPhoto | null>(null);
  const [currentImageList, setCurrentImageList] = useState<ReportPhoto[]>([]);
  const [hasPerformedInitialSearch, setHasPerformedInitialSearch] =
    useState(false);
  const [activeSearchType, setActiveSearchType] = useState<
    "os" | "gerente" | null
  >(null);

  useEffect(() => {
    // Aguarda autenticação antes de carregar gerentes
    if (authLoading || !user) return;

    const loadGerentes = async () => {
      setIsLoadingGerentes(true);
      try {
        const gerentes = await fetchGerentes();
        setFirestoreGerentes(gerentes);
      } catch (e: any) {
        console.error("Erro ao buscar gerentes: ", e);
        toast({
          title: "Erro ao Carregar Gerentes",
          description:
            e.message || "Não foi possível buscar a lista de gerentes.",
          variant: "destructive",
        });
        setFirestoreGerentes([]);
      } finally {
        setIsLoadingGerentes(false);
      }
    };
    loadGerentes();
  }, [user, authLoading, toast]);

  const getDateObject = (dateOrTimestamp: Date | Timestamp): Date => {
    if (dateOrTimestamp instanceof Date) {
      return dateOrTimestamp;
    }
    return dateOrTimestamp.toDate();
  };

  const extractPhotos = (formData: Record<string, any>): ReportPhoto[] => {
    const photos: ReportPhoto[] = [];
    for (const key in formData) {
      if (Array.isArray(formData[key])) {
        const fieldData = formData[key] as any[];
        if (
          fieldData.every(
            (item) =>
              typeof item === "object" &&
              item !== null &&
              "name" in item &&
              "url" in item
          )
        ) {
          fieldData.forEach((photo) => {
            if (
              photo.url &&
              typeof photo.url === "string" &&
              (photo.url.startsWith("http") ||
                photo.url.startsWith("data:image"))
            ) {
              photos.push({
                name: photo.name || "Unnamed Photo",
                url: photo.url,
                type: photo.type || "image/unknown",
                size: photo.size || 0,
              });
            }
          });
        }
      }
    }
    return photos;
  };

  const performSearchByOs = useCallback(
    async (osToSearch: string, isInitialLoadSearch = false) => {
      if (!user) {
        toast({
          title: "Autenticação Necessária",
          description: "Você precisa estar logado para pesquisar.",
          variant: "destructive",
        });
        return;
      }
      const trimmedOsToSearch = osToSearch.trim();
      if (!trimmedOsToSearch) {
        if (!isInitialLoadSearch) {
          toast({
            title: "Campo Obrigatório",
            description:
              "Por favor, insira uma Ordem de Serviço para pesquisar.",
            variant: "destructive",
          });
        }
        setResults([]);
        setSearchedOs(null);
        setError(null);
        setActiveSearchType(null);
        setOsResultsByGerente([]);
        setSearchedGerenteId(null);
        if (searchParams.get("os"))
          router.push("/dashboard/search", { scroll: false });
        return;
      }

      setIsLoading(true);
      setError(null);
      setResults([]);
      setSearchedOs(trimmedOsToSearch);
      setActiveSearchType("os");
      setOsResultsByGerente([]);
      setSearchedGerenteId(null);

      if (trimmedOsToSearch !== searchParams.get("os")) {
        router.push(`/dashboard/search?os=${trimmedOsToSearch}`, {
          scroll: false,
        });
      }

      try {
        const fetchedResults = await fetchRelatoriosByOs(trimmedOsToSearch);

        if (fetchedResults.length === 0) {
          setError(
            `Nenhum relatório encontrado para a OS: ${trimmedOsToSearch}`
          );
        } else {
          // fetchRelatoriosByOs já retorna os dados formatados com photoUrls
          setResults(fetchedResults);
        }
      } catch (e: any) {
        console.error("Erro ao buscar relatórios por OS: ", e);
        setError(
          "Falha ao buscar relatórios. Verifique o console ou se o índice do Firestore existe."
        );
        toast({
          title: "Erro na Busca por OS",
          description: e.message || "Ocorreu um erro.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [user, toast, router, searchParams]
  );

  const performSearchByGerente = useCallback(
    async (gerenteIdToSearch: string) => {
      if (!user) {
        toast({ title: "Autenticação Necessária", variant: "destructive" });
        return;
      }
      if (!gerenteIdToSearch) {
        toast({
          title: "Seleção Obrigatória",
          description: "Por favor, selecione um gerente.",
          variant: "destructive",
        });
        setOsResultsByGerente([]);
        setSearchedGerenteId(null);
        setError(null);
        setActiveSearchType(null);
        setResults([]);
        setSearchedOs(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      setOsResultsByGerente([]);
      setSearchedGerenteId(gerenteIdToSearch);
      setActiveSearchType("gerente");
      setResults([]);
      setSearchedOs(null);

      if (searchParams.get("os")) {
        router.push("/dashboard/search", { scroll: false });
      }

      try {
        const fetchedOsResults = await fetchOsByGerente(gerenteIdToSearch);

        if (fetchedOsResults.length === 0) {
          const gerenteNome =
            firestoreGerentes.find((g) => g.id === gerenteIdToSearch)?.nome ||
            gerenteIdToSearch;
          setError(
            `Nenhuma Ordem de Serviço encontrada para o gerente: ${gerenteNome}`
          );
        } else {
          setOsResultsByGerente(fetchedOsResults);
        }
      } catch (e: any) {
        console.error("Erro ao buscar OS por gerente: ", e);
        setError(
          "Falha ao buscar Ordens de Serviço. Verifique o console ou se o índice necessário no Firestore existe (updatedByGerenteId ASC, lastReportAt DESC na coleção 'ordens_servico')."
        );
        toast({
          title: "Erro na Busca por Gerente",
          description: e.message || "Ocorreu um erro.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [user, toast, router, searchParams, firestoreGerentes]
  );

  useEffect(() => {
    const osFromUrl = searchParams.get("os");
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
      toast({
        title: "Seleção Obrigatória",
        description: "Por favor, selecione um gerente para pesquisar.",
        variant: "destructive",
      });
    }
  };

  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      setSortDirection((prevDirection) =>
        prevDirection === "asc" ? "desc" : "asc"
      );
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleSortOs = (column: SortableOsColumn) => {
    if (sortOsColumn === column) {
      setSortOsDirection((prevDirection) =>
        prevDirection === "asc" ? "desc" : "asc"
      );
    } else {
      setSortOsColumn(column);
      setSortOsDirection("asc");
    }
  };

  const sortedResults = useMemo(() => {
    if (!sortColumn || results.length === 0) return results;
    return [...results].sort((a, b) => {
      let comparison = 0;
      if (sortColumn === "formName")
        comparison = a.formName.localeCompare(b.formName);
      else if (sortColumn === "submittedAt") {
        const timeA =
          a.submittedAt instanceof Date
            ? a.submittedAt.getTime()
            : a.submittedAt.toMillis();
        const timeB =
          b.submittedAt instanceof Date
            ? b.submittedAt.getTime()
            : b.submittedAt.toMillis();
        comparison = timeA - timeB;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [results, sortColumn, sortDirection]);

  const sortedOsResultsByGerente = useMemo(() => {
    if (!sortOsColumn || osResultsByGerente.length === 0)
      return osResultsByGerente;
    return [...osResultsByGerente].sort((a, b) => {
      let comparison = 0;
      if (sortOsColumn === "os") comparison = a.os.localeCompare(b.os);
      else if (sortOsColumn === "lastReportAt") {
        const timeA =
          a.lastReportAt instanceof Date
            ? a.lastReportAt.getTime()
            : a.lastReportAt.toMillis();
        const timeB =
          b.lastReportAt instanceof Date
            ? b.lastReportAt.getTime()
            : b.lastReportAt.toMillis();
        comparison = timeA - timeB;
      }
      return sortOsDirection === "asc" ? comparison : -comparison;
    });
  }, [osResultsByGerente, sortOsColumn, sortOsDirection]);

  const openImageModal = (image: ReportPhoto, imageList: ReportPhoto[]) => {
    setCurrentImage(image);
    setCurrentImageList(imageList);
    setIsModalOpen(true);
  };

  const handleDownloadPhoto = (url: string, name: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Download Iniciado", description: `Baixando ${name}` });
  };

  const SortIndicator = ({
    column,
    type,
  }: {
    column: SortableColumn | SortableOsColumn;
    type: "report" | "os";
  }) => {
    const currentSortCol = type === "report" ? sortColumn : sortOsColumn;
    const currentSortDir = type === "report" ? sortDirection : sortOsDirection;
    if (currentSortCol !== column) return null;
    return currentSortDir === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  const handleViewReportsForOs = (os: string) => {
    setOsInput(os);
    performSearchByOs(os);
  };

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      {/* Premium Header - matching Monitoring Panel */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900 p-4 md:p-6 shadow-xl">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />

        <div className="relative z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <span>Dashboard</span>
            <span>›</span>
            <span className="text-cyan-400">Consultar</span>
          </div>

          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/20">
              <SearchIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">
                Consultar Relatórios
              </h1>
              <p className="text-sm text-slate-400 hidden sm:block">
                Busque por OS ou por gerente responsável
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Forms Card */}
      <div className="rounded-2xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg overflow-hidden">
        <div className="p-4 md:p-6 space-y-5">
          {/* Busca por OS */}
          <form
            onSubmit={handleSearchByOsSubmit}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Input
              type="tel"
              value={osInput}
              onChange={(e) => setOsInput(e.target.value)}
              placeholder="Buscar por OS (ex: 123)"
              className="flex-grow text-base md:text-sm h-11 rounded-xl border-slate-200 dark:border-slate-700"
              aria-label="Ordem de Serviço"
            />
            <Button
              type="submit"
              disabled={isLoading && activeSearchType === "os"}
              className="h-11 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-md"
            >
              {isLoading && activeSearchType === "os" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <SearchIcon className="mr-2 h-4 w-4" />
              )}
              Buscar OS
            </Button>
          </form>

          {/* Divider */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
            <span className="text-xs text-slate-400 font-medium">ou</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
          </div>

          {/* Busca por Gerente (apenas desktop) */}
          <form
            onSubmit={handleSearchByGerenteSubmit}
            className="hidden md:flex flex-col sm:flex-row gap-3 items-center"
          >
            <Select
              onValueChange={setSelectedGerenteIdParaBusca}
              value={selectedGerenteIdParaBusca}
              disabled={isLoadingGerentes || firestoreGerentes.length === 0}
            >
              <SelectTrigger className="flex-grow text-base md:text-sm h-11 rounded-xl border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <SelectValue
                    placeholder={
                      isLoadingGerentes
                        ? "Carregando gerentes..."
                        : firestoreGerentes.length === 0
                        ? "Nenhum gerente encontrado"
                        : "Selecione um gerente..."
                    }
                  />
                </div>
              </SelectTrigger>
              <SelectContent>
                {!isLoadingGerentes && firestoreGerentes.length > 0 ? (
                  firestoreGerentes.map((gerente) => (
                    <SelectItem
                      key={gerente.id}
                      value={gerente.id}
                      className="py-2"
                    >
                      {gerente.nome} ({gerente.id})
                    </SelectItem>
                  ))
                ) : !isLoadingGerentes && firestoreGerentes.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Nenhum gerente cadastrado.
                  </div>
                ) : null}
              </SelectContent>
            </Select>
            <Button
              type="submit"
              disabled={
                (isLoading && activeSearchType === "gerente") ||
                !selectedGerenteIdParaBusca ||
                isLoadingGerentes
              }
              className="h-11 px-6 rounded-xl bg-slate-600 hover:bg-slate-700 text-white"
            >
              {isLoading && activeSearchType === "gerente" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <SearchIcon className="mr-2 h-4 w-4" />
              )}
              Buscar por Gerente
            </Button>
          </form>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Buscando...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/80 dark:bg-red-900/20 p-4 md:p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
              Erro na Pesquisa
            </h3>
          </div>
          <p className="text-red-600 dark:text-red-300">{error}</p>
          <Button
            variant="link"
            onClick={() => setError(null)}
            className="p-0 h-auto mt-2 text-red-500"
          >
            Tentar nova pesquisa
          </Button>
        </div>
      )}

      {/* Resultados da Busca por OS */}
      {activeSearchType === "os" &&
        !isLoading &&
        !error &&
        searchedOs &&
        results.length === 0 && (
          <div className="rounded-2xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-lg text-center">
            <FileSearch className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
              Nenhum Relatório
            </h3>
            <p className="text-slate-500 mt-1">
              Nenhum relatório encontrado para a OS: "{searchedOs}".
            </p>
          </div>
        )}

      {activeSearchType === "os" &&
        results.length > 0 &&
        !isLoading &&
        !error && (
          <div className="rounded-2xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-200/50 dark:border-slate-700/50">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Relatórios para OS: {searchedOs}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {results.length} relatório(s) encontrado(s).
              </p>
            </div>
            <div className="p-4 md:p-6 overflow-hidden">
              <div className="max-h-[24rem] overflow-y-auto overflow-x-hidden relative border border-border rounded-md">
                <table className="w-full caption-bottom text-sm table-os min-w-0 table-fixed">
                  <TableHeader className="sticky top-0 bg-background z-10 [&_tr]:border-b">
                    <TableRow>
                      <TableHead
                        onClick={() => handleSort("formName")}
                        className="cursor-pointer hover:bg-muted/50 transition-colors w-auto"
                      >
                        <div className="flex items-center colunas-lista">
                          Nome do Formulário{" "}
                          <SortIndicator column="formName" type="report" />
                        </div>
                      </TableHead>
                      <TableHead
                        onClick={() => handleSort("submittedAt")}
                        className="cursor-pointer hover:bg-muted/50 transition-colors w-[85px] p-2"
                      >
                        <div className="flex items-center colunas-lista justify-center">
                          Data
                          <SortIndicator column="submittedAt" type="report" />
                        </div>
                      </TableHead>
                      <TableHead className="text-center colunas-lista hidden md:table-cell w-[10%]">
                        Fotos
                      </TableHead>
                      <TableHead className="text-center colunas-lista w-[50px] p-2">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedResults.map((report, index) => (
                      <TableRow
                        key={report.id}
                        className={cn(
                          "transition-colors hover:bg-muted/50",
                          index % 2 !== 0 ? "bg-[#80808021]" : ""
                        )}
                      >
                        <TableCell className="font-medium break-words align-middle">
                          {report.formName}
                        </TableCell>
                        <TableCell className="date-time-cell whitespace-nowrap text-center align-middle text-xs sm:text-sm p-1">
                          {getDateObject(report.submittedAt).toLocaleDateString(
                            "pt-BR",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                            }
                          )}
                          <br />
                          {getDateObject(report.submittedAt).toLocaleTimeString(
                            "pt-BR",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </TableCell>
                        <TableCell className="text-center align-middle hidden md:table-cell">
                          {report.photoUrls && report.photoUrls.length > 0 ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                openImageModal(
                                  report.photoUrls![0],
                                  report.photoUrls!
                                )
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" /> Ver (
                              {report.photoUrls.length})
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center coluna-acao-lista align-middle p-1">
                          <Button
                            asChild
                            size="icon"
                            className="h-8 w-8 bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground mx-auto"
                          >
                            <Link
                              href={`/dashboard/view-report/${searchedOs}/${report.id}?formType=${report.formType}`}
                            >
                              <FileSearch className="h-5 w-5" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </table>
              </div>
            </div>
          </div>
        )}

      {/* Resultados da Busca por Gerente */}
      {activeSearchType === "gerente" &&
        !isLoading &&
        !error &&
        searchedGerenteId &&
        osResultsByGerente.length === 0 && (
          <Card className="shadow-md overflow-hidden">
            <CardHeader>
              <CardTitle>Nenhuma OS Encontrada</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Nenhuma Ordem de Serviço encontrada para o gerente: "
                {firestoreGerentes.find((g) => g.id === searchedGerenteId)
                  ?.nome || searchedGerenteId}
                ".
              </p>
            </CardContent>
          </Card>
        )}

      {activeSearchType === "gerente" &&
        osResultsByGerente.length > 0 &&
        !isLoading &&
        !error && (
          <Card className="shadow-md overflow-hidden container-resultados-lista">
            <CardHeader>
              <CardTitle>
                Ordens de Serviço para Gerente:{" "}
                {firestoreGerentes.find((g) => g.id === searchedGerenteId)
                  ?.nome || searchedGerenteId}
              </CardTitle>
              <CardDescription>
                {osResultsByGerente.length} OS(s) encontrada(s).
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-hidden card-resultados-lista">
              <div className="max-h-[24rem] overflow-y-auto overflow-x-auto relative border border-border rounded-md w-full max-w-full">
                <table className="w-full caption-bottom text-sm table-os">
                  <TableHeader className="sticky top-0 bg-background z-10 [&_tr]:border-b">
                    <TableRow>
                      <TableHead
                        onClick={() => handleSortOs("os")}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center colunas-lista">
                          Ordem de Serviço (OS){" "}
                          <SortIndicator column="os" type="os" />
                        </div>
                      </TableHead>
                      <TableHead
                        onClick={() => handleSortOs("lastReportAt")}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center colunas-lista">
                          Último Relatório em{" "}
                          <SortIndicator column="lastReportAt" type="os" />
                        </div>
                      </TableHead>
                      <TableHead className="text-center colunas-lista">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedOsResultsByGerente.map((osItem, index) => (
                      <TableRow
                        key={osItem.id}
                        className={cn(
                          "transition-colors hover:bg-muted/50",
                          index % 2 !== 0 ? "bg-[#80808021]" : ""
                        )}
                      >
                        <TableCell className="font-medium break-words">
                          {osItem.os}
                        </TableCell>
                        <TableCell className="date-time-cell whitespace-nowrap text-center">
                          {getDateObject(
                            osItem.lastReportAt
                          ).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                          <br />
                          {getDateObject(
                            osItem.lastReportAt
                          ).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="text-center coluna-acao-lista">
                          <Button
                            size="sm"
                            className="bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground whitespace-nowrap"
                            onClick={() => handleViewReportsForOs(osItem.os)}
                          >
                            <FileSearch className="mr-2 h-4 w-4" />
                            Ver Relatórios
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

      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard")}
        className="mt-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
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
