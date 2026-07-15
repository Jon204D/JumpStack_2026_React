import styles from "./FeatureCard.module.scss";

type FeatureCardProps = {
  description: string;
  icon: string;
  title: string;
};

export function FeatureCard({ description, icon, title }: FeatureCardProps) {
  return (
    <article className={styles.card}>
      <span className={styles.icon} aria-hidden="true">{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}
