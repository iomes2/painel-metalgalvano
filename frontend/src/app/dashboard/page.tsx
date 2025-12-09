"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthInitializer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { formDefinitions } from "@/config/forms";
import { ArrowRight, ClipboardList, Sparkles } from "lucide-react";
import { getFormIcon } from "@/components/icons/icon-resolver";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [selectedFormDefinition, setSelectedFormDefinition] = useState<
    (typeof formDefinitions)[0] | null
  >(null);

  useEffect(() => {
    if (user) {
      window.scrollTo(0, 0);
    }
  }, [user]);

  useEffect(() => {
    if (selectedFormId) {
      const definition = formDefinitions.find(
        (form) => form.id === selectedFormId
      );
      setSelectedFormDefinition(definition || null);
    } else {
      setSelectedFormDefinition(null);
    }
  }, [selectedFormId]);

  if (!user) {
    return null;
  }

  const userName =
    user.displayName || user.email?.split("@")[0]?.split(".")[0] || "Gerente";

  const handleOpenForm = () => {
    if (selectedFormId) {
      router.push(`/dashboard/forms/${selectedFormId}`);
    }
  };

  const IconComponent = selectedFormDefinition
    ? getFormIcon(selectedFormDefinition.iconName)
    : ClipboardList;

  return (
    <div className="overflow-y-auto overflow-x-hidden max-w-full">
      {/* Welcome Banner - Compact */}
      <div className="welcome-banner mb-4 animate-fade-in-up">
        <div className="welcome-banner-content">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 opacity-80" />
            <span className="text-xs sm:text-sm font-medium opacity-80">
              Painel de Formulários
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">
            Olá, {userName}!
          </h1>
          <p className="text-sm sm:text-base opacity-90">
            Selecione um formulário abaixo para começar.
          </p>
        </div>
      </div>

      {/* Form Selection Card - Compact, expands only when form selected */}
      <div
        className="dashboard-card p-4 sm:p-5 animate-fade-in-up"
        style={{ animationDelay: "0.1s" }}
      >
        <h2 className="section-title mb-3">
          <ClipboardList className="section-title-icon" />
          <span>Selecionar Formulário</span>
        </h2>

        <p className="text-sm text-muted-foreground mb-3">
          Escolha o tipo de relatório que deseja preencher.
        </p>

        {/* Select with large touch target */}
        <div className="mb-4">
          <Select
            onValueChange={setSelectedFormId}
            value={selectedFormId || undefined}
          >
            <SelectTrigger className="w-full h-12 sm:h-14 text-base touch-target-lg rounded-xl border-2 border-border hover:border-primary/50 focus:border-primary transition-colors px-4">
              <SelectValue placeholder="Toque para escolher um formulário..." />
            </SelectTrigger>
            <SelectContent className="max-h-[50vh]">
              {formDefinitions.map((form) => {
                const CurrentFormIcon = getFormIcon(form.iconName);
                return (
                  <SelectItem
                    key={form.id}
                    value={form.id}
                    className="py-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <CurrentFormIcon className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-base">{form.name}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Form Preview - Only shows when form is selected */}
        {selectedFormDefinition && (
          <div className="mb-4 p-4 rounded-xl bg-muted/30 border border-border/50 animate-fade-in-up overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <h3 className="text-sm sm:text-base font-semibold text-foreground">
                  {selectedFormDefinition.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selectedFormDefinition.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Button - Right after select or preview */}
        <Button
          onClick={handleOpenForm}
          disabled={!selectedFormId}
          size="lg"
          className="w-full h-12 sm:h-14 text-base rounded-xl touch-target-lg bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <span>Abrir Formulário</span>
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
