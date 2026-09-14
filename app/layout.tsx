import type { Metadata, Viewport } from "next";
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
  openGraph: {
    type: "website",
    siteName: "PlainTerms",
    locale: "en_US",
    title: "PlainTerms — Know what you're signing",
    description:
      "PlainTerms helps freelancers understand client contracts in plain language, with every claim traced to its source clause.",
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF7F2" },
    { media: "(prefers-color-scheme: dark)", color: "#16181D" },
  ],
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
            className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8"
          >
            {children}
          </main>
          <footer className="border-t border-subtle">
            <p className="mx-auto max-w-[1440px] px-4 py-3 text-xs text-tertiary sm:px-6 lg:px-8">
              {NOT_LEGAL_ADVICE_NOTICE}
            </p>
          </footer>
        </AppProviders>
      </body>
    </html>
  );
}
