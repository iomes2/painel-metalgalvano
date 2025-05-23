
"use client";

import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/components/auth/AuthInitializer';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function UserNav() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Saída Efetuada", description: "Você foi desconectado com sucesso." });
      router.push('/login');
    } catch (error) {
      console.error("Logout failed:", error);
      toast({ title: "Erro", description: "Falha ao sair. Por favor, tente novamente.", variant: "destructive" });
    }
  };

  if (!user) {
    return null; 
  }
  
  const getInitials = (email: string | null | undefined) => {
    if (!email) return "ID";
    // Assuming email is like "MG001@metalgalvano.forms", extract "MG001"
    const idPart = email.split('@')[0];
    return idPart.substring(0, 2).toUpperCase();
  };

  let primaryDisplayName = "Gerente";
  let secondaryInfoLine = user.email || "Informação indisponível";

  if (user.email) {
    const emailParts = user.email.split('@');
    const idPart = emailParts[0];
    const domainPart = emailParts.length > 1 ? emailParts[1] : "";

    if (domainPart === 'metalgalvano.forms') {
      // Use displayName if set, otherwise the id_gerente (idPart)
      primaryDisplayName = user.displayName || idPart; 
      secondaryInfoLine = `ID Gerente: ${idPart}`;
    } else {
      // For other email types or if displayName is set
      primaryDisplayName = user.displayName || user.email; 
      secondaryInfoLine = user.email;
    }
  } else if (user.displayName) {
    primaryDisplayName = user.displayName;
    secondaryInfoLine = "Email não disponível"; // Or some other placeholder
  }


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-primary">
            <AvatarImage src={user.photoURL || `https://placehold.co/40x40.png`} alt={primaryDisplayName} data-ai-hint="avatar person" />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {getInitials(user.email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {primaryDisplayName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {secondaryInfoLine}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem disabled>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

