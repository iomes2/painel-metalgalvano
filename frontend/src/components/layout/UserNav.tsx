"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Generate consistent color based on string
function stringToColor(str: string): string {
  const colors = [
    "#0ea5e9", // sky
    "#64748b", // slate
    "#22c55e", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#14b8a6", // teal
    "#06b6d4", // cyan
    "#3b82f6", // blue
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function UserNav() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("firebase_token");
        localStorage.removeItem("firebase_token_expiry");
      }

      await signOut(auth);
      toast({
        title: "Saída Efetuada",
        description: "Você foi desconectado com sucesso.",
      });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        title: "Erro",
        description: "Falha ao sair. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return null;
  }

  const getInitials = (email: string | null | undefined) => {
    if (!email) return "ID";
    const idPart = email.split("@")[0];
    return idPart.substring(0, 2).toUpperCase();
  };

  let primaryDisplayName = "Gerente";
  let secondaryInfoLine = user.email || "Informação indisponível";

  if (user.email) {
    const emailParts = user.email.split("@");
    const idPart = emailParts[0];
    const domainPart = emailParts.length > 1 ? emailParts[1] : "";

    if (domainPart === "gmail.com") {
      primaryDisplayName = user.displayName || idPart;
      secondaryInfoLine = `ID Gerente: ${idPart}`;
    } else {
      primaryDisplayName = user.displayName || user.email;
      secondaryInfoLine = user.email;
    }
  } else if (user.displayName) {
    primaryDisplayName = user.displayName;
    secondaryInfoLine = "Email não disponível";
  }

  const initials = getInitials(user.email);
  const avatarColor = stringToColor(user.email || "default");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 sm:h-11 px-2 sm:px-3 rounded-xl bg-muted/50 hover:bg-primary/10 transition-all gap-2"
        >
          {/* Avatar with initials */}
          <div
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm"
            style={{ backgroundColor: avatarColor }}
          >
            {initials}
          </div>

          {/* Name - hidden on mobile */}
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-sm font-medium leading-tight truncate max-w-[100px]">
              {primaryDisplayName.split(" ")[0]}
            </span>
          </div>

          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: avatarColor }}
            >
              {initials}
            </div>
            <div className="flex flex-col space-y-0.5">
              <p className="text-sm font-semibold leading-none">
                {primaryDisplayName}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {secondaryInfoLine}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
