
import type { LucideIcon } from 'lucide-react';
import { ClipboardList, Wrench, Truck, FileText, CalendarClock, FileWarning } from 'lucide-react';

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
  FileWarning, // Adicionado novo ícone para RNC
};

export const getFormIcon = (name?: string): LucideIcon => {
  if (name && iconMap[name]) {
    return iconMap[name];
  }
  return FileText; // Ícone padrão
};
