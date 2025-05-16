
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Building } from 'lucide-react';
import Logo from '@/components/icons/Logo';

export function LoginForm() {
  const [idGerente, setIdGerente] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Firebase typically uses email for username. We'll construct an email from id_gerente.
  // IMPORTANT: Ensure your Firebase project is configured to accept these kinds of emails,
  // or adjust your authentication strategy (e.g., custom claims, Firestore user lookup).
  // For this example, we assume id_gerente can be part of an email like id_gerente@metalgalvano.com
  const constructEmail = (id: string) => `${id}@metalgalvano.forms`;


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (!idGerente || !password) {
      toast({
        title: "Erro",
        description: "ID Gerente e Senha são obrigatórios.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    
    const email = constructEmail(idGerente);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Sucesso",
        description: "Login realizado com sucesso!",
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Firebase Auth Error:", error);
      let errorMessage = "Falha no login. Verifique suas credenciais.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "ID Gerente ou Senha inválidos.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "O formato do ID Gerente está incorreto.";
      }
      toast({
        title: "Falha no Login",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="items-center text-center">
        <Logo className="mb-4" />
        <CardTitle className="text-2xl">Login do Gerente</CardTitle>
        <CardDescription>Insira suas credenciais para acessar o painel de formulários.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="id_gerente">ID Gerente</Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                id="id_gerente" 
                type="text" 
                placeholder="Ex: MG001" 
                value={idGerente}
                onChange={(e) => setIdGerente(e.target.value)}
                required 
                className="pl-10"
                aria-label="ID Gerente"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className="pr-10"
                aria-label="Senha"
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-center text-sm text-muted-foreground">
        <p>Entre em contato com o suporte se tiver problemas para fazer login.</p>
      </CardFooter>
    </Card>
  );
}
