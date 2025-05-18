
"use client";

import type { FormDefinition, FormField as FormFieldType, FormFieldOption, LinkedFormTriggerCondition, CarryOverParam } from '@/config/forms';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon } from 'lucide-react';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getFormIcon } from '@/components/icons/icon-resolver';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
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
import { auth, storage, db } from '@/lib/firebase'; // db importado
import { collection, addDoc, Timestamp, doc, setDoc, type DocumentReference } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";


interface DynamicFormRendererProps {
  formDefinition: FormDefinition;
}

// Helper to build Zod schema from form definition
const buildZodSchema = (fields: FormFieldType[]) => {
  const schemaShape: Record<string, z.ZodTypeAny> = {};
  fields.forEach(field => {
    let fieldSchema: z.ZodTypeAny;

    switch (field.type) {
      case 'text':
      case 'textarea':
        fieldSchema = z.string();
        if (field.required) fieldSchema = fieldSchema.min(1, `${field.label} é obrigatório(a).`);
        else fieldSchema = fieldSchema.optional().or(z.literal(''));
        break;
      case 'email':
        fieldSchema = z.string().email(`Formato de e-mail inválido para ${field.label}.`);
        if (field.required) fieldSchema = fieldSchema.min(1, `${field.label} é obrigatório(a).`);
        else fieldSchema = fieldSchema.optional().or(z.literal(''));
        break;
      case 'number':
        fieldSchema = z.coerce.number();
        if (field.required) fieldSchema = fieldSchema.min(0.00001, `${field.label} é obrigatório(a) e deve ser diferente de zero, se aplicável.`);
        else fieldSchema = fieldSchema.optional().nullable();
        break;
      case 'date':
        fieldSchema = z.coerce.date({
            required_error: `${field.label} é obrigatório(a).`,
            invalid_type_error: `Esta não é uma data válida para ${field.label}!`,
        });
        if (!field.required) fieldSchema = fieldSchema.optional().nullable();
        break;
      case 'checkbox':
        fieldSchema = z.boolean().default(field.defaultValue as boolean || false);
        break;
      case 'select':
        fieldSchema = z.string();
        if (field.required) fieldSchema = fieldSchema.min(1, `Por favor, selecione uma opção para ${field.label}.`);
        else fieldSchema = fieldSchema.optional().or(z.literal(''));
        break;
      case 'file':
        fieldSchema = z.any().optional().nullable(); // FileList or null/undefined
        break;
      default:
        fieldSchema = z.any();
    }
    schemaShape[field.id] = fieldSchema;
  });
  return z.object(schemaShape);
};


