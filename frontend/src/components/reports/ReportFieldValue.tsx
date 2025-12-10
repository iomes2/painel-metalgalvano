"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Image as ImageIcon,
  Calendar as CalendarLucideIcon,
  CheckSquare,
  Edit3,
  Hash,
  List,
} from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { FormField } from "@/config/forms";

export interface ReportPhoto {
  id?: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

interface ReportFieldValueProps {
  field: FormField;
  value: any;
  onImageClick?: (image: ReportPhoto, allImages: ReportPhoto[]) => void;
}

export const fieldTypeIcons: Record<FormField["type"], React.ElementType> = {
  text: Edit3,
  email: Edit3,
  password: Edit3,
  number: Hash,
  textarea: List,
  select: List,
  date: CalendarLucideIcon,
  file: ImageIcon,
  checkbox: CheckSquare,
};

export function ReportFieldValue({
  field,
  value,
  onImageClick,
}: ReportFieldValueProps) {
  if (value === undefined || value === null || value === "") {
    return <span className="italic text-muted-foreground">Não preenchido</span>;
  }

  switch (field.type) {
    case "date":
      return <DateValue value={value} />;
    case "checkbox":
      return <CheckboxValue value={value} />;
    case "select":
      return <SelectValue field={field} value={value} />;
    case "file":
      return <FileValue value={value} onImageClick={onImageClick} />;
    default:
      return String(value);
  }
}

// Sub-components to reduce cognitive complexity

function DateValue({ value }: { value: any }) {
  let dateVal: Date | null = null;
  try {
    const val = value as any;
    if (val instanceof Date) dateVal = val;
    else if (val && typeof val.toDate === "function") dateVal = val.toDate();
    else if (val && typeof val === "object") {
      if (typeof val.seconds === "number")
        dateVal = new Date(val.seconds * 1000);
      else if (typeof val._seconds === "number")
        dateVal = new Date(val._seconds * 1000);
    } else if (typeof val === "string" || typeof val === "number") {
      dateVal = new Date(val);
    }
  } catch (e) {
    console.error("Error parsing date value", value, e);
  }

  if (dateVal && !isNaN(dateVal.getTime())) {
    return format(dateVal, "dd/MM/yyyy 'às' HH:mm", {
      locale: ptBR,
    });
  }
  return String(value);
}

function CheckboxValue({ value }: { value: any }) {
  return (
    <Badge variant={value ? "default" : "secondary"}>
      {value ? "Sim" : "Não"}
    </Badge>
  );
}

function SelectValue({ field, value }: { field: FormField; value: any }) {
  const option = field.options?.find((opt) => opt.value === value);
  return (
    <Badge variant="outline">{option ? option.label : String(value)}</Badge>
  );
}

function FileValue({
  value,
  onImageClick,
}: {
  value: any;
  onImageClick?: (image: ReportPhoto, allImages: ReportPhoto[]) => void;
}) {
  const isImage = (file: ReportPhoto) => {
    const mime = (file.type || "").toLowerCase();
    if (mime.startsWith("image/")) return true;
    const n = (file.name || "").toLowerCase();
    return (
      n.endsWith(".jpg") ||
      n.endsWith(".jpeg") ||
      n.endsWith(".png") ||
      n.endsWith(".webp") ||
      n.endsWith(".gif")
    );
  };

  if (Array.isArray(value) && value.length > 0) {
    const photos = (value as ReportPhoto[]).filter((p) => !!p && !!p.url);
    if (photos.length === 0) {
      return (
        <span className="italic text-muted-foreground">Nenhum arquivo</span>
      );
    }
    const imageFiles = photos.filter((p) => isImage(p));

    // Se houver imagens, renderiza grade; senão, botão padrão
    if (imageFiles.length > 0) {
      return (
        <div className="flex flex-wrap gap-2 print:hidden">
          {imageFiles.slice(0, 6).map((photo, idx) => (
            <button
              key={`${photo.url}-${idx}`}
              type="button"
              className="relative h-12 w-12 overflow-hidden rounded-md ring-1 ring-border hover:ring-primary focus:outline-none focus:ring-2 focus:ring-primary"
              onClick={() => onImageClick?.(photo, photos)}
              aria-label={`Abrir imagem ${photo.name}`}
            >
              <Image
                src={photo.url}
                alt={photo.name}
                fill
                sizes="48px"
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
          {photos.length > 6 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onImageClick?.(imageFiles[0], photos)}
            >
              <ImageIcon className="mr-2 h-4 w-4" />+{photos.length - 6}
            </Button>
          )}
        </div>
      );
    }
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => onImageClick?.(photos[0], photos)}
      >
        <ImageIcon className="mr-2 h-4 w-4" /> Ver ({photos.length}) Arquivo(s)
      </Button>
    );
  }
  return <span className="italic text-muted-foreground">Nenhum arquivo</span>;
}
