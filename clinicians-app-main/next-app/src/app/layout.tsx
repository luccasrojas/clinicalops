import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ClerkProvider } from "@clerk/nextjs";

import { esUY } from "@clerk/localizations";
import { Toaster } from "@/components/ui/sonner";

import { NuqsAdapter } from "nuqs/adapters/next";
import UserStorer from "@/components/user-storer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prartis",
  description: "Notas clínicas asistidas por IA para profesionales de la salud",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NuqsAdapter>
      <html
        lang="en"
        // very cool
        // className="dark"
      >
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ClerkProvider localization={esUY}>
            <Providers>
              <UserStorer />
              {children}
            </Providers>
          </ClerkProvider>
          <Toaster />
        </body>
      </html>
    </NuqsAdapter>
  );
}
