import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <span className={styles.eyebrow}>Query</span>
        <section className={styles.hero}>
          <div className={styles.intro}>
            <h1>Ask questions from your PDFs.</h1>
            <p>Sign in to upload documents and start querying your store.</p>
            <div className={styles.actions}>
              <Link className={styles.primaryLink} href="/login">
                Login
              </Link>
              <Link className={styles.secondaryLink} href="/register">
                Register
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
