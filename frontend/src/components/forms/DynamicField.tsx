"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type {
  FormField as FormFieldType,
  FormFieldOption,
} from "@/config/forms";
import type { Control } from "react-hook-form";
import { useSearchParams } from "next/navigation";

interface DynamicFieldProps {
  field: FormFieldType;
  control: Control<any>;
  isSubmitting: boolean;
}

export function DynamicField({
  field,
  control,
  isSubmitting,
}: DynamicFieldProps) {
  const searchParams = useSearchParams();

  return (
    <FormField
      key={field.id}
      control={control}
      name={field.id}
      render={({ field: controllerField }) => (
        <FormItem>
          <FormLabel className="font-semibold">
            <span>{field.label}</span>
            {field.required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <div>
              {field.type === "text" && (
                <Input
                  placeholder={field.placeholder}
                  {...controllerField}
                  value={(controllerField.value as string) || ""}
                  disabled={
                    isSubmitting ||
                    (field.id === "ordemServico" && !!searchParams.get("os"))
                  }
                />
              )}
              {field.type === "email" && (
                <Input
                  type="email"
                  placeholder={field.placeholder}
                  {...controllerField}
                  value={(controllerField.value as string) || ""}
                  disabled={isSubmitting}
                />
              )}
              {field.type === "number" && (
                <Input
                  type="number"
                  placeholder={field.placeholder}
                  {...controllerField}
                  value={
                    controllerField.value === null ||
                    controllerField.value === undefined
                      ? ""
                      : String(controllerField.value)
                  }
                  onChange={(e) =>
                    controllerField.onChange(
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                  disabled={isSubmitting}
                />
              )}
              {field.type === "textarea" && (
                <Textarea
                  placeholder={field.placeholder}
                  {...controllerField}
                  value={(controllerField.value as string) || ""}
                  disabled={isSubmitting}
                />
              )}
              {field.type === "checkbox" && (
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id={controllerField.name}
                    checked={!!controllerField.value}
                    onCheckedChange={controllerField.onChange}
                    disabled={isSubmitting}
                  />
                </div>
              )}
              {field.type === "select" && (
                <Select
                  onValueChange={controllerField.onChange}
                  value={(controllerField.value as string) || undefined}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={field.placeholder || "Selecione..."}
                    />
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
              {field.type === "date" && (
                <DatePickerField
                  field={field}
                  controllerField={controllerField}
                  isSubmitting={isSubmitting}
                />
              )}
              {field.type === "file" && (
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
          {field.type !== "checkbox" && field.placeholder && (
            <FormDescription>{/* Add description if needed */}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function DatePickerField({
  field,
  controllerField,
  isSubmitting,
}: {
  field: FormFieldType;
  controllerField: any;
  isSubmitting: boolean;
}) {
  const normalizeDate = (val: any): Date | undefined => {
    if (!val) return undefined;
    try {
      if (val instanceof Date) return val;
      if (
        typeof val === "object" &&
        "toDate" in val &&
        typeof val.toDate === "function"
      ) {
        return val.toDate();
      }
      // Handle serialized timestamps (seconds/_seconds)
      if (typeof val === "object" && ("seconds" in val || "_seconds" in val)) {
        const seconds = val.seconds || val._seconds;
        return new Date(seconds * 1000);
      }
      // Handle string/number
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d;
      return undefined;
    } catch {
      return undefined;
    }
  };

  const dateVal = normalizeDate(controllerField.value);

  return (
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
          {dateVal ? (
            format(dateVal, "PPP", { locale: ptBR })
          ) : (
            <span>{field.placeholder || "Escolha uma data"}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={dateVal}
          onSelect={(date) => controllerField.onChange(date)}
          initialFocus
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  );
}
