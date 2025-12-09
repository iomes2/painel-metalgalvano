"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackButton() {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      onClick={() => router.back()}
      className="mb-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 pl-0 hover:bg-transparent"
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Voltar
    </Button>
  );
}
