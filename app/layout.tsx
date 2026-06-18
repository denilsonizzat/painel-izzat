import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ToastContainer from "@/components/Toast";
import FloatingOnlineButton from "@/components/FloatingOnlineButton";
import FloatingThemeButton from "@/components/FloatingThemeButton";
import FloatingPomodoro from "@/components/FloatingPomodoro";
import ThemeApplier from "@/components/ThemeApplier";
import Onboarding from "@/components/Onboarding";
import CheckInDiario from "@/components/CheckInDiario";
import SnapshotSync from "@/components/SnapshotSync";
import PWARegister from "@/components/PWARegister";
import NotificadorDiario from "@/components/NotificadorDiario";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Painel Izzat Group",
  description: "Gestão de equipe e lojas — Izzat Group",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Izzat",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`h-full ${inter.variable}`}>
      <body className="min-h-full">
        <ThemeApplier />
        {children}
        <FloatingOnlineButton />
        <FloatingThemeButton />
        <FloatingPomodoro />
        <Onboarding />
        <CheckInDiario />
        <ToastContainer />
        <SnapshotSync />
        <PWARegister />
        <NotificadorDiario />
      </body>
    </html>
  );
}
