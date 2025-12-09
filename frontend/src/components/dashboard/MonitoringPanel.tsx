"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Users,
  Clock,
  TrendingUp,
  Activity,
  ChevronRight,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const COLORS = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  color: string;
}

function StatCard({ title, value, icon, subtitle, color }: StatCardProps) {
  return (
    <Card
      className="relative overflow-hidden border-l-4 transition-all duration-300 hover:shadow-lg"
      style={{ borderLeftColor: color }}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          {/* Icon - smaller on mobile */}
          <div
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${color}15`, color }}
          >
            {icon}
          </div>
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p
              className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide truncate"
              style={{ color }}
            >
              {title}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
              {value}
            </p>
            {subtitle && (
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MonitoringPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Export monitoring data to Excel - with real forms data
  const exportToExcel = async () => {
    if (!user || !data) return;

    setExporting(true);
    try {
      const XLSX = await import("xlsx");
      const token = await user.getIdToken();

      // Fetch all forms data
      const formsRes = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
        }/api/v1/forms?limit=1000`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const formsJson = await formsRes.json();
      const forms = formsJson.success ? formsJson.data.forms || [] : [];

      const wb = XLSX.utils.book_new();
      const { counts, charts } = data;
      const approvalRate =
        counts.totalForms > 0
          ? Math.round((1 - counts.pendingReviews / counts.totalForms) * 100)
          : 0;

      // Sheet 1: Resumo Executivo
      const summaryData = [
        ["RELATÓRIO DE MONITORAMENTO - METALGALVANO"],
        [""],
        ["Data de Geração:", new Date().toLocaleString("pt-BR")],
        [""],
        ["INDICADORES GERAIS"],
        ["Total de Relatórios", counts.totalForms],
        ["Pendentes de Revisão", counts.pendingReviews],
        ["Aprovados", counts.totalForms - counts.pendingReviews],
        ["Taxa de Aprovação", `${approvalRate}%`],
        [""],
        ["DISTRIBUIÇÃO POR STATUS"],
        ["Status", "Quantidade"],
        ...charts.formsByStatus.map((s: any) => [s.name, s.value]),
        [""],
        ["DISTRIBUIÇÃO POR TIPO"],
        ["Tipo de Formulário", "Quantidade"],
        ...charts.formsByType.map((t: any) => [t.name, t.value]),
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      wsSummary["!cols"] = [{ wch: 35 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo Executivo");

      // Sheet 2: Lista Completa de Relatórios
      const formsData = [
        ["LISTA COMPLETA DE RELATÓRIOS"],
        [""],
        ["Nº OS", "Tipo de Formulário", "Gerente", "Data de Envio", "Status"],
        ...forms.map((f: any) => [
          f.osNumber || "—",
          f.formType || "—",
          f.userId || f.submittedBy || "—",
          f.submittedAt ? new Date(f.submittedAt).toLocaleString("pt-BR") : "—",
          f.status || "DRAFT",
        ]),
      ];
      const wsForms = XLSX.utils.aoa_to_sheet(formsData);
      wsForms["!cols"] = [
        { wch: 12 },
        { wch: 35 },
        { wch: 20 },
        { wch: 20 },
        { wch: 12 },
      ];
      XLSX.utils.book_append_sheet(wb, wsForms, "Todos os Relatórios");

      // Sheet 3: Relatórios por Obra (OS)
      const formsByOS: Record<string, any[]> = {};
      forms.forEach((f: any) => {
        const os = f.osNumber || "Sem OS";
        if (!formsByOS[os]) formsByOS[os] = [];
        formsByOS[os].push(f);
      });

      const osSummary = [
        ["RELATÓRIOS AGRUPADOS POR OBRA"],
        [""],
        ["Nº OS", "Qtd. Relatórios", "Tipos de Formulário"],
        ...Object.entries(formsByOS).map(([os, osForms]) => [
          os,
          osForms.length,
          [...new Set(osForms.map((f: any) => f.formType))].join(", "),
        ]),
      ];
      const wsOS = XLSX.utils.aoa_to_sheet(osSummary);
      wsOS["!cols"] = [{ wch: 12 }, { wch: 15 }, { wch: 50 }];
      XLSX.utils.book_append_sheet(wb, wsOS, "Por Obra");

      // Sheet 4: Performance por Gerente
      const formsByManager: Record<string, any[]> = {};
      forms.forEach((f: any) => {
        const manager = f.userId || f.submittedBy || "Desconhecido";
        if (!formsByManager[manager]) formsByManager[manager] = [];
        formsByManager[manager].push(f);
      });

      const managerData = [
        ["PERFORMANCE POR GERENTE"],
        [""],
        ["Gerente", "Relatórios Enviados", "Aprovados", "Pendentes"],
        ...Object.entries(formsByManager).map(([manager, mForms]) => {
          const approved = mForms.filter(
            (f: any) => f.status === "SUBMITTED" || f.status === "APPROVED"
          ).length;
          const pending = mForms.filter(
            (f: any) => f.status === "DRAFT" || f.status === "PENDING"
          ).length;
          return [manager, mForms.length, approved, pending];
        }),
      ];
      const wsManager = XLSX.utils.aoa_to_sheet(managerData);
      wsManager["!cols"] = [{ wch: 25 }, { wch: 18 }, { wch: 12 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, wsManager, "Por Gerente");

      // Sheet 5: Histórico Mensal
      const monthData = [
        ["HISTÓRICO MENSAL DE ENVIOS"],
        [""],
        ["Mês/Ano", "Quantidade"],
        ...charts.formsByMonth.map((m: any) => [m.name, m.value]),
      ];
      const wsMonth = XLSX.utils.aoa_to_sheet(monthData);
      wsMonth["!cols"] = [{ wch: 15 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, wsMonth, "Histórico Mensal");

      // Generate and download
      const fileName = `relatorio_monitoramento_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Relatório exportado!",
        description: `${forms.length} registros exportados para ${fileName}`,
      });
    } catch (error: any) {
      console.error("Erro ao exportar Excel:", error);
      toast({
        title: "Erro ao exportar",
        description: error.message || "Falha ao gerar arquivo Excel",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
          }/api/v1/stats/dashboard`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">
          Carregando dados...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive">
        Erro ao carregar dados.
      </div>
    );
  }

  const { counts, charts } = data;
  const approvalRate =
    counts.totalForms > 0
      ? Math.round((1 - counts.pendingReviews / counts.totalForms) * 100)
      : 0;

  return (
    <div className="min-h-screen">
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/30" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm-30 30v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative space-y-3 sm:space-y-4 animate-fade-in-up">
        {/* Header - Compact on mobile */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-border/50 p-4 sm:p-6">
          <div className="absolute top-0 right-0 w-32 sm:w-64 h-32 sm:h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Activity className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground mb-0.5">
                  <span>Dashboard</span>
                  <ChevronRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span className="text-primary font-medium">
                    Monitoramento
                  </span>
                </div>
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight">
                  Painel de Monitoramento
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block">
                  Acompanhe métricas e relatórios em tempo real
                </p>
              </div>
            </div>

            {/* Export Button */}
            <Button
              onClick={exportToExcel}
              disabled={exporting || !data}
              className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              size="sm"
            >
              {exporting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="hidden sm:inline">Exportando...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="hidden sm:inline">Exportar Excel</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* KPI Cards - 2x2 grid on mobile */}
        <div className="grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Formulários"
            value={counts.totalForms}
            icon={<FileText className="h-4 w-4 sm:h-5 sm:w-5" />}
            subtitle="Registrados no sistema"
            color="#0ea5e9"
          />
          <StatCard
            title="Pendentes"
            value={counts.pendingReviews}
            icon={<Clock className="h-4 w-4 sm:h-5 sm:w-5" />}
            subtitle="Aguardando revisão"
            color="#f59e0b"
          />
          {counts.totalUsers !== null && (
            <StatCard
              title="Usuários"
              value={counts.totalUsers}
              icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />}
              subtitle="Cadastrados"
              color="#8b5cf6"
            />
          )}
          <StatCard
            title="Aprovação"
            value={`${approvalRate}%`}
            icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />}
            subtitle="Taxa"
            color="#22c55e"
          />
        </div>

        {/* Charts - Stack on mobile */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-3">
          {/* Area Chart */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="py-2 px-3 sm:py-3 sm:px-4 border-b border-border/50">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary animate-pulse" />
                Formulários por Mês
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-4">
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={charts.formsByMonth}>
                  <defs>
                    <linearGradient id="colorForms" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    width={25}
                  />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#0ea5e9"
                    fill="url(#colorForms)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card className="shadow-sm">
            <CardHeader className="py-2 px-3 sm:py-3 sm:px-4 border-b border-border/50">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-500 animate-pulse" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-4">
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={charts.formsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {charts.formsByStatus.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 9 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Bar Chart */}
        <Card className="shadow-sm">
          <CardHeader className="py-2 px-3 sm:py-3 sm:px-4 border-b border-border/50">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500 animate-pulse" />
              Tipos de Formulários
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            <ResponsiveContainer width="100%" height={100}>
              <BarChart
                data={charts.formsByType}
                layout="vertical"
                margin={{ left: 80 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={75}
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar
                  dataKey="value"
                  fill="#22c55e"
                  radius={[0, 4, 4, 0]}
                  barSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