export function DynamicFormRenderer({ formDefinition }: DynamicFormRendererProps) {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [mainOriginatingFormId, setMainOriginatingFormId] = useState<string | null>(null); // ID of the primary form in a chain (e.g., Acompanhamento)
  const [carryOverQueryParams, setCarryOverQueryParams] = useState<Record<string, string>>({});


  const formSchema = buildZodSchema(formDefinition.fields);
  type FormValues = z.infer<typeof formSchema>;

  const defaultValues = formDefinition.fields.reduce((acc, field) => {
    acc[field.id] = field.defaultValue !== undefined ? field.defaultValue :
                    field.type === 'checkbox' ? false :
                    field.type === 'number' ? null :
                    field.type === 'file' ? null :
                    '';
    return acc;
  }, {} as Record<string, any>);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });

  const { watch, setValue, reset, getValues, control } = form;

  // Watch specific fields for conditional rendering & logic
  const situacaoEtapaDia = watch('situacaoEtapaDia' as any);
  const fotosEtapaDia = watch('fotosEtapaDia'as any);
  const horasRetrabalhoParadasDia = watch('horasRetrabalhoParadasDia' as any);
  const horarioEfetivoInicioAtividades = watch('horarioEfetivoInicioAtividades' as any);
  const horarioInicioJornadaPrevisto = watch('horarioInicioJornadaPrevisto' as any);
  const horarioEfetivoSaidaObra = watch('horarioEfetivoSaidaObra' as any);
  const horarioTerminoJornadaPrevisto = watch('horarioTerminoJornadaPrevisto' as any);
  const fotosNaoConformidade = watch('fotosNaoConformidade' as any);
  const fotosInspecao = watch('fotosInspecao' as any); // For new inspection form

  const stableSetValue = useCallback(setValue, []);
  const stableGetValues = useCallback(getValues, []);


  useEffect(() => {
    const osFromQuery = searchParams.get('os');
    const originatingIdFromQuery = searchParams.get('originatingFormId'); // Main form ID
    
    const tempCarryOverParams: Record<string, string> = {};
    // Extract all other query params as potential carry-over params
    searchParams.forEach((value, key) => {
      if (key !== 'os' && key !== 'originatingFormId') {
        tempCarryOverParams[key] = value;
      }
    });
    setCarryOverQueryParams(tempCarryOverParams);

    if (originatingIdFromQuery) {
      setMainOriginatingFormId(originatingIdFromQuery);
    }

    const formOsField = formDefinition.fields.find(f => f.id === 'ordemServico');
    if (formOsField && osFromQuery) {
      if (stableGetValues('ordemServico' as any) !== osFromQuery) {
        stableSetValue('ordemServico' as any, osFromQuery, { shouldValidate: true });
      }
    }
  }, [formDefinition.id, formDefinition.fields, searchParams, stableSetValue, stableGetValues]);


  useEffect(() => {
    if (formDefinition.id === 'cronograma-diario-obra') {
      if (situacaoEtapaDia !== 'em_atraso' && stableGetValues('motivoAtrasoDia' as any) !== '') {
        stableSetValue('motivoAtrasoDia' as any, '', { shouldValidate: false });
      }
      if (fotosEtapaDia !== 'sim' && stableGetValues('uploadFotosEtapaDia' as any) !== null) {
        stableSetValue('uploadFotosEtapaDia' as any, null, { shouldValidate: false });
      }
      if ((!horasRetrabalhoParadasDia || String(horasRetrabalhoParadasDia).trim() === '') && stableGetValues('motivoRetrabalhoParadaDia' as any) !== '') {
        stableSetValue('motivoRetrabalhoParadaDia' as any, '', { shouldValidate: false });
      }
      const efetivoInicio = String(horarioEfetivoInicioAtividades || '').trim();
      const previstoInicio = String(horarioInicioJornadaPrevisto || '').trim();
      if ((efetivoInicio === '' || efetivoInicio === previstoInicio) && stableGetValues('motivoNaoCumprimentoHorarioInicio' as any) !== '') {
        stableSetValue('motivoNaoCumprimentoHorarioInicio' as any, '', { shouldValidate: false });
      }
      const efetivoSaida = String(horarioEfetivoSaidaObra || '').trim();
      const previstoSaida = String(horarioTerminoJornadaPrevisto || '').trim();
      if ((efetivoSaida === '' || efetivoSaida === previstoSaida) && stableGetValues('motivoNaoCumprimentoHorarioSaida' as any) !== '') {
        stableSetValue('motivoNaoCumprimentoHorarioSaida' as any, '', { shouldValidate: false });
      }
    } else if (formDefinition.id === 'rnc-report') {
      if (fotosNaoConformidade !== 'sim' && stableGetValues('uploadFotosNaoConformidade' as any) !== null) {
        stableSetValue('uploadFotosNaoConformidade' as any, null, { shouldValidate: false });
      }
    } else if (formDefinition.id === 'relatorio-inspecao-site') {
      if (fotosInspecao !== 'sim' && stableGetValues('uploadFotosInspecao' as any) !== null) {
        stableSetValue('uploadFotosInspecao' as any, null, { shouldValidate: false });
      }
    }
  }, [
    formDefinition.id,
    situacaoEtapaDia, fotosEtapaDia, horasRetrabalhoParadasDia,
    horarioEfetivoInicioAtividades, horarioInicioJornadaPrevisto,
    horarioEfetivoSaidaObra, horarioTerminoJornadaPrevisto,
    fotosNaoConformidade, fotosInspecao,
    stableSetValue, stableGetValues
  ]);


  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true);
    const currentUser = auth.currentUser;

    if (!currentUser) {
      toast({ title: "Erro de Autenticação", description: "Você precisa estar logado para enviar formulários.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    const submissionTimestamp = Date.now();
    const fileUploadPromises: Promise<void>[] = [];

    for (const field of formDefinition.fields) {
      if (field.type === 'file' && data[field.id as keyof FormValues] instanceof FileList) {
        const fileList = data[field.id as keyof FormValues] as FileList;
        if (fileList.length > 0) {
          const osValue = (data as Record<string, any>).ordemServico as string | undefined;
          for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            const filePath = `reports/${currentUser.uid}/${formDefinition.id}/${osValue || 'general'}/${submissionTimestamp}/${file.name}`;
            const fileStorageRef = storageRef(storage, filePath);
            const uploadTask = uploadBytesResumable(fileStorageRef, file);
            fileUploadPromises.push(
              new Promise((resolve, reject) => {
                uploadTask.on('state_changed', null, 
                  (error) => { console.error(`Erro no upload do arquivo ${file.name}:`, error); reject(error); },
                  async () => { try { resolve(); } catch (error) { console.error(`Erro na fase de upload para ${file.name}:`, error); reject(error); } }
                );
              })
            );
          }
        }
      }
    }

    try {
      if (fileUploadPromises.length > 0) {
        toast({ title: "Enviando arquivos...", description: `Por favor, aguarde. ${fileUploadPromises.length} arquivo(s) sendo processado(s).` });
      }
      await Promise.all(fileUploadPromises);

      const finalFormDataToSave = { ...data } as Record<string, any>;
      for (const field of formDefinition.fields) {
        if (field.type === 'file' && data[field.id as keyof FormValues] instanceof FileList) {
          const fileList = data[field.id as keyof FormValues] as FileList;
          if (fileList.length > 0) {
            const osValue = (data as Record<string, any>).ordemServico as string | undefined;
            const fileDetailsForField: Array<{ name: string, url: string, type: string, size: number }> = [];
            for (let i = 0; i < fileList.length; i++) {
              const file = fileList[i];
              const filePath = `reports/${currentUser.uid}/${formDefinition.id}/${osValue || 'general'}/${submissionTimestamp}/${file.name}`;
              const fileRef = storageRef(storage, filePath);
              try {
                const url = await getDownloadURL(fileRef);
                fileDetailsForField.push({ name: file.name, url: url, type: file.type, size: file.size });
              } catch (e) { console.error("Erro ao buscar URL pós-upload:", e); }
            }
            finalFormDataToSave[field.id] = fileDetailsForField;
          } else { delete finalFormDataToSave[field.id]; }
        } else if (field.type === 'file') { delete finalFormDataToSave[field.id]; }
      }

      const formDataWithTimestamps = { ...finalFormDataToSave };
      formDefinition.fields.forEach(field => {
        if (field.type === 'date' && formDataWithTimestamps[field.id] instanceof Date) {
          formDataWithTimestamps[field.id] = Timestamp.fromDate(formDataWithTimestamps[field.id] as Date);
        }
      });

      const reportPayload: Record<string, any> = {
        formType: formDefinition.id,
        formName: formDefinition.name,
        formData: formDataWithTimestamps,
        submittedBy: currentUser.uid,
        submittedAt: Timestamp.fromMillis(submissionTimestamp),
        gerenteId: currentUser.email?.split('@')[0] || 'desconhecido',
      };
      
      // If this form was triggered by another, mainOriginatingFormId will be set
      if (mainOriginatingFormId && formDefinition.id !== 'cronograma-diario-obra') { // Don't set for the main form itself
        reportPayload.originatingFormId = mainOriginatingFormId;
      }

      const ordemServicoField = formDefinition.fields.find(f => f.id === 'ordemServico');
      const osValue = (data as Record<string, any>).ordemServico as string | undefined;
      let savedDocRef: DocumentReference | undefined;

      if (ordemServicoField && osValue && osValue.trim() !== '') {
        const osDocRef = doc(db, "ordens_servico", osValue.trim());
        await setDoc(osDocRef, { lastReportAt: Timestamp.fromMillis(submissionTimestamp), os: osValue.trim(), updatedBy: currentUser.uid, updatedByGerenteId: reportPayload.gerenteId }, { merge: true });
        const reportsSubCollectionRef = collection(db, "ordens_servico", osValue.trim(), "relatorios");
        savedDocRef = await addDoc(reportsSubCollectionRef, reportPayload);
        toast({ title: "Sucesso!", description: `Formulário "${formDefinition.name}" para OS "${osValue.trim()}" salvo com arquivos enviados!` });
      } else {
        const genericReportsCollectionRef = collection(db, "submitted_reports");
        savedDocRef = await addDoc(genericReportsCollectionRef, reportPayload);
        toast({ title: "Sucesso!", description: `Formulário "${formDefinition.name}" salvo com sucesso e arquivos enviados!` });
      }

      reset(defaultValues);
      // setMainOriginatingFormId(null); // Don't reset here, needed for subsequent triggers if any

      const triggers = formDefinition.linkedFormTriggers;
      if (triggers && savedDocRef) {
        for (const trigger of triggers) {
          let conditionMet = false;
          if (trigger.triggerFieldId.startsWith('_queryParam_')) {
            const paramName = trigger.triggerFieldId.substring('_queryParam_'.length);
            conditionMet = carryOverQueryParams[paramName] === trigger.triggerFieldValue;
          } else {
            conditionMet = (data as any)[trigger.triggerFieldId] === trigger.triggerFieldValue;
          }

          if (conditionMet) {
            const nextQueryParams = new URLSearchParams();
            const osToPass = trigger.passOsFieldId && (data as any)[trigger.passOsFieldId] ? 
                             String((data as any)[trigger.passOsFieldId]).trim() :
                             osValue?.trim(); // Fallback to current form's OS if passOsFieldId not specified or empty

            if (osToPass) {
              nextQueryParams.append('os', osToPass);
            }
            
            // Determine the main originating form ID for the next step
            // If current form is 'cronograma-diario-obra', it's the main originator for the next step
            // Otherwise, pass along the mainOriginatingFormId that this form received
            const nextMainOriginatingFormId = formDefinition.id === 'cronograma-diario-obra' ? savedDocRef.id : mainOriginatingFormId;
            if (nextMainOriginatingFormId) {
                nextQueryParams.append('originatingFormId', nextMainOriginatingFormId);
            }
            
            trigger.carryOverParams?.forEach(cop => {
              if ((data as any)[cop.fieldIdFromCurrentForm] !== undefined) {
                nextQueryParams.append(cop.queryParamName, String((data as any)[cop.fieldIdFromCurrentForm]));
              }
            });
            
            toast({ title: "Próximo Passo", description: `Por favor, preencha o próximo formulário.`, duration: 4000 });
            router.push(`/dashboard/forms/${trigger.linkedFormId}?${nextQueryParams.toString()}`);
            return; // Exit after the first matching trigger
          }
        }
      }
      // If no triggers matched or no triggers defined, show dialog
      setIsShareDialogOpen(true);

    } catch (error) {
      console.error("Erro durante o envio do formulário ou upload de arquivos:", error);
      toast({ title: "Erro ao Salvar", description: "Não foi possível salvar o formulário ou enviar os arquivos. Tente novamente.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const IconComponent = getFormIcon(formDefinition.iconName);

  const handleShareDialogAction = () => {
    toast({ title: "Compartilhar/Baixar PDF", description: "Funcionalidade de compartilhamento/download de PDF ainda não implementada." });
    setIsShareDialogOpen(false);
    router.push('/dashboard');
  };

  const handleShareDialogCancel = () => {
    setIsShareDialogOpen(false);
    router.push('/dashboard');
  };

  return (
    <>
      <Card className="w-full shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <IconComponent className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">{formDefinition.name}</CardTitle>
          </div>
          <CardDescription>{formDefinition.description}</CardDescription>
          {mainOriginatingFormId && <p className="text-sm text-muted-foreground">Vinculado ao Relatório Principal ID: {mainOriginatingFormId}</p>}
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {formDefinition.fields.map((field) => {
                let shouldRenderField = true;
                // Conditional rendering logic based on field values
                if (formDefinition.id === 'cronograma-diario-obra') {
                  if (field.id === 'motivoAtrasoDia') shouldRenderField = situacaoEtapaDia === 'em_atraso';
                  else if (field.id === 'uploadFotosEtapaDia') shouldRenderField = fotosEtapaDia === 'sim';
                  else if (field.id === 'motivoRetrabalhoParadaDia') shouldRenderField = !!horasRetrabalhoParadasDia && String(horasRetrabalhoParadasDia).trim() !== '';
                  else if (field.id === 'motivoNaoCumprimentoHorarioInicio') {
                    const efetivo = String(horarioEfetivoInicioAtividades || '').trim();
                    const previsto = String(horarioInicioJornadaPrevisto || '').trim();
                    shouldRenderField = efetivo !== '' && efetivo !== previsto;
                  } else if (field.id === 'motivoNaoCumprimentoHorarioSaida') {
                    const efetivo = String(horarioEfetivoSaidaObra || '').trim();
                    const previsto = String(horarioTerminoJornadaPrevisto || '').trim();
                    shouldRenderField = efetivo !== '' && efetivo !== previsto;
                  }
                } else if (formDefinition.id === 'rnc-report') {
                  if (field.id === 'uploadFotosNaoConformidade') shouldRenderField = fotosNaoConformidade === 'sim';
                } else if (formDefinition.id === 'relatorio-inspecao-site') {
                  if (field.id === 'uploadFotosInspecao') shouldRenderField = fotosInspecao === 'sim';
                  if (field.id === 'itensNaoConformes' || field.id === 'acoesCorretivasSugeridas') {
                     const conformidade = getValues('conformidadeSeguranca' as any); // Need to get value directly if not watched
                     shouldRenderField = conformidade === 'nao';
                  }
                }

                if (!shouldRenderField) return null;

                return (
                  <FormField
                    key={field.id}
                    control={control}
                    name={field.id as keyof FormValues}
                    render={({ field: controllerField }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</FormLabel>
                        <FormControl>
                          <div>
                            {field.type === 'text' && <Input placeholder={field.placeholder} {...controllerField} value={controllerField.value as string || ''} disabled={isSubmitting} />}
                            {field.type === 'email' && <Input type="email" placeholder={field.placeholder} {...controllerField} value={controllerField.value as string || ''} disabled={isSubmitting} />}
                            {field.type === 'number' && <Input type="number" placeholder={field.placeholder} {...controllerField} value={controllerField.value === null || controllerField.value === undefined ? '' : String(controllerField.value)} onChange={e => controllerField.onChange(e.target.value === '' ? null : Number(e.target.value))} disabled={isSubmitting} />}
                            {field.type === 'textarea' && <Textarea placeholder={field.placeholder} {...controllerField} value={controllerField.value as string || ''} disabled={isSubmitting} />}
                            {field.type === 'checkbox' && (
                              <div className="flex items-center space-x-2 pt-2">
                                <Checkbox
                                  id={controllerField.name}
                                  checked={!!controllerField.value}
                                  onCheckedChange={controllerField.onChange}
                                  disabled={isSubmitting}
                                />
                              </div>
                            )}
                            {field.type === 'select' && (
                              <Select
                                onValueChange={controllerField.onChange}
                                value={controllerField.value as string || undefined}
                                disabled={isSubmitting}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={field.placeholder || "Selecione..."} />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options?.map((option: FormFieldOption) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            {field.type === 'date' && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant={"outline"}
                                    className={cn("w-full justify-start text-left font-normal", !controllerField.value && "text-muted-foreground")}
                                    disabled={isSubmitting}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {controllerField.value ? format(new Date(controllerField.value as string | number | Date), "PPP", { locale: ptBR }) : <span>{field.placeholder || "Escolha uma data"}</span>}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={controllerField.value ? new Date(controllerField.value as string | number | Date) : undefined}
                                    onSelect={(date) => controllerField.onChange(date)}
                                    initialFocus
                                    locale={ptBR}
                                  />
                                </PopoverContent>
                              </Popover>
                            )}
                            {field.type === 'file' && (
                              <Input
                                type="file"
                                accept="image/*"
                                multiple
                                disabled={isSubmitting}
                                className="pt-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                                onChange={(e) => controllerField.onChange(e.target.files)}
                              />
                            )}
                          </div>
                        </FormControl>
                        {field.type !== 'checkbox' && field.placeholder && <FormDescription>{/* Add description if needed */}</FormDescription>}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                );
              })}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t">
              <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar Formulário"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <AlertDialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Formulário Enviado e "PDF Gerado"!</AlertDialogTitle>
            <AlertDialogDescription>
              Seu formulário "{formDefinition.name}" foi salvo com sucesso. O PDF foi "gerado" (simulação).
              Deseja compartilhá-lo ou baixá-lo agora?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleShareDialogCancel}>
              Não, Voltar ao Início
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleShareDialogAction}>
              Sim, Compartilhar/Baixar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    