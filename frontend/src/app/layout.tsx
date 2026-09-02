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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (window.__ismsGtPatched) return;
                  if (typeof Node !== 'function' || !Node.prototype) return;
                  window.__ismsGtPatched = true;
                  var origRemoveChild = Node.prototype.removeChild;
                  Node.prototype.removeChild = function(child) {
                    if (child.parentNode !== this) return child;
                    return origRemoveChild.apply(this, arguments);
                  };
                  var origInsertBefore = Node.prototype.insertBefore;
                  Node.prototype.insertBefore = function(newNode, refNode) {
                    if (refNode && refNode.parentNode !== this) return newNode;
                    return origInsertBefore.apply(this, arguments);
                  };
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.googleTranslateElementInit = function () {
                var host = document.getElementById('google_translate_element');
                if (!host || host.getAttribute('data-isms-gt') === '1') return;
                if (!window.google || !window.google.translate || !window.google.translate.TranslateElement) return;
                host.setAttribute('data-isms-gt', '1');
                new window.google.translate.TranslateElement({
                  pageLanguage: 'en',
                  includedLanguages: 'en,am,om',
                  autoDisplay: false
                }, 'google_translate_element');
              };
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
          aria-label="Select language"
        />
        <ThemeProvider>
          <LangProvider>
            <AppProvider>{children}</AppProvider>
          </LangProvider>
        </ThemeProvider>
        <GoogleTranslate />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                if (document.getElementById('isms-gt-element-js')) return;
                var s = document.createElement('script');
                s.id = 'isms-gt-element-js';
                s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
                s.async = true;
                document.body.appendChild(s);
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
