"use client";

import type {
  FormDefinition,
  FormField as FormFieldType,
  FormFieldOption,
  LinkedFormTriggerCondition,
  CarryOverParam,
} from "@/config/forms";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Info, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getFormIcon } from "@/components/icons/icon-resolver";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { auth, storage, db } from "@/lib/firebase"; // db importado
import { Timestamp } from "firebase/firestore";
import { uploadFiles, submitRelatorio } from "@/lib/api-client";
import { DynamicField } from "./DynamicField";

interface DynamicFormRendererProps {
  formDefinition: FormDefinition;
  initialValues?: Record<string, any>;
  onSubmit?: (payload: any) => Promise<void>;
}

// Helper to build Zod schema from form definition
const buildZodSchema = (fields: FormFieldType[]) => {
  const schemaShape: Record<string, z.ZodTypeAny> = {};
  fields.forEach((field) => {
    let fieldSchema: z.ZodTypeAny;

    switch (field.type) {
      case "text":
      case "textarea":
        fieldSchema = z.string();
        if (field.required)
          fieldSchema = (fieldSchema as z.ZodString).min(
            1,
            `${field.label} é obrigatório(a).`
          );
        else fieldSchema = fieldSchema.optional().or(z.literal(""));
        break;
      case "email":
        fieldSchema = z
          .string()
          .email(`Formato de e-mail inválido para ${field.label}.`);
        if (field.required)
          fieldSchema = (fieldSchema as z.ZodString).min(
            1,
            `${field.label} é obrigatório(a).`
          );
        else fieldSchema = fieldSchema.optional().or(z.literal(""));
        break;
      case "number":
        fieldSchema = z.coerce.number();
        if (field.required)
          fieldSchema = (fieldSchema as z.ZodNumber).min(
            0.00001,
            `${field.label} é obrigatório(a) e deve ser diferente de zero, se aplicável.`
          );
        else fieldSchema = fieldSchema.optional().nullable();
        break;
      case "date":
        fieldSchema = z.coerce.date({
          required_error: `${field.label} é obrigatório(a).`,
          invalid_type_error: `Esta não é uma data válida para ${field.label}!`,
        });
        if (!field.required) fieldSchema = fieldSchema.optional().nullable();
        break;
      case "checkbox":
        fieldSchema = z
          .boolean()
          .default((field.defaultValue as boolean) || false);
        break;
      case "select":
        fieldSchema = z.string();
        if (field.required)
          fieldSchema = (fieldSchema as z.ZodString).min(
            1,
            `Por favor, selecione uma opção para ${field.label}.`
          );
        else fieldSchema = fieldSchema.optional().or(z.literal(""));
        break;
      case "file":
        fieldSchema = z.any().optional().nullable(); // FileList or null/undefined
        break;
      default:
        fieldSchema = z.any();
    }
    schemaShape[field.id] = fieldSchema;
  });
  return z.object(schemaShape);
};

