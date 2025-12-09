"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

interface TimelineEvent {
  id: string;
  action: string;
  date: string;
  user: string;
  details: any;
  context?: string;
}

export function Timeline({ osNumber }: { osNumber: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchTimeline() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch(
          `http://localhost:3001/api/v1/timeline/${osNumber}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        if (data.success) {
          setEvents(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch timeline", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTimeline();
  }, [osNumber, user]);

  if (loading) return <div>Carregando linha do tempo...</div>;
  if (!events.length)
    return <div>Nenhum histórico encontrado para esta obra.</div>;

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <Card key={event.id} className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
          <CardHeader className="py-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {format(new Date(event.date), "dd/MM/yyyy HH:mm", {
                  locale: ptBR,
                })}
              </CardTitle>
              <Badge variant="outline">{event.action}</Badge>
            </div>
          </CardHeader>
          <CardContent className="py-2">
            <p className="font-semibold text-lg">
              {formatAction(event.action)}
            </p>
            <p className="text-sm text-gray-600">Usuário: {event.user}</p>
            {event.context && (
              <p className="text-xs text-muted-foreground mt-1">
                Formulário: {event.context}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function formatAction(action: string) {
  switch (action) {
    case "FORM_CREATED":
      return "Formulário Criado";
    case "FORM_UPDATED":
      return "Atualização Realizada";
    case "PHOTO_DELETED":
      return "Foto Removida";
    case "FORM_SUBMITTED":
      return "Formulário Submetido";
    default:
      return action;
  }
}
