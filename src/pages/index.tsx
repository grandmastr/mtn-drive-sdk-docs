import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import styles from './index.module.css';

const Checklist = () => (
  <ul className={styles.checklist}>
    <li>Install <code>@pipeopshq/mtn-rn-sdk</code> from npm.</li>
    <li>Provide MTN access token from MTN app auth.</li>
    <li>Initialize the React Native SDK client.</li>
    <li>Use SDK modules for sessions, drive, sharing, backup, and storage.</li>
    <li>Handle typed SDK errors in your MTN app flow.</li>
  </ul>
);

export default function Home(): ReactNode {
  return (
    <Layout
      title="MTN Drive SDK"
      description="Private onboarding and reference docs for the MTN Drive SDK."
    >
      <main className={styles.main}>
        <section className={styles.hero}>
          <h1>MTN Drive SDK Documentation</h1>
          <p>SDK-first onboarding and integration guides.</p>
          <div className={styles.actions}>
            <Link className="button button--primary button--lg" to="/docs/quickstart-react-native">
              Start Quickstart
            </Link>
            <Link className="button button--secondary button--lg" to="/docs/overview">
              Browse Full Docs
            </Link>
          </div>
        </section>

        <section className={styles.card}>
          <h2>Quick Checklist</h2>
          <Checklist />
        </section>
      </main>
    </Layout>
  );
}
