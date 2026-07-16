import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import styles from "../public-page.module.scss";

export default function ContactPage() {
  return (
    <main>
      <SiteHeader />
      <section className={styles.hero} aria-labelledby="contact-title">
        <p className={styles.eyebrow}>Contact us</p>
        <h1 id="contact-title">Questions deserve a clear next step.</h1>
        <p>
          Reach the right team for account access, product questions, or help
          understanding a recent banking action.
        </p>
      </section>

      <section className={styles.contactGrid} aria-label="Contact options">
        <article>
          <span aria-hidden="true">01</span>
          <h2>Account support</h2>
          <p>
            If you cannot sign in or believe your access is incorrect, contact
            your bank administrator. Passwords cannot be viewed or recovered.
          </p>
          <Link href="/login">Return to secure sign in →</Link>
        </article>
        <article>
          <span aria-hidden="true">02</span>
          <h2>General questions</h2>
          <p>
            For project or product questions, send a note and include enough
            context for the team to route it correctly.
          </p>
          <a href="mailto:support@ledgeratlas.example">
            support@ledgeratlas.example →
          </a>
        </article>
        <article>
          <span aria-hidden="true">03</span>
          <h2>Security concerns</h2>
          <p>
            Do not send passwords, access tokens, MongoDB credentials, or full
            account numbers through email.
          </p>
          <a href="mailto:security@ledgeratlas.example">
            security@ledgeratlas.example →
          </a>
        </article>
      </section>

      <section className={styles.notice}>
        <strong>Demo project notice</strong>
        <p>
          Ledger Atlas is a JumpStack learning project, not a live financial
          institution. The email addresses above are placeholders for the
          future support workflow.
        </p>
      </section>
    </main>
  );
}
