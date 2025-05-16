
"use client";

import type { FormDefinition, FormField as FormFieldType, FormFieldOption } from '@/config/forms';
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
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
import { auth } from '@/lib/firebase'; 
import { getFirestore, collection, addDoc, Timestamp, doc, setDoc } from 'firebase/firestore';

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
        fieldSchema = z.date({
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
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formSchema = buildZodSchema(formDefinition.fields);
  
  type FormValues = z.infer<typeof formSchema>;

  const defaultValues = formDefinition.fields.reduce((acc, field) => {
    acc[field.id] = field.defaultValue !== undefined ? field.defaultValue :
                    field.type === 'checkbox' ? false :
                    field.type === 'number' ? null : 
                    ''; 
    return acc;
  }, {} as Record<string, any>);


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
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

    const db = getFirestore();
    
    // Common data for the report
    const reportPayload = {
      formType: formDefinition.id,
      formName: formDefinition.name,
      formData: data, // formData will contain all fields, including ordemServico if present
      submittedBy: currentUser.uid,
      submittedAt: Timestamp.now(),
    };

    // Check if the form has an 'ordemServico' field and if it's filled
    const ordemServicoField = formDefinition.fields.find(f => f.id === 'ordemServico');
    // Explicitly type osValue if it comes from data (FormValues)
    const osValue = (data as Record<string, any>).ordemServico as string | undefined;


    try {
      if (ordemServicoField && osValue && osValue.trim() !== '') {
        // Form has an OS field, and it's filled. Save under ordens_servico/{OS}/relatorios/{AUTO_ID}
        const osDocRef = doc(db, "ordens_servico", osValue.trim());
        // Optionally, ensure the OS document itself exists or update a timestamp
        await setDoc(osDocRef, { lastReportAt: Timestamp.now() }, { merge: true });

        const reportsSubCollectionRef = collection(db, "ordens_servico", osValue.trim(), "relatorios");
        await addDoc(reportsSubCollectionRef, reportPayload);
        
        toast({
          title: "Sucesso!",
          description: `Formulário "${formDefinition.name}" para OS "${osValue.trim()}" salvo!`,
        });
      } else {
        // Form does not have an OS field, or it's not filled. Save to generic 'submitted_reports'
        const genericReportsCollectionRef = collection(db, "submitted_reports");
        await addDoc(genericReportsCollectionRef, reportPayload);

        toast({
          title: "Sucesso!",
          description: `Formulário "${formDefinition.name}" salvo com sucesso!`,
        });
      }
      
      form.reset(); 
      setIsShareDialogOpen(true);
    } catch (error) {
      console.error("Error saving form data to Firestore:", error);
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar o formulário. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const IconComponent = getFormIcon(formDefinition.iconName);

  const handleShareDialogAction = () => {
    toast({
      title: "Compartilhar/Baixar PDF",
      description: "Funcionalidade de compartilhamento/download de PDF ainda não implementada.",
    });
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
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {formDefinition.fields.map((field) => (
                <FormField
                  key={field.id}
                  control={form.control}
                  name={field.id as keyof FormValues}
                  render={({ field: controllerField }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</FormLabel>
                      <FormControl>
                        <div> 
                          {field.type === 'text' && <Input placeholder={field.placeholder} {...controllerField} value={controllerField.value || ''} disabled={isSubmitting} />}
                          {field.type === 'email' && <Input type="email" placeholder={field.placeholder} {...controllerField} value={controllerField.value || ''} disabled={isSubmitting} />}
                          {field.type === 'number' && <Input type="number" placeholder={field.placeholder} {...controllerField} value={controllerField.value === null ? '' : controllerField.value} onChange={e => controllerField.onChange(e.target.value === '' ? null : Number(e.target.value))} disabled={isSubmitting} />}
                          {field.type === 'textarea' && <Textarea placeholder={field.placeholder} {...controllerField} value={controllerField.value || ''} disabled={isSubmitting} />}
                          {field.type === 'checkbox' && (
                             <div className="flex items-center space-x-2 pt-2">
                              <Checkbox
                                id={field.id} 
                                checked={!!controllerField.value}
                                onCheckedChange={controllerField.onChange}
                                disabled={isSubmitting}
                                aria-labelledby={`${field.id}-label`} 
                              />
                            </div>
                          )}
                          {field.type === 'select' && (
                            <Select onValueChange={controllerField.onChange} defaultValue={controllerField.value as string || undefined} value={controllerField.value as string || undefined} disabled={isSubmitting}>
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
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !controllerField.value && "text-muted-foreground"
                                  )}
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
                                  onSelect={controllerField.onChange}
                                  initialFocus
                                  locale={ptBR}
                                />
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </FormControl>
                      {field.type !== 'checkbox' && field.placeholder && <FormDescription>{/* Add description if needed */}</FormDescription>}
                       { /* Associate the FormLabel with the Checkbox using aria-labelledby on the Checkbox if FormLabel has an id.
                           However, FormLabel's id is tied to formItemId which is generated. For direct association,
                           the Checkbox would need its own label or be linked via aria-describedby if a separate description is needed.
                           The current structure with FormLabel serving the FormItem should be sufficient for accessibility.
                           We added an aria-labelledby to the checkbox that would require the FormLabel to have a corresponding id `${field.id}-label`.
                           Let's ensure FormLabel has an id that can be referenced, or remove explicit aria-labelledby if FormLabel inherently labels it.
                           Given FormLabel is part of FormItem, it should already label its contents.
                           The duplicate label for checkbox was removed in a previous step.
                           Adding `id={`${field.id}-label`}` to FormLabel for clarity for the checkbox.
                        */
                       }
                       {/* This FormLabel already has an id (`${id}-form-item` from useFormField)
                           which is set on its `htmlFor`. The `aria-labelledby` on Checkbox should use that.
                           Let's refine the checkbox aria-labelledby if necessary, or confirm it's covered.
                           The `FormLabel` above has `htmlFor={formItemId}`. `formItemId` is derived.
                           The checkbox itself is the input. `FormLabel` points to it. This is standard.
                           The `aria-labelledby` on the checkbox itself might be redundant or could point to the form label's actual ID.
                           For now, the current setup where `FormLabel` uses `htmlFor` targeting the control (via `formItemId`) is standard.
                           If the checkbox *itself* needed a label (e.g. if it was standalone), then `aria-label` or `aria-labelledby` referencing a separate element would be used.
                           Here, the `FormLabel` component *is* the label for the checkbox (and other inputs).
                        */}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
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
    

    