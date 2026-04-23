"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, useLogin } from "@/lib/api";
import styles from "./auth-page.module.css";

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

type LoginFormProps = {
  registered?: boolean;
};

export function LoginForm({ registered = false }: LoginFormProps) {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const response = await login.mutateAsync({
        email,
        password,
      });

      localStorage.setItem("query.accessToken", response.accessToken);
      localStorage.setItem("query.user", JSON.stringify(response.user));
      setSuccessMessage("Login successful. Redirecting to your workspace.");
      router.push("/workspace");
    } catch {
      setSuccessMessage("");
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link className={styles.topLink} href="/">
          Back to home
        </Link>

        <div className={styles.header}>
          <span className={styles.eyebrow}>Welcome Back</span>
          <h1>Log in to Query</h1>
          <p>Use your registered email and password to access the frontend.</p>
        </div>

        {registered ? (
          <div className={`${styles.message} ${styles.success}`}>
            Registration complete. You can log in now.
          </div>
        ) : null}

        {successMessage ? (
          <div className={`${styles.message} ${styles.success}`}>
            {successMessage}
          </div>
        ) : null}

        {login.isError ? (
          <div className={`${styles.message} ${styles.error}`}>
            {getErrorMessage(login.error)}
          </div>
        ) : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="shashank@example.com"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="strongPassword123"
              required
            />
          </div>

          <button className={styles.submit} type="submit" disabled={login.isPending}>
            {login.isPending ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className={styles.footer}>
          New here? <Link href="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
