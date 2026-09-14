"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CommandMenu } from "@/components/shell/CommandMenu";
import { SettingsSheet } from "@/components/shell/SettingsSheet";
import { Drawer } from "@/components/ui/Drawer";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/documents", label: "Documents" },
  { href: "/review", label: "Review" },
  { href: "/compare", label: "Compare" },
  { href: "/ask", label: "Ask" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Application shell navigation: skip link, brand, 5 destinations, command menu, settings. */
export function TopNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setMenuOpen((open) => !open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-100 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-2 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-md text-secondary hover:bg-surface-muted lg:hidden"
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <span aria-hidden="true" className="text-xl">
              ☰
            </span>
          </button>
          <Link href="/" className="flex items-center gap-2" aria-label="PlainTerms home">
            <span
              aria-hidden="true"
              className="flex size-8 items-center justify-center rounded-md bg-accent text-base font-bold text-white"
            >
              P
            </span>
            <span className="text-[15px] font-semibold tracking-tight">PlainTerms</span>
          </Link>
          <nav aria-label="Primary" className="ml-6 hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition-colors duration-micro",
                  isActive(pathname, item.href)
                    ? "bg-accent-muted font-semibold text-accent shadow-[inset_0_-2px_0_var(--accent)]"
                    : "font-medium text-secondary hover:bg-surface-muted hover:text-primary",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open command menu"
              className="inline-flex size-11 items-center justify-center rounded-md text-secondary hover:bg-surface-muted sm:hidden"
            >
              <span aria-hidden="true" className="text-lg">
                ⌕
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="hidden h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-secondary hover:text-primary sm:inline-flex"
              aria-label="Open command menu"
            >
              <span aria-hidden="true">⌕</span>
              <span>Search or jump to…</span>
              <kbd className="rounded border border-border bg-surface-muted px-1.5 font-evidence text-xs">
                Ctrl K
              </kbd>
            </button>
            <IconButton label="Open settings" onClick={() => setSettingsOpen(true)}>
              <span aria-hidden="true" className="text-lg">
                ⚙
              </span>
            </IconButton>
          </div>
        </div>
      </header>

      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} title="PlainTerms" side="left">
        <nav aria-label="Mobile" className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-3 text-base font-medium",
                isActive(pathname, item.href)
                  ? "bg-accent-muted text-accent"
                  : "text-primary hover:bg-surface-muted",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Drawer>

      <CommandMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
