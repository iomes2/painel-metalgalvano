import { DynamicFormRenderer } from "@/components/forms/DynamicFormRenderer";
import { getFormDefinition } from "@/config/forms";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";

interface FormPageProps {
  params: Promise<{
    formType: string;
  }>;
}

export default async function FormPage({ params }: FormPageProps) {
  const { formType } = await params;
  const formDefinition = getFormDefinition(formType);

  if (!formDefinition) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto my-8">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Erro: Formulário Não Encontrado</AlertTitle>
        <AlertDescription>
          O tipo de formulário "{formType}" não pôde ser encontrado. Por favor,
          verifique o URL ou selecione um formulário válido.
          <Button asChild variant="link" className="mt-2 p-0 h-auto">
            <Link href="/dashboard">Voltar para o Painel</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full max-w-full py-6">
      <DynamicFormRenderer formDefinition={formDefinition} />
    </div>
  );
}

// Optional: Generate static params for better performance if form types are fixed
export async function generateStaticParams() {
  const { formDefinitions } = await import("@/config/forms");
  return formDefinitions.map((form) => ({
    formType: form.id,
  }));
}

// Optional: Add metadata for each form page
export async function generateMetadata({ params }: FormPageProps) {
  const { formType } = await params;
  const formDefinition = getFormDefinition(formType);
  return {
    title: formDefinition
      ? `${formDefinition.name} - Metalgalvano Formulários`
      : "Formulário Não Encontrado",
  };
}
