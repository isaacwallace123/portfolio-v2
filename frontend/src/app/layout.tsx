import type { Metadata } from "next";
import { ThemeProvider } from "@/shared/providers/ThemeProvider";
import { PageTransition } from "@/shared/ui/PageTransition";
import { Header } from "@/widgets/Header";
import { InteractiveGridBackground } from "@/shared/ui/InteractiveGridBackground";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

export const metadata: Metadata = {
  title: "Isaac Wallace - Portfolio",
  description: "Full-stack engineer specializing in scalable web applications",
};

const setInitialThemeScript = `
(function () {
  try {
    var t = localStorage.getItem("theme");
    var theme = (t === "light" || t === "dark") ? t : "dark";
    document.documentElement.classList.add(theme);
  } catch (e) {
    document.documentElement.classList.add("dark");
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: setInitialThemeScript }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <InteractiveGridBackground />
          <Header />
          <PageTransition>{children}</PageTransition>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}