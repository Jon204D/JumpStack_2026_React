import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import styles from "./page.module.scss";

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <Link className={styles.brand} href="/" aria-label="Return to Ledger Atlas home">
        <span aria-hidden="true">LA</span>
        Ledger Atlas
      </Link>

      <section className={styles.panel} aria-labelledby="login-title">
        <div className={styles.intro}>
          <p>Secure banking access</p>
          <h1 id="login-title">Welcome back.</h1>
          <span>Use the credentials provided by your bank administrator.</span>
        </div>
        <LoginForm />
      </section>

      <p className={styles.help}>Having trouble signing in? Confirm the banking service is running, then try again.</p>
    </main>
  );
}
