import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import styles from './index.module.css';

const checklist = [
  'Choose the SDK for the fastest React Native integration path.',
  'Choose the API docs when you need direct HTTP-level control.',
  'Exchange the MTN token before calling protected API routes.',
  'Use the Drive guide for file and folder lifecycle endpoints.',
  'Use the Photo Backup guide for device registration and media retrieval.',
  'Use managed uploads for resumable drive and photo-backup workflows.',
];

const Checklist = () => (
  <ul className={styles.checklist}>
    {checklist.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
);

export default function Home(): ReactNode {
  return (
    <Layout
      title="MTN Drive Documentation"
      description="Partner onboarding and reference docs for the MTN Drive SDK and API."
    >
      <main className={styles.main}>
        <section className={styles.hero}>
          <span className={styles.eyebrow}>Partner Documentation</span>
          <h1>MTN Drive SDK and API Documentation</h1>
          <p>
            One portal for the React Native SDK and the direct API. Start with the SDK
            if you want the managed integration path, or use the API docs when you need
            HTTP-level control over authentication, drive operations, photo backup,
            and upload orchestration.
          </p>
          <div className={styles.actions}>
            <Link className="button button--primary button--lg" to="/sdk/quickstart-react-native">
              Open SDK Docs
            </Link>
            <Link className="button button--secondary button--lg" to="/api/overview">
              Open API Docs
            </Link>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.card}>
            <h2>SDK Track</h2>
            <p>
              Use the SDK docs for React Native onboarding, adapter contracts, typed SDK
              errors, and the default managed upload task flow.
            </p>
            <div className={styles.cardActions}>
              <Link className="button button--outline button--primary" to="/sdk/overview">
                SDK Overview
              </Link>
              <Link className="button button--outline button--secondary" to="/sdk/quickstart-react-native">
                Quickstart
              </Link>
            </div>
          </div>

          <div className={styles.card}>
            <h2>API Track</h2>
            <p>
              Use the API docs for MTN token exchange, bearer-token request patterns,
              drive item lifecycle routes, photo-backup media flows, and managed upload
              session orchestration.
            </p>
            <div className={styles.cardActions}>
              <Link className="button button--outline button--primary" to="/api/overview">
                API Overview
              </Link>
              <Link className="button button--outline button--secondary" to="/api/authentication">
                Authentication
              </Link>
              <Link className="button button--outline button--secondary" to="/api/drive">
                Drive
              </Link>
              <Link className="button button--outline button--secondary" to="/api/photo-backup">
                Photo Backup
              </Link>
              <Link className="button button--outline button--secondary" to="/api/managed-uploads">
                Managed Uploads
              </Link>
            </div>
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
