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
import { documentDefinitions, DocumentDefinition } from "@/config/documents";

export default function DocumentLibraryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(
    new Set(documentDefinitions.map((doc) => doc.category))
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

  const getIcon = (doc: DocumentDefinition) => {
    if (doc.icon) return <doc.icon className="h-8 w-8 text-primary" />;
    if (doc.type === "pdf")
      return <FileText className="h-8 w-8 text-red-500" />;
    if (doc.type === "image")
      return <LucideImage className="h-8 w-8 text-blue-500" />;
    return <FileText className="h-8 w-8" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">
          Biblioteca de Documentos
        </h1>
        <p className="text-slate-500">
          Acesse e baixe os documentos padrões, fluxogramas e manuais.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Buscar documentos..."
            className="pl-9 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => (
          <Card key={doc.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="bg-slate-100 p-2 rounded-lg">{getIcon(doc)}</div>
              <div className="flex-1">
                <CardTitle className="text-base line-clamp-1">
                  {doc.title}
                </CardTitle>
                <CardDescription className="line-clamp-2 text-xs mt-1">
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
                  <Button variant="ghost" size="icon" asChild>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Visualizar"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
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
  );
}
