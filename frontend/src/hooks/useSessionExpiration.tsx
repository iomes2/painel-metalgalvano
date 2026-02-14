"use client";

import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";

export function useSessionExpiration() {
  const { toast } = useToast();

  useEffect(() => {
    const handleSessionExpired = (event: Event) => {
      const customEvent = event as CustomEvent;
      const message =
        customEvent.detail?.message || "Sua sessão expirou.";

      toast({
        title: "Sessão Expirada",
        description: message,
        variant: "destructive",
        duration: 5000,
      });
    };

    // Escutar o evento de sessão expirada
    window.addEventListener("session-expired", handleSessionExpired);

    return () => {
      window.removeEventListener("session-expired", handleSessionExpired);
    };
  }, [toast]);
}
