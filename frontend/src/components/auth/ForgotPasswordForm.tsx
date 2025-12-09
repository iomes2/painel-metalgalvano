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
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/icons/Logo";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (!email) {
      toast({
        title: "Erro",
        description: "Por favor, informe seu e-mail.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSubmitted(true);
      toast({
        title: "E-mail enviado",
        description: "Verifique sua caixa de entrada para redefinir a senha.",
      });
    } catch (error: any) {
      console.error("Forgot Password Error:", error);
      let errorMessage = "Erro ao enviar e-mail. Tente novamente.";
      if (error.code === "auth/user-not-found") {
        errorMessage = "Usuário não encontrado com este e-mail.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "E-mail inválido.";
      }
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="items-center text-center">
          <Logo className="mb-4" />
          <CardTitle className="text-2xl">Verifique seu e-mail</CardTitle>
          <CardDescription>
            Enviamos um link de recuperação para <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Clique no link enviado para cadastrar uma nova senha. Se não
            encontrar, verifique a caixa de spam.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/login">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="items-center text-center">
        <Logo className="mb-4" />
        <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
        <CardDescription>
          Informe o e-mail cadastrado para receber o link de redefinição.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Enviando..." : "Enviar Link"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Login
        </Link>
      </CardFooter>
    </Card>
  );
}
