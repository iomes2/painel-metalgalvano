
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Edit3, Save, ListChecks } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

// Esquema Zod para os campos básicos da definição do formulário
const formDefinitionSchema = z.object({
  formId: z.string().min(3, "ID do Formulário deve ter pelo menos 3 caracteres.").regex(/^[a-z0-9-]+$/, "ID do Formulário deve conter apenas letras minúsculas, números e hífens."),
  formName: z.string().min(5, "Nome do Formulário é obrigatório."),
  formDescription: z.string().min(10, "Descrição é obrigatória."),
  iconName: z.string().optional().describe("Nome do ícone Lucide (ex: ClipboardList)"),
});

type FormDefinitionValues = z.infer<typeof formDefinitionSchema>;

export default function FormBuilderPage() {
  const { toast } = useToast();

  const form = useForm<FormDefinitionValues>({
    resolver: zodResolver(formDefinitionSchema),
    defaultValues: {
      formId: "",
      formName: "",
      formDescription: "",
      iconName: "",
    },
  });

  const onSubmit: SubmitHandler<FormDefinitionValues> = (data) => {
    console.log("Dados da Definição do Formulário (Protótipo):", data);
    toast({
      title: "Definição de Formulário (Protótipo)",
      description: "Os dados foram registrados no console. A lógica de salvamento no banco de dados e adição de campos dinâmicos ainda precisa ser implementada.",
      duration: 5000,
    });
    // No futuro, aqui você enviaria 'data' para o Firebase Firestore
    // e depois limparia o formulário ou redirecionaria.
    // form.reset(); // Exemplo de como limpar o formulário
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-2">
            <ListChecks className="h-8 w-8" />
            Construtor de Formulários
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Defina as propriedades básicas de um novo formulário. A adição de campos e lógica de encadeamento será implementada futuramente.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="formId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID do Formulário</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: meu-novo-formulario" {...field} />
                    </FormControl>
                    <FormDescription>Identificador único para o formulário (letras minúsculas, números, hífens).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="formName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Formulário</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Relatório de Despesas Mensais" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="formDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição Curta</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descreva o propósito deste formulário." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="iconName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Ícone (Lucide)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: ClipboardList, Wrench (opcional)" {...field} />
                    </FormControl>
                    <FormDescription>Consulte a biblioteca Lucide Icons para nomes válidos.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-between items-center">
              <Button type="submit">
                <Save className="mr-2" />
                Salvar Definição (Protótipo)
              </Button>
              <div className="flex gap-2">
                 <Button variant="outline" disabled>
                    <PlusCircle className="mr-2" />
                    Adicionar Campo (Futuro)
                </Button>
                <Button variant="outline" disabled>
                    <Edit3 className="mr-2" />
                    Configurar Lógica (Futuro)
                </Button>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Próximos Passos para Implementação Completa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. Implementar salvamento das definições básicas de formulário no Firebase Firestore.</p>
          <p>2. Desenvolver a interface do usuário (UI/UX) para adicionar, editar e reordenar campos dinamicamente (FormField).</p>
          <p>3. Desenvolver a interface para configurar opções de campos (ex: para 'select') e validações.</p>
          <p>4. Desenvolver a interface para configurar gatilhos de formulários vinculados (LinkedFormTriggerCondition).</p>
          <p>5. Modificar o `DynamicFormRenderer` e a página de dashboard para carregar definições de formulários do Firestore.</p>
          <p>6. Implementar um sistema de papéis (Admin/Gerente) para controle de acesso ao construtor.</p>
          <p>7. Permitir a edição e exclusão de definições de formulários existentes.</p>
        </CardContent>
      </Card>
    </div>
  );
}
