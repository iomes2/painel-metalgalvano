
import type { LucideIcon } from 'lucide-react';
import { ClipboardList, Wrench, Truck, FileText } from 'lucide-react';

interface IconMap {
  [key: string]: LucideIcon;
}

// Adicione outros ícones usados em formDefinitions aqui, se necessário
const iconMap: IconMap = {
  ClipboardList,
  Wrench,
  Truck,
  FileText,
};

export const getFormIcon = (name?: string): LucideIcon => {
  if (name && iconMap[name]) {
    return iconMap[name];
  }
  return FileText; // Ícone padrão
};
