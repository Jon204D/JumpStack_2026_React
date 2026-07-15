import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.scss";

type Variant = "primary" | "secondary";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
};

type ButtonLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  children: ReactNode;
  href: string;
  variant?: Variant;
};

const classes = (variant: Variant, className?: string) =>
  [styles.button, styles[variant], className].filter(Boolean).join(" ");

export function Button({
  children,
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button className={classes(variant, className)} type={type} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  className,
  href,
  variant = "primary",
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={classes(variant, className)} href={href} {...props}>
      {children}
    </Link>
  );
}
