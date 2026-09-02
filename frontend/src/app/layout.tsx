import type { Metadata } from "next";
import { AppProvider } from "@/contexts/AppContext";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { LangProvider } from "@/components/i18n";
import GoogleTranslate from "@/components/i18n/GoogleTranslate";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ISMS Platform",
    template: "%s | ISMS Platform",
  },
  description: "Integrated Savings and Credit Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('isms-theme');
                  var theme = stored || 'system';
                  var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  document.documentElement.classList.remove('light');
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      {/* Extensions (e.g. Grammarly) inject attributes on <body> before hydrate. */}
      <body
        className="font-sans antialiased bg-surface text-slate-900 dark:bg-slate-950 dark:text-slate-100 min-h-screen"
        suppressHydrationWarning
      >
        <div
          id="google_translate_element"
          className="notranslate"
          suppressHydrationWarning
        />
        <ThemeProvider>
          <LangProvider>
            <AppProvider>{children}</AppProvider>
          </LangProvider>
        </ThemeProvider>
        <GoogleTranslate />
      </body>
    </html>
  );
}
