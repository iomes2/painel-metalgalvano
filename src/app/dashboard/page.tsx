
"use client";
import { useAuth } from '@/components/auth/AuthInitializer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formDefinitions } from "@/config/forms";
import { ArrowRight, FileText } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    // This should ideally be handled by AuthInitializer redirecting,
    // but as a fallback or if content depends on user.
    return null; 
  }

  const userName = user.displayName || user.email?.split('@')[0] || "Gerente";

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Bem-vindo(a), {userName}!</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Selecione um formulário na barra lateral ou na lista abaixo para começar.
            Você pode preencher, gerar PDFs e salvar seus relatórios de processo de construção.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Este painel permite gerenciar diversos formulários relacionados aos processos de construção da Metalgalvano. Certifique-se de que todos os dados inseridos sejam precisos e completos.</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {formDefinitions.map((form) => {
          const IconComponent = form.icon || FileText;
          return (
            <Card key={form.id} className="flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <IconComponent className="h-8 w-8 text-primary" />
                  <CardTitle className="text-xl">{form.name}</CardTitle>
                </div>
                <CardDescription>{form.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                {/* You can add more details here if needed */}
              </CardContent>
              <CardContent>
                 <Button asChild className="w-full bg-primary hover:bg-primary/90">
                  <Link href={`/dashboard/forms/${form.id}`} className="flex items-center justify-center">
                    Abrir Formulário <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
