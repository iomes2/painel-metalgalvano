"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [idGerente, setIdGerente] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const constructEmail = (id: string) => `${id}@gmail.com`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idGerente) {
      toast({
        title: "Erro",
        description: "ID Gerente é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const email = constructEmail(idGerente);
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Email enviado",
        description: `Email de recuperação enviado para ${email}`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erro ao enviar",
        description: err.message || "Falha ao enviar email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Recuperar Senha</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="idGerente">ID Gerente</Label>
              <Input
                id="idGerente"
                value={idGerente}
                onChange={(e) => setIdGerente(e.target.value)}
                placeholder="Ex: MG001"
              />
            </div>
            <div className="flex justify-between items-center">
              <Link href="/login" className="text-sm text-muted-foreground">
                Voltar ao login
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? "Enviando..." : "Enviar email"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Se não receber o email, verifique se o ID do gerente está correto ou
          contate o suporte.
        </CardFooter>
      </Card>
    </div>
  );
}
