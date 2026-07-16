import Link from "next/link";
import { ButtonLink } from "../ui/Button";
import styles from "./SiteHeader.module.scss";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/" aria-label="Ledger Atlas home">
        <span className={styles.mark} aria-hidden="true">LA</span>
        <span>Ledger Atlas</span>
      </Link>
      <nav className={styles.navigation} aria-label="Primary navigation">
        <Link href="/#capabilities">Capabilities</Link>
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
      </nav>
      <ButtonLink href="/login" variant="secondary">Sign in</ButtonLink>
    </header>
  );
}
