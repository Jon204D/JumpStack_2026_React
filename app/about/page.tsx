import { SiteHeader } from "@/components/layout/SiteHeader";
import { ButtonLink } from "@/components/ui/Button";
import styles from "../public-page.module.scss";

const principles = [
  {
    number: "01",
    title: "Clarity before complexity",
    copy: "Balances, ownership, and account activity should be easy to understand before a customer takes action.",
  },
  {
    number: "02",
    title: "Access with purpose",
    copy: "Customer and administrator experiences stay distinct through authenticated, role-aware permissions.",
  },
  {
    number: "03",
    title: "Confidence in every movement",
    copy: "Deposits, withdrawals, and transfers include validation and clear feedback at each step.",
  },
] as const;

export default function AboutPage() {
  return (
    <main>
      <SiteHeader />
      <section className={styles.hero} aria-labelledby="about-title">
        <p className={styles.eyebrow}>About Ledger Atlas</p>
        <h1 id="about-title">Banking software should feel understandable.</h1>
        <p>
          Ledger Atlas is a full-stack banking experience built to demonstrate
          secure REST APIs, MongoDB persistence, role-based access, and a calm
          interface for everyday account management.
        </p>
      </section>

      <section className={styles.story} aria-labelledby="story-title">
        <div>
          <p className={styles.eyebrow}>Our approach</p>
          <h2 id="story-title">One system. Two focused experiences.</h2>
        </div>
        <p>
          Customers can review their own accounts and move money. Administrators
          can onboard customers, open accounts, and oversee bank activity. JWT
          authentication and ownership checks keep those responsibilities in the
          right hands.
        </p>
      </section>

      <section className={styles.cards} aria-label="Product principles">
        {principles.map((principle) => (
          <article key={principle.number}>
            <span>{principle.number}</span>
            <h2>{principle.title}</h2>
            <p>{principle.copy}</p>
          </article>
        ))}
      </section>

      <section className={styles.cta}>
        <div>
          <p className={styles.eyebrow}>Ready when you are</p>
          <h2>Open your secure banking workspace.</h2>
        </div>
        <ButtonLink href="/login">Sign in securely</ButtonLink>
      </section>
    </main>
  );
}
