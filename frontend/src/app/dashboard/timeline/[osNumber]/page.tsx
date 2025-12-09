"use client";

import { useParams } from "next/navigation";
import { Timeline } from "@/components/timeline/Timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TimelinePage() {
  const params = useParams();
  const osNumber = params.osNumber as string;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Linha do Tempo</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico da Obra: {osNumber}</CardTitle>
        </CardHeader>
        <CardContent>
          <Timeline osNumber={osNumber} />
        </CardContent>
      </Card>
    </div>
  );
}
