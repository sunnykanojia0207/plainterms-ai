import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "tertiary" | "destructive";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover disabled:bg-neutral disabled:text-white",
  secondary: "border border-border bg-surface text-text-primary hover:border-text-secondary",
  tertiary: "text-accent hover:bg-accent/10",
  destructive: "bg-critical text-white hover:brightness-110",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-base",
  lg: "h-12 px-6 text-base",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: Variant;
  readonly size?: Size;
  readonly loading?: boolean;
  readonly href?: undefined;
  readonly type?: "button" | "submit" | "reset";
}

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  readonly variant?: Variant;
  readonly size?: Size;
  readonly loading?: undefined;
  readonly href: string;
}

export type PlainButtonProps = ButtonProps | LinkButtonProps;

function isLink(props: PlainButtonProps): props is LinkButtonProps {
  return typeof props.href === "string";
}

/**
 * Foundation button. Renders a <button> or, when `href` is given, an <a>.
 * Loading sets aria-busy and blocks interaction.
 */
export function Button(props: PlainButtonProps) {
  const { variant = "primary", size = "md", className, children } = props;
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium",
    "transition-colors disabled:cursor-not-allowed disabled:opacity-60",
    "min-h-[44px] sm:min-h-0",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  );

  if (isLink(props)) {
    return (
      <a
        href={props.href}
        className={classes}
        onClick={props.onClick}
        target={props.target}
        rel={props.rel}
        title={props.title}
      >
        {children}
      </a>
    );
  }

  const loading = props.loading === true;
  const disabled = props.disabled === true || loading;
  return (
    <button
      type={props.type ?? "button"}
      className={classes}
      disabled={disabled}
      aria-busy={loading || undefined}
      onClick={props.onClick}
      onKeyDown={props.onKeyDown}
      name={props.name}
      value={props.value}
      title={props.title}
    >
      {loading === true ? (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : null}
      {children}
    </button>
  );
}
