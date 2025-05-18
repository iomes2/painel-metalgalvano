
import type { LucideIcon } from 'lucide-react';
import { ClipboardList, Wrench, Truck, FileText, CalendarClock, FileWarning, SearchCheck } from 'lucide-react';

interface IconMap {
  [key: string]: LucideIcon;
}

// Adicione outros ícones usados em formDefinitions aqui, se necessário
const iconMap: IconMap = {
  ClipboardList,
  Wrench,
  Truck,
  FileText,
  CalendarClock,
  FileWarning, 
  SearchCheck, // Adicionado novo ícone para Inspeção
};

export const getFormIcon = (name?: string): LucideIcon => {
  if (name && iconMap[name]) {
    return iconMap[name];
  }
  return FileText; // Ícone padrão
};

    