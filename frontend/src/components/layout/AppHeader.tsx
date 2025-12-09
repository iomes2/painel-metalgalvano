"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Logo from "@/components/icons/Logo";
import { UserNav } from "@/components/layout/UserNav";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Menu,
  Bell,
  Check,
  Info,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  AppNotification,
} from "@/lib/api-client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export function AppHeader() {
  const { toggleSidebar } = useSidebar();
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Ref to track previous notifications for diffing
  const prevNotificationsRef = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  // Sound effect (soft bubble pop)
  const playNotificationSound = () => {
    try {
      // Soft water drop sound
      const audio = new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3"
      );
      audio.volume = 0.2; // Baixo e suave
      audio.play().catch((err) => {
        // Ignora erro de autoplay (interação do usuário necessária)
        console.warn("Audio play blocked (user interaction needed):", err);
      });
    } catch (e) {
      console.error("Audio init failed", e);
    }
  };

  // Ref to track consecutive errors
  const errorCountRef = useRef(0);
  const MAX_ERRORS = 3;

  // Ref to track if a request is already in progress
  const isRequestingRef = useRef(false);

  // Wrap in useCallback to keep reference stable
  const loadNotifications = useCallback(async () => {
    // Stop polling if:
    // 1. No user
    // 2. Too many errors (backoff)
    // 3. Request already in progress (prevent overlap)
    if (
      !user ||
      errorCountRef.current >= MAX_ERRORS ||
      isRequestingRef.current
    ) {
      return;
    }

    isRequestingRef.current = true;
    setLoading(true);

    try {
      const data = await fetchNotifications();
      // Reset error count on success
      errorCountRef.current = 0;

      // Sort by date desc
      const sorted = data.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setNotifications(sorted);
      setUnreadCount(sorted.filter((n) => !n.read).length);

      // Check for new notifications
      if (!isFirstLoad.current) {
        const currentIds = new Set(sorted.map((n) => n.id));
        // Find new IDs that weren't in the previous set
        const newItems = sorted.filter(
          (n) => !prevNotificationsRef.current.has(n.id)
        );

        if (newItems.length > 0) {
          playNotificationSound();
          newItems.forEach((item) => {
            toast({
              title: item.title,
              description: item.message,
              action: item.link ? (
                <Link
                  href={item.link}
                  onClick={() => {
                    // Optional: mark as read logic here if desired
                  }}
                >
                  <Button variant="outline" size="sm">
                    Ver
                  </Button>
                </Link>
              ) : undefined,
            });
          });
        }
        prevNotificationsRef.current = currentIds;
      } else {
        // Initial load just populates the ref
        prevNotificationsRef.current = new Set(sorted.map((n) => n.id));
      }

      isFirstLoad.current = false;
    } catch (error) {
      console.error("Failed to load notifications", error);
      errorCountRef.current += 1;
    } finally {
      setLoading(false);
      isRequestingRef.current = false;
    }
  }, [user, toast]); // Dependencies stable
  useEffect(() => {
    // Reset errors when user changes (login/logout)
    errorCountRef.current = 0;
    loadNotifications();

    // Polling every 60 seconds (background sync)
    const interval = setInterval(() => {
      loadNotifications();
    }, 60000);

    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Reset error count when opening the popover to retry
  useEffect(() => {
    if (isOpen) {
      errorCountRef.current = 0;
      loadNotifications();
    }
  }, [isOpen]);

  const handleManualRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    loadNotifications();
  };

  const handleMarkAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await markNotificationAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await markAllNotificationsAsRead();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "ERROR":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full print:hidden safe-area-inset-top p-3">
      {/* Floating header container - matching sidebar spacing */}
      <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg shadow-black/5">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5 pointer-events-none" />

        <div className="relative flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
          {/* Left side - Menu + Logo */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Custom sidebar trigger for mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="md:hidden h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Logo - hidden on mobile since we have the sidebar logo */}
            <Link
              href="/dashboard"
              aria-label="Ir para o painel"
              className="hidden sm:flex items-center gap-2"
            >
              <Logo
                textColor="hsl(var(--foreground))"
                iconColor="hsl(var(--primary))"
              />
            </Link>

            {/* Mobile title */}
            <div className="sm:hidden">
              <span className="text-sm font-bold bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
                Metalgalvano
              </span>
            </div>
          </div>

          {/* Center - Badge */}
          <div className="hidden lg:flex items-center">
            <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
              <span className="text-xs font-medium text-muted-foreground">
                Sistema de Formulários
              </span>
            </div>
          </div>

          {/* Right side - Actions + User */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notifications Popover */}
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all relative"
                  aria-label="Notificações"
                >
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  {/* Notification dot */}
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-cyan-500 animate-pulse border-2 border-white dark:border-slate-800" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 sm:w-96 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">Notificações</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full"
                      onClick={handleManualRefresh}
                      title="Atualizar agora"
                      disabled={loading}
                    >
                      <span className={loading ? "animate-spin" : ""}>↻</span>
                    </Button>
                  </div>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-auto py-1 px-2"
                      onClick={handleMarkAllAsRead}
                    >
                      Ler todas
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-[300px]">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground space-y-2">
                      <Bell className="h-8 w-8 opacity-20" />
                      <p className="text-sm">Nenhuma notificação</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 hover:bg-muted/50 transition-colors relative group ${
                            !notification.read
                              ? "bg-muted/20"
                              : "opacity-60 bg-transparent"
                          }`}
                        >
                          <div className="flex gap-3 items-start">
                            <div
                              className={`mt-0.5 rounded-full p-1.5 bg-background border shadow-sm shrink-0`}
                            >
                              {getIcon(notification.type)}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <p
                                  className={`text-sm ${
                                    !notification.read
                                      ? "font-semibold"
                                      : "font-normal"
                                  }`}
                                >
                                  {notification.title}
                                </p>
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                  {formatDistanceToNow(
                                    new Date(notification.createdAt),
                                    { addSuffix: true, locale: ptBR }
                                  )}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {notification.message}
                              </p>
                              {notification.link && (
                                <Link
                                  href={notification.link}
                                  className="inline-block mt-2 text-xs text-primary hover:underline font-medium"
                                  onClick={() => setIsOpen(false)}
                                >
                                  Ver detalhes
                                </Link>
                              )}
                            </div>
                            {!notification.read ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                                title="Marcar como lida"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            ) : (
                              <div
                                className="absolute right-4 top-4 text-muted-foreground/30"
                                title="Lida"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          {!notification.read && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500/50" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            {/* User nav */}
            <UserNav />
          </div>
        </div>
      </div>
    </header>
  );
}
