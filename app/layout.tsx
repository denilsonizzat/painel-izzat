import type { Metadata } from "next";
import { Manrope, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import ToastContainer from "@/components/Toast";
import FloatingOnlineButton from "@/components/FloatingOnlineButton";
import FloatingThemeButton from "@/components/FloatingThemeButton";
import FloatingPomodoro from "@/components/FloatingPomodoro";
import FloatingCalculator from "@/components/FloatingCalculator";
import ThemeApplier from "@/components/ThemeApplier";
import Onboarding from "@/components/Onboarding";
import CheckInDiario from "@/components/CheckInDiario";
import SnapshotSync from "@/components/SnapshotSync";
import PWARegister from "@/components/PWARegister";
import NotificadorDiario from "@/components/NotificadorDiario";
import TipLayer from "@/components/TipLayer";

// Corpo: Manrope (mesma do BIG APP). Títulos/display: Bricolage Grotesque.
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Painel Izzat Group",
  description: "Gestão de equipe e lojas — Izzat Group",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/lojas/izzat-group.png" }],
  },
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
    <html lang="pt-BR" className={`h-full ${manrope.variable} ${bricolage.variable}`}>
      <body className="min-h-full">
        <ThemeApplier />
        {children}
        <FloatingOnlineButton />
        <FloatingThemeButton />
        <FloatingPomodoro />
        <FloatingCalculator />
        <Onboarding />
        <CheckInDiario />
        <ToastContainer />
        <SnapshotSync />
        <PWARegister />
        <NotificadorDiario />
        <TipLayer />
      </body>
    </html>
  );
}
