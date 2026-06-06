import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { DataProvider } from "@/context/DataContext";
import { ToastProvider } from "@/context/ToastContext";
import { ClassroomSyncProvider } from "@/context/ClassroomSyncContext";
import Script from "next/script";

const sansFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const displayFont = Outfit({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "StudentFlow",
  description: "Manage subjects, assignments, exams, grades, attendance, study sessions, and access AI study support. The ultimate academic planner for college life.",
  keywords: ["college study planner", "gpa calculator", "attendance tracker", "pomodoro timer", "ai study assistant", "student flow", "assignment tracker"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sansFont.variable} ${monoFont.variable} ${displayFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-sky-500 selection:text-white">
        <DataProvider>
          <ToastProvider>
            <ClassroomSyncProvider>
              {children}
            </ClassroomSyncProvider>
          </ToastProvider>
        </DataProvider>
        <Script src="https://accounts.google.com/gsi/client" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
