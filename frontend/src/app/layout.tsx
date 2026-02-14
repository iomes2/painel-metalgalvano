import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthInitializer } from "@/components/auth/AuthInitializer";
import "@/lib/dev-logger";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Metalgalvano Formulários",
  description:
    "Formulários dinâmicos para processos de construção da Metalgalvano.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress Hot Refresh logs immediately
              const originalLog = console.log;
              const originalWarn = console.warn;
              const fastRefreshPattern = /\\[Fast Refresh\\]|hot-reloader-client|done in \\d+ms/i;
              
              console.log = function(...args) {
                const msg = (args[0] || '').toString();
                if (!fastRefreshPattern.test(msg)) {
                  originalLog.apply(console, args);
                }
              };
              
              console.warn = function(...args) {
                const msg = (args[0] || '').toString();
                if (!fastRefreshPattern.test(msg)) {
                  originalWarn.apply(console, args);
                }
              };
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthInitializer>{children}</AuthInitializer>
      </body>
    </html>
  );
}
