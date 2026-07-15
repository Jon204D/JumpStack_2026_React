import { FeatureCard } from "@/components/landing/FeatureCard";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ButtonLink } from "@/components/ui/Button";
import styles from "./page.module.scss";

const features = [
  {
    icon: "01",
    title: "See the full picture",
    description:
      "Review checking and savings balances together, with the account details that matter close at hand.",
  },
  {
    icon: "02",
    title: "Move money confidently",
    description:
      "Deposit, withdraw, and transfer with clear confirmations and safeguards for every action.",
  },
  {
    icon: "03",
    title: "Built for every role",
    description:
      "Customers focus on their own accounts while administrators manage customers and account access.",
  },
] as const;

export default function Home() {
  return (
    <main>
      <SiteHeader />

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>A clearer way to bank</p>
          <h1 id="hero-title">Your money, mapped with confidence.</h1>
          <p className={styles.heroCopy}>
            Ledger Atlas brings everyday banking into one calm, secure
            workspace—so balances, transfers, and account activity always make
            sense.
          </p>
          <div className={styles.heroActions}>
            <ButtonLink href="/login">Sign in securely</ButtonLink>
            <ButtonLink href="#security" variant="secondary">
              How we protect you
            </ButtonLink>
          </div>
          <ul className={styles.trustList} aria-label="Product benefits">
            <li>Clear account ownership</li>
            <li>Role-based access</li>
            <li>Transaction safeguards</li>
          </ul>
        </div>

        <div className={styles.preview} aria-label="Example banking overview">
          <div className={styles.previewTopline}>
            <div>
              <span className={styles.previewLabel}>Available balance</span>
              <strong>$14,550.33</strong>
            </div>
            <span className={styles.status}>Accounts healthy</span>
          </div>

          <div className={styles.accountList}>
            <article className={styles.accountCard}>
              <span>Everyday checking</span>
              <strong>$2,450.33</strong>
              <small>CHK • 100001</small>
            </article>
            <article className={`${styles.accountCard} ${styles.savingsCard}`}>
              <span>Growth savings</span>
              <strong>$12,100.00</strong>
              <small>SAV • 100001</small>
            </article>
          </div>

          <div className={styles.activityRow}>
            <span className={styles.activityIcon} aria-hidden="true">
              ↗
            </span>
            <div>
              <strong>Transfer completed</strong>
              <span>Checking to savings</span>
            </div>
            <strong className={styles.activityAmount}>$200.00</strong>
          </div>
        </div>
      </section>

      <section
        className={styles.capabilities}
        id="capabilities"
        aria-labelledby="capabilities-title"
      >
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Everyday banking, simplified</p>
          <h2 id="capabilities-title">Everything important. Nothing noisy.</h2>
          <p>
            A focused experience for understanding your accounts and acting on
            them without guesswork.
          </p>
        </div>
        <div className={styles.featureGrid}>
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      <section className={styles.security} id="security">
        <div className={styles.securityMark} aria-hidden="true">
          ✓
        </div>
        <div>
          <p className={styles.eyebrow}>Designed around trust</p>
          <h2>Access stays with the right person.</h2>
          <p>
            Role-aware permissions keep customer and administrator workflows
            distinct, while clear feedback explains when an action needs
            attention.
          </p>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>Ledger Atlas</span>
        <span>Console Bank App · JumpStack 2026</span>
      </footer>
    </main>
  );
}
