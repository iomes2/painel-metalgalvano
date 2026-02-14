"use strict";
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Download,
  ExternalLink,
  FileText,
  Image as LucideImage,
  FileSpreadsheet,
} from "lucide-react";
import styles from "./scroll.module.css";
import { documentDefinitions, DocumentDefinition } from "@/config/documents";

export default function DocumentLibraryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(
    new Set(documentDefinitions.map((doc) => doc.category)),
  );

  const filteredDocs = documentDefinitions.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory
      ? doc.category === selectedCategory
      : true;
    return matchesSearch && matchesCategory;
  });

  // Scroll sempre visível tratado via CSS module

  const getIcon = (doc: DocumentDefinition) => {
    if (doc.icon)
      return <doc.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />;
    if (doc.type === "pdf")
      return <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />;
    if (doc.type === "image")
      return <LucideImage className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />;
    return <FileText className="h-6 w-6 sm:h-8 sm:w-8" />;
  };

  return (
    <div className="space-y-6">
      {/* Header no estilo da página Consultar */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900 p-4 md:p-6 shadow-xl">
        {/* Elementos decorativos */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />

        <div className="relative z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <span>Dashboard</span>
            <span>›</span>
            <span className="text-cyan-400">Documentos</span>
          </div>

          {/* Título */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/20">
              <FileText className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">
                Biblioteca de Documentos
              </h1>
              <p className="text-sm text-slate-400 hidden sm:block">
                Acesse e baixe os documentos padrões, fluxogramas e manuais.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Área de busca com estilo padronizado */}
      <div className="rounded-2xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg overflow-hidden">
        <div className="p-4 md:p-6 space-y-5">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-col md:flex-row gap-3"
          >
            <div className="relative w-full md:min-w-[400px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Buscar documentos..."
                aria-label="Buscar documentos"
                className="pl-9 flex-grow text-base md:text-sm h-11 rounded-xl border-slate-200 dark:border-slate-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </form>

          <div className="flex gap-2 overflow-x-auto pb-2 w-full max-w-[85vw] md:max-w-full">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Container estático com scroll vertical para a lista */}
      <div className="rounded-2xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg overflow-hidden">
        <div className="p-4 md:p-6 overflow-hidden">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Documentos Disponíveis
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {filteredDocs.length} documento(s) encontrado(s).
            </p>
          </div>
          <div className={`relative ${styles.scrollContainer}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredDocs.map((doc) => (
                <Card
                  key={doc.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="flex flex-row items-center gap-3 sm:gap-4 py-3 sm:py-4 pb-2">
                    <div className="bg-slate-100 p-1.5 sm:p-2 rounded-lg">
                      {getIcon(doc)}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-sm sm:text-base line-clamp-1">
                        {doc.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-[11px] sm:text-xs mt-1">
                        {doc.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {doc.category}
                      </Badge>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          asChild
                        >
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="Visualizar"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 sm:h-9"
                          asChild
                        >
                          <a href={doc.fileUrl} download title="Baixar">
                            <Download className="h-4 w-4 mr-2" />
                            Baixar
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredDocs.length === 0 && (
                <div className="col-span-full text-center py-10 text-slate-500">
                  Nenhum documento encontrado.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
