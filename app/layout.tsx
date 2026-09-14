import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/shell/providers";
import { TopNav } from "@/components/shell/TopNav";
import { NOT_LEGAL_ADVICE_NOTICE } from "@/lib/domain/vocabulary";

export const metadata: Metadata = {
  title: {
    default: "PlainTerms — Know what you're signing",
    template: "%s · PlainTerms",
  },
  description:
    "PlainTerms helps freelancers understand client contracts in plain language, with every claim traced to its source clause.",
};

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col font-ui antialiased">
        <AppProviders>
          <TopNav />
          <main
            id="main-content"
            tabIndex={-1}
            className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 outline-none sm:px-6"
          >
            {children}
          </main>
          <footer className="border-t border-border">
            <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-text-secondary sm:px-6">
              {NOT_LEGAL_ADVICE_NOTICE}
            </p>
          </footer>
        </AppProviders>
      </body>
    </html>
  );
}