export function DynamicFormRenderer({
  formDefinition,
  initialValues,
  onSubmit,
}: DynamicFormRendererProps) {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [mainOriginatingFormId, setMainOriginatingFormId] = useState<
    string | null
  >(null);
  const [carryOverQueryParams, setCarryOverQueryParams] = useState<
    Record<string, string>
  >({});

  const formSchema = buildZodSchema(formDefinition.fields);
  type FormValues = z.infer<typeof formSchema>;

  const defaultValues = formDefinition.fields.reduce((acc, field) => {
    acc[field.id] =
      field.defaultValue !== undefined
        ? field.defaultValue
        : field.type === "checkbox"
        ? false
        : field.type === "number"
        ? null
        : field.type === "file"
        ? null
        : "";
    return acc;
  }, {} as Record<string, any>);

  // Helper to normalize values (especially dates/timestamps)
  const prepareInitialValues = (values: Record<string, any> | undefined) => {
    if (!values) return {};
    const normalized = { ...values };

    Object.keys(normalized).forEach((key) => {
      const val = normalized[key];
      // Check if it looks like a Firebase Timestamp (seconds/nanoseconds) or similar object
      if (val && typeof val === "object") {
        if ("seconds" in val && typeof val.seconds === "number") {
          normalized[key] = new Date(val.seconds * 1000);
        } else if ("_seconds" in val && typeof val._seconds === "number") {
          normalized[key] = new Date(val._seconds * 1000);
        } else if (typeof val.toDate === "function") {
          normalized[key] = val.toDate();
        }
      }
    });
    return normalized;
  };

  const combinedDefaultValues = {
    ...defaultValues,
    ...prepareInitialValues(initialValues),
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: combinedDefaultValues as any,
  });

  const { watch, setValue, reset, getValues, control } = form;

  useEffect(() => {
    if (initialValues) {
      const normalizedValues = prepareInitialValues(initialValues);
      reset({ ...defaultValues, ...normalizedValues } as any);
    }
  }, [initialValues, reset]);

  // Watch specific fields for conditional rendering & logic
  const situacaoEtapaDia = watch("situacaoEtapaDia" as any);
  const fotosEtapaDia = watch("fotosEtapaDia" as any);
  const horasRetrabalhoParadasDia = watch("horasRetrabalhoParadasDia" as any);
  const horarioEfetivoInicioAtividades = watch(
    "horarioEfetivoInicioAtividades" as any
  );
  const horarioInicioJornadaPrevisto = watch(
    "horarioInicioJornadaPrevisto" as any
  );
  const horarioEfetivoSaidaObra = watch("horarioEfetivoSaidaObra" as any);
  const horarioTerminoJornadaPrevisto = watch(
    "horarioTerminoJornadaPrevisto" as any
  );
  const fotosNaoConformidade = watch("fotosNaoConformidade" as any);
  const fotosInspecao = watch("fotosInspecao" as any); // For new inspection form
  const conformidadeSeguranca = watch("conformidadeSeguranca" as any); // For inspection form to trigger RNC

  const stableSetValue = useCallback(setValue, []);
  const stableGetValues = useCallback(getValues, []);

  useEffect(() => {
    const osFromQuery = searchParams.get("os");
    const originatingIdFromQuery = searchParams.get("originatingFormId");

    const tempCarryOverParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key !== "os" && key !== "originatingFormId") {
        tempCarryOverParams[key] = value;
      }
    });
    setCarryOverQueryParams(tempCarryOverParams);

    if (originatingIdFromQuery) {
      setMainOriginatingFormId(originatingIdFromQuery);
    }

    const formOsField = formDefinition.fields.find(
      (f) => f.id === "ordemServico"
    );
    if (formOsField && osFromQuery) {
      if (stableGetValues("ordemServico" as any) !== osFromQuery) {
        stableSetValue("ordemServico" as any, osFromQuery, {
          shouldValidate: true,
        });
      }
    }
  }, [
    formDefinition.id,
    formDefinition.fields,
    searchParams,
    stableSetValue,
    stableGetValues,
  ]);

  useEffect(() => {
    runFieldVisibilitySideEffects({
      formDefinition,
      stableGetValues,
      stableSetValue,
      watchedValues: {
        situacaoEtapaDia,
        fotosEtapaDia,
        horasRetrabalhoParadasDia,
        horarioEfetivoInicioAtividades,
        horarioInicioJornadaPrevisto,
        horarioEfetivoSaidaObra,
        horarioTerminoJornadaPrevisto,
        fotosNaoConformidade,
        fotosInspecao,
        conformidadeSeguranca,
      },
    });
  }, [
    formDefinition,
    stableGetValues,
    stableSetValue,
    situacaoEtapaDia,
    fotosEtapaDia,
    horasRetrabalhoParadasDia,
    horarioEfetivoInicioAtividades,
    horarioInicioJornadaPrevisto,
    horarioEfetivoSaidaObra,
    horarioTerminoJornadaPrevisto,
    fotosNaoConformidade,
    fotosInspecao,
    conformidadeSeguranca,
  ]);

  const handleLocalSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true);
    const currentUser = auth.currentUser;

    if (!currentUser) {
      toast({
        title: "Erro de Autenticação",
        description: "Você precisa estar logado para enviar formulários.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const submissionTimestamp = Date.now();
    const osValue = (data as Record<string, any>).ordemServico as
      | string
      | undefined;

    try {
      // 1. Upload de arquivos via API
      const finalFormDataToSave = { ...data } as Record<string, any>;

      for (const field of formDefinition.fields) {
        if (
          field.type === "file" &&
          data[field.id as keyof FormValues] instanceof FileList
        ) {
          const fileList = data[field.id as keyof FormValues] as FileList;

          if (fileList.length > 0) {
            toast({
              title: "Enviando arquivos...",
              description: `Por favor, aguarde. ${fileList.length} arquivo(s) sendo processado(s).`,
            });

            const uploadedPhotos = await uploadFiles(
              fileList,
              currentUser.uid,
              formDefinition.id,
              osValue || "general",
              submissionTimestamp
            );

            finalFormDataToSave[field.id] = uploadedPhotos;
          } else {
            delete finalFormDataToSave[field.id];
          }
        } else if (field.type === "file") {
          delete finalFormDataToSave[field.id];
        }
      }

      // 2. Converter Dates para Timestamps
      const formDataWithTimestamps = { ...finalFormDataToSave };
      formDefinition.fields.forEach((field) => {
        if (
          field.type === "date" &&
          formDataWithTimestamps[field.id] instanceof Date
        ) {
          formDataWithTimestamps[field.id] = Timestamp.fromDate(
            formDataWithTimestamps[field.id] as Date
          );
        }
      });

      // 3. Submeter relatório via API
      const payload = {
        formType: formDefinition.id,
        formName: formDefinition.name,
        formData: formDataWithTimestamps,
        submittedBy: currentUser.uid,
        submittedAt: submissionTimestamp,
        gerenteId: currentUser.email?.split("@")[0] || "desconhecido",
        ...(mainOriginatingFormId &&
          formDefinition.id !== "cronograma-diario-obra" && {
            originatingFormId: mainOriginatingFormId,
          }),
        ...(osValue && { osNumber: osValue.trim() }),
      };

      // Se onSubmit personalizado foi fornecido, o componente pai (edit) lida com isso
      if (onSubmit) {
        await onSubmit(payload);
        toast({
          title: "Sucesso!",
          description: `Formulário "${formDefinition.name}" atualizado com sucesso!`,
        });
        reset(defaultValues);
        setIsShareDialogOpen(true);
        setIsSubmitting(false);
        return;
      }

      const result = await submitRelatorio(payload);

      if (result.reportId) {
        setSubmittedReportId(result.reportId);
      }

      toast({
        title: "Sucesso!",
        description: osValue
          ? `Formulário "${
              formDefinition.name
            }" para OS "${osValue.trim()}" salvo com arquivos enviados!`
          : `Formulário "${formDefinition.name}" salvo com sucesso e arquivos enviados!`,
      });

      const currentFormIsMainOriginator =
        formDefinition.id === "cronograma-diario-obra";
      const nextMainOriginatingFormId = currentFormIsMainOriginator
        ? result.reportId
        : mainOriginatingFormId;

      reset(defaultValues); // Reset form fields for current form

      const handled = handleLinkedFormTriggers(
        formDefinition,
        data,
        result,
        carryOverQueryParams,
        osValue,
        mainOriginatingFormId,
        currentFormIsMainOriginator,
        nextMainOriginatingFormId,
        router,
        setIsShareDialogOpen,
        toast
      );
      if (handled) return;
    } catch (error) {
      console.error(
        "Erro durante o envio do formulário ou upload de arquivos:",
        error
      );
      toast({
        title: "Erro ao Salvar",
        description:
          "Não foi possível salvar o formulário ou enviar os arquivos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const IconComponent = getFormIcon(formDefinition.iconName);

  const [submittedReportId, setSubmittedReportId] = useState<string | null>(
    null
  );

  const handleDownloadPdf = async () => {
    if (!submittedReportId) return;

    try {
      toast({
        title: "Gerando PDF...",
        description: "O download iniciará em instantes.",
      });

      const { downloadFormPdf } = await import("@/lib/api-client");
      const blob = await downloadFormPdf(submittedReportId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-${formDefinition.id}-${submittedReportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "PDF baixado",
        description: "O arquivo foi salvo no seu dispositivo.",
      });

      // Fechar modal e redirecionar após download
      handleShareDialogCancel();
    } catch (err: any) {
      console.error("Erro ao baixar PDF:", err);
      toast({
        title: "Erro ao baixar PDF",
        description: err.message || "Falha ao gerar o arquivo.",
        variant: "destructive",
      });
    }
  };

  const handleShareDialogAction = () => {
    handleDownloadPdf();
  };

  const handleShareDialogCancel = () => {
    setIsShareDialogOpen(false);
    setMainOriginatingFormId(null);
    setCarryOverQueryParams({});
    setSubmittedReportId(null);
    router.push("/dashboard");
  };

  return (
    <>
      <Card className="w-full shadow-xl overflow-hidden">
        <CardHeader className="overflow-hidden pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <IconComponent className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
              <CardTitle className="text-lg sm:text-2xl leading-tight break-words">
                {formDefinition.name}
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex-shrink-0 -mt-1"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Voltar
            </Button>
          </div>
          <CardDescription className="mt-1">
            {formDefinition.description}
          </CardDescription>
          {mainOriginatingFormId && (
            <div className="mt-2 p-2 bg-accent/10 border border-accent/30 rounded-md text-sm text-accent-foreground/80 flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span>
                Este formulário faz parte de uma sequência iniciada pelo
                Relatório ID: {mainOriginatingFormId}.
              </span>
            </div>
          )}
          {Object.keys(carryOverQueryParams).length > 0 && (
            <div className="mt-1 p-2 bg-muted/50 border border-border rounded-md text-xs text-muted-foreground">
              <p className="font-medium mb-1">
                Dados recebidos do formulário anterior:
              </p>
              <ul className="list-disc list-inside pl-2">
                {Object.entries(carryOverQueryParams).map(([key, value]) => (
                  <li key={key}>
                    <strong>{key}:</strong> {String(value)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleLocalSubmit)}>
            <CardContent className="space-y-6">
              {formDefinition.fields.map((field) => {
                const shouldRenderField = shouldRenderFormItem(
                  formDefinition,
                  field,
                  {
                    situacaoEtapaDia,
                    fotosEtapaDia,
                    horasRetrabalhoParadasDia,
                    horarioEfetivoInicioAtividades,
                    horarioInicioJornadaPrevisto,
                    horarioEfetivoSaidaObra,
                    horarioTerminoJornadaPrevisto,
                    fotosNaoConformidade,
                    fotosInspecao,
                    conformidadeSeguranca,
                  }
                );

                if (!shouldRenderField) return null;

                return (
                  <DynamicField
                    key={field.id}
                    field={field}
                    control={control}
                    isSubmitting={isSubmitting}
                  />
                );
              })}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t">
              <Button
                type="submit"
                className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Enviando..." : "Enviar Formulário"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <AlertDialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Formulário Enviado com Sucesso!</AlertDialogTitle>
            <AlertDialogDescription>
              Seu formulário "{formDefinition.name}" foi salvo. Deseja baixar o
              PDF gerado agora?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleShareDialogCancel}>
              Não, Voltar ao Início
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleShareDialogAction}>
              Sim, Baixar PDF
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function runFieldVisibilitySideEffects({
  formDefinition,
  stableGetValues,
  stableSetValue,
  watchedValues,
}: {
  formDefinition: FormDefinition;
  stableGetValues: any;
  stableSetValue: any;
  watchedValues: any;
}) {
  const {
    situacaoEtapaDia,
    fotosEtapaDia,
    horasRetrabalhoParadasDia,
    horarioEfetivoInicioAtividades,
    horarioInicioJornadaPrevisto,
    horarioEfetivoSaidaObra,
    horarioTerminoJornadaPrevisto,
    fotosNaoConformidade,
    fotosInspecao,
    conformidadeSeguranca,
  } = watchedValues;

  if (formDefinition.id === "cronograma-diario-obra") {
    if (
      situacaoEtapaDia !== "em_atraso" &&
      stableGetValues("motivoAtrasoDia") !== ""
    ) {
      stableSetValue("motivoAtrasoDia", "", { shouldValidate: false });
    }
    if (
      fotosEtapaDia !== "sim" &&
      stableGetValues("uploadFotosEtapaDia") !== null
    ) {
      stableSetValue("uploadFotosEtapaDia", null, {
        shouldValidate: false,
      });
    }
    if (
      (!horasRetrabalhoParadasDia ||
        String(horasRetrabalhoParadasDia).trim() === "") &&
      stableGetValues("motivoRetrabalhoParadaDia") !== ""
    ) {
      stableSetValue("motivoRetrabalhoParadaDia", "", {
        shouldValidate: false,
      });
    }
    const efetivoInicio = String(horarioEfetivoInicioAtividades || "").trim();
    const previstoInicio = String(horarioInicioJornadaPrevisto || "").trim();
    if (
      (efetivoInicio === "" || efetivoInicio === previstoInicio) &&
      stableGetValues("motivoNaoCumprimentoHorarioInicio") !== ""
    ) {
      stableSetValue("motivoNaoCumprimentoHorarioInicio", "", {
        shouldValidate: false,
      });
    }
    const efetivoSaida = String(horarioEfetivoSaidaObra || "").trim();
    const previstoSaida = String(horarioTerminoJornadaPrevisto || "").trim();
    if (
      (efetivoSaida === "" || efetivoSaida === previstoSaida) &&
      stableGetValues("motivoNaoCumprimentoHorarioSaida") !== ""
    ) {
      stableSetValue("motivoNaoCumprimentoHorarioSaida", "", {
        shouldValidate: false,
      });
    }
  } else if (formDefinition.id === "rnc-report") {
    if (
      fotosNaoConformidade !== "sim" &&
      stableGetValues("uploadFotosNaoConformidade") !== null
    ) {
      stableSetValue("uploadFotosNaoConformidade", null, {
        shouldValidate: false,
      });
    }
  } else if (formDefinition.id === "relatorio-inspecao-site") {
    if (
      fotosInspecao !== "sim" &&
      stableGetValues("uploadFotosInspecao") !== null
    ) {
      stableSetValue("uploadFotosInspecao", null, {
        shouldValidate: false,
      });
    }
    if (
      conformidadeSeguranca === "sim" &&
      (stableGetValues("itensNaoConformes") !== "" ||
        stableGetValues("acoesCorretivasSugeridas") !== "")
    ) {
      stableSetValue("itensNaoConformes", "", {
        shouldValidate: false,
      });
      stableSetValue("acoesCorretivasSugeridas", "", {
        shouldValidate: false,
      });
    }
  }
}

function shouldRenderFormItem(
  formDefinition: FormDefinition,
  field: FormFieldType,
  watchedValues: any
): boolean {
  const {
    situacaoEtapaDia,
    fotosEtapaDia,
    horasRetrabalhoParadasDia,
    horarioEfetivoInicioAtividades,
    horarioInicioJornadaPrevisto,
    horarioEfetivoSaidaObra,
    horarioTerminoJornadaPrevisto,
    fotosNaoConformidade,
    fotosInspecao,
    conformidadeSeguranca,
  } = watchedValues;

  if (formDefinition.id === "cronograma-diario-obra") {
    if (field.id === "motivoAtrasoDia") return situacaoEtapaDia === "em_atraso";
    if (field.id === "uploadFotosEtapaDia") return fotosEtapaDia === "sim";
    if (field.id === "motivoRetrabalhoParadaDia")
      return (
        !!horasRetrabalhoParadasDia &&
        String(horasRetrabalhoParadasDia).trim() !== ""
      );
    if (field.id === "motivoNaoCumprimentoHorarioInicio") {
      const efetivo = String(horarioEfetivoInicioAtividades || "").trim();
      const previsto = String(horarioInicioJornadaPrevisto || "").trim();
      return efetivo !== "" && efetivo !== previsto;
    }
    if (field.id === "motivoNaoCumprimentoHorarioSaida") {
      const efetivo = String(horarioEfetivoSaidaObra || "").trim();
      const previsto = String(horarioTerminoJornadaPrevisto || "").trim();
      return efetivo !== "" && efetivo !== previsto;
    }
  } else if (formDefinition.id === "rnc-report") {
    if (field.id === "uploadFotosNaoConformidade")
      return fotosNaoConformidade === "sim";
  } else if (formDefinition.id === "relatorio-inspecao-site") {
    if (field.id === "uploadFotosInspecao") return fotosInspecao === "sim";
    if (
      field.id === "itensNaoConformes" ||
      field.id === "acoesCorretivasSugeridas"
    ) {
      return conformidadeSeguranca === "nao";
    }
  }
  return true;
}

function handleLinkedFormTriggers(
  formDefinition: FormDefinition,
  data: any,
  result: any,
  carryOverQueryParams: any,
  osValue: string | undefined,
  mainOriginatingFormId: string | null,
  currentFormIsMainOriginator: boolean,
  nextMainOriginatingFormId: string | null,
  router: any,
  setIsShareDialogOpen: (v: boolean) => void,
  toast: any
) {
  const triggers = formDefinition.linkedFormTriggers;
  if (triggers && result.reportId) {
    for (const trigger of triggers) {
      let conditionMet = false;

      if (
        formDefinition.id === "relatorio-inspecao-site" &&
        trigger.linkedFormId === "rnc-report"
      ) {
        const rncTriggerFromAcompanhamento =
          carryOverQueryParams["rncTriggerValueFromAcompanhamento"];
        const currentConformidade = (data as any)["conformidadeSeguranca"];
        if (
          currentConformidade === "nao" &&
          rncTriggerFromAcompanhamento === "sim"
        ) {
          conditionMet = true;
        }
      } else {
        if (trigger.triggerFieldId.startsWith("_queryParam_")) {
          const paramName = trigger.triggerFieldId.substring(
            "_queryParam_".length
          );
          conditionMet =
            carryOverQueryParams[paramName] === trigger.triggerFieldValue;
        } else {
          conditionMet =
            (data as any)[trigger.triggerFieldId] === trigger.triggerFieldValue;
        }
      }

      if (conditionMet) {
        const nextQueryParams = new URLSearchParams();
        const osToPass =
          trigger.passOsFieldId && (data as any)[trigger.passOsFieldId]
            ? String((data as any)[trigger.passOsFieldId]).trim()
            : osValue?.trim();

        if (osToPass) {
          nextQueryParams.append("os", osToPass);
        }

        if (nextMainOriginatingFormId) {
          nextQueryParams.append(
            "originatingFormId",
            nextMainOriginatingFormId
          );
        }

        trigger.carryOverParams?.forEach((cop) => {
          if ((data as any)[cop.fieldIdFromCurrentForm] !== undefined) {
            nextQueryParams.append(
              cop.queryParamName,
              String((data as any)[cop.fieldIdFromCurrentForm])
            );
          }
        });

        toast({
          title: "Próximo Passo",
          description: `Por favor, preencha o formulário: ${trigger.linkedFormId}.`,
          duration: 4000,
        });

        router.push(
          `/dashboard/forms/${
            trigger.linkedFormId
          }?${nextQueryParams.toString()}`
        );
        return true;
      }
    }
  }
  setIsShareDialogOpen(true);
  return false;
}
