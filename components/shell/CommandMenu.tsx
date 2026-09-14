"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";

interface CommandItem {
  readonly label: string;
  readonly hint: string;
  readonly href: string;
}

const COMMANDS: readonly CommandItem[] = [
  { label: "Home", hint: "Start or resume a review", href: "/" },
  { label: "Documents", hint: "Your contract library", href: "/documents" },
  { label: "Review", hint: "Read a document with guidance", href: "/documents" },
  { label: "Compare", hint: "Compare two versions", href: "/compare" },
  { label: "Ask", hint: "Ask about a document", href: "/ask" },
];

interface CommandMenuProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

/**
 * Quick command menu (Ctrl/⌘+K). Foundation lists routes; document-aware
 * commands arrive with later milestones.
 */
export function CommandMenu({ open, onClose }: CommandMenuProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Go to"
      description="Jump to a workspace. More commands arrive as features land."
    >
      {/* Remount on every open so the filter always starts empty. */}
      {open ? <MenuBody key="open" onNavigate={onClose} /> : null}
    </Dialog>
  );
}

function MenuBody({ onNavigate }: { readonly onNavigate: () => void }) {
  const [query, setQuery] = useState("");

  const matches = COMMANDS.filter((item) =>
    item.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-2">
      <Input
        label="Filter workspaces"
        placeholder="Type a workspace name…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <ul role="listbox" aria-label="Workspaces" className="flex flex-col">
        {matches.length === 0 ? (
          <li className="px-2 py-3 text-sm text-secondary">No workspace matches “{query}”.</li>
        ) : (
          matches.map((item) => (
            <li key={item.href + item.label}>
              <a
                href={item.href}
                role="option"
                aria-selected="false"
                onClick={onNavigate}
                className="flex flex-col gap-0.5 rounded-md px-3 py-2.5 hover:bg-surface-muted"
              >
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-xs text-secondary">{item.hint}</span>
              </a>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
