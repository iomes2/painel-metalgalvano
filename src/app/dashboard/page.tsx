
"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthInitializer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from 'next/navigation';
import { formDefinitions } from "@/config/forms";
import { ArrowRight, FileText } from "lucide-react";
import { getFormIcon } from '@/components/icons/icon-resolver';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [selectedFormDefinition, setSelectedFormDefinition] = useState<(typeof formDefinitions[0]) | null>(null);

  useEffect(() => {
    if (selectedFormId) {
      const definition = formDefinitions.find(form => form.id === selectedFormId);
      setSelectedFormDefinition(definition || null);
    } else {
      setSelectedFormDefinition(null);
    }
  }, [selectedFormId]);

  if (!user) {
    return null;
  }

  const userName = user.displayName || user.email?.split('@')[0]?.split('.')[0] || "Gerente";

  const handleOpenForm = () => {
    if (selectedFormId) {
      router.push(`/dashboard/forms/${selectedFormId}`);
    }
  };

  const IconComponent = selectedFormDefinition ? getFormIcon(selectedFormDefinition.iconName) : FileText;

  return (
    <div className="space-y-8 p-4">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Bem-vindo(a), {userName}!</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Selecione um formulário abaixo para começar.
          </CardDescription>
        </CardHeader>
        {/* <CardContent>
          <p>Este painel permite gerenciar diversos formulários relacionados aos processos de construção da Metalgalvano. Certifique-se de que todos os dados inseridos sejam precisos e completos.</p>
        </CardContent> */}
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Selecionar Formulário</CardTitle>
          <CardDescription>Escolha o tipo de relatório que deseja preencher.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Select onValueChange={setSelectedFormId} value={selectedFormId || undefined}>
              <SelectTrigger className="w-full py-3 text-base md:text-sm teste3">
                <div className="flex items-center gap-2">
                  {/* <IconComponent className={`h-5 w-5 ${selectedFormId ? 'text-primary' : 'text-muted-foreground'}`} /> */}
                  <SelectValue placeholder="Clique e escolha um formulário..." className='btn-form '/>
                </div>
              </SelectTrigger>
              <SelectContent>
                {formDefinitions.map((form) => {
                  const CurrentFormIcon = getFormIcon(form.iconName);
                  return (
                    <SelectItem key={form.id} value={form.id} className="py-2">
                      <div className="flex items-center gap-2">
                        <CurrentFormIcon className="h-5 w-5 text-primary" />
                        <span>{form.name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          {/* {selectedFormDefinition && (
            <div className="p-4 border rounded-md bg-muted/20">
              <div className="flex items-center gap-3 mb-2">
                <IconComponent className="h-7 w-7 text-primary" />
                <h3 className="text-lg font-semibold">{selectedFormDefinition.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{selectedFormDefinition.description}</p>
            </div>
          )} */}
          <Button 
            onClick={handleOpenForm} 
            disabled={!selectedFormId} 
            className="w-full py-3 text-base md:text-sm bg-primary hover:bg-primary/90"
          >
            Abrir Formulário Selecionado
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
