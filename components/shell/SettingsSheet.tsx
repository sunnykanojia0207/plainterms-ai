"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { Drawer } from "@/components/ui/Drawer";
import { Select } from "@/components/ui/Select";
import { Text } from "@/components/ui/Text";
import { useToast } from "@/components/ui/Toast";
import { useTheme } from "@/components/shell/providers";
import type { Theme } from "@/components/shell/providers";
import { clearUserDocuments } from "@/lib/documents/store";
import { RETENTION_COPY } from "@/lib/privacy/retention";
import type { RetentionChoice } from "@/lib/privacy/retention";
import { NOT_LEGAL_ADVICE_NOTICE } from "@/lib/domain/vocabulary";

interface SettingsSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

/**
 * Lightweight settings sheet (not a route): text size, theme, retention,
 * AI preferences, about. AI capabilities arrive in later milestones —
 * preferences here shape future behavior only.
 */
export function SettingsSheet({ open, onClose }: SettingsSheetProps) {
  const { theme, setTheme } = useTheme();
  const { notify } = useToast();
  const [textSize, setTextSize] = useState<"standard" | "large">("standard");
  const [retention, setRetention] = useState<RetentionChoice>("session-only");
  const [verbosity, setVerbosity] = useState<"concise" | "detailed">("concise");

  // Large text scales the root font size so all rem-based type grows.
  useEffect(() => {
    document.documentElement.style.fontSize = textSize === "large" ? "18px" : "";
  }, [textSize]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Settings"
      description="Preferences for reading and privacy. Nothing here affects your documents."
    >
      <div className="flex flex-col gap-6">
        <section aria-label="Reading">
          <Select
            label="Text size"
            value={textSize}
            onChange={(event) => setTextSize(event.target.value === "large" ? "large" : "standard")}
            options={[
              { value: "standard", label: "Standard" },
              { value: "large", label: "Large (easier reading)" },
            ]}
          />
          <div className="mt-4">
            <Select
              label="Theme"
              value={theme}
              onChange={(event) => {
                const next: Theme = event.target.value === "dark" ? "dark" : "light";
                setTheme(next);
              }}
              options={[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
            />
          </div>
          <p className="mt-2 text-sm text-text-secondary">
            {textSize === "large" ? "Large text is on for this session." : "Standard text size."}
          </p>
        </section>

        <Divider />

        <section aria-label="Privacy" className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Document retention</h3>
          <Select
            label="How long should uploads be kept?"
            value={retention}
            onChange={(event) =>
              setRetention(event.target.value === "saved" ? "saved" : "session-only")
            }
            options={[
              { value: "session-only", label: RETENTION_COPY["session-only"] },
              { value: "saved", label: RETENTION_COPY.saved },
            ]}
          />
          <Button
            variant="tertiary"
            size="sm"
            onClick={() => {
              const removed = clearUserDocuments();
              notify(
                removed === 0
                  ? "Nothing to delete — only sample documents remain."
                  : `Deleted ${removed} uploaded ${removed === 1 ? "document" : "documents"}. Samples were kept.`,
              );
              onClose();
            }}
          >
            Delete my documents
          </Button>
          <Text tone="secondary" className="text-sm">
            Document content is never used for analytics and never appears in logs.
          </Text>
        </section>

        <Divider />

        <section aria-label="AI preferences" className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">AI preferences</h3>
          <Select
            label="Answer style for future AI features"
            value={verbosity}
            onChange={(event) =>
              setVerbosity(event.target.value === "detailed" ? "detailed" : "concise")
            }
            options={[
              { value: "concise", label: "Concise" },
              { value: "detailed", label: "Detailed" },
            ]}
          />
        </section>

        <Divider />

        <section aria-label="About" className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">About PlainTerms</h3>
          <Text tone="secondary" className="text-sm">
            {NOT_LEGAL_ADVICE_NOTICE}
          </Text>
          <Text tone="secondary" className="text-sm">
            Foundation build v0.1.0 — document intelligence arrives in later milestones.
          </Text>
        </section>
      </div>
    </Drawer>
  );
}
