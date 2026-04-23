"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, useQueryPdf, useUploadPdf, useUserPdfs } from "@/lib/api";
import type { AuthUser, PdfFile } from "@/lib/api";
import styles from "./workspace.module.css";

export function WorkspaceView() {
  const router = useRouter();
  const [selectedPdfId, setSelectedPdfId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [context, setContext] = useState("");
  const [responseText, setResponseText] = useState("");
  const [queryError, setQueryError] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const user = getStoredUser();
  const pdfsQuery = useUserPdfs(user?.id ?? "", Boolean(user?.id));
  const uploadPdf = useUploadPdf();
  const queryPdf = useQueryPdf();

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [router, user]);

  function handleLogout() {
    localStorage.removeItem("query.user");
    localStorage.removeItem("query.accessToken");
    router.push("/login");
  }

  async function handleUploadSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !selectedUpload) {
      setUploadError("Choose a PDF before uploading.");
      setUploadMessage("");
      return;
    }

    const token = localStorage.getItem("query.accessToken");

    if (!token) {
      setUploadError("Your session is missing. Please log in again.");
      setUploadMessage("");
      router.push("/login");
      return;
    }

    try {
      const response = await uploadPdf.mutateAsync({
        file: selectedUpload,
        token,
        userId: user.id,
      });

      setUploadMessage(response.message || "PDF uploaded successfully.");
      setUploadError("");
      setSelectedUpload(null);
      setSelectedPdfId(response.file.id);
      setIsUploadModalOpen(false);
    } catch (error) {
      setUploadMessage("");
      setUploadError(
        error instanceof ApiError ? error.message : "Unable to upload the PDF.",
      );
    }
  }

  async function handleQuerySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      router.push("/login");
      return;
    }

    const token = localStorage.getItem("query.accessToken");

    if (!token) {
      setQueryError("Your session is missing. Please log in again.");
      setResponseText("");
      router.push("/login");
      return;
    }

    if (!resolvedSelectedPdfId) {
      setQueryError("Select an uploaded PDF first.");
      setResponseText("");
      return;
    }

    if (!prompt.trim()) {
      setQueryError("Enter a prompt before submitting.");
      setResponseText("");
      return;
    }

    if (!context.trim()) {
      setQueryError("Enter context before submitting.");
      setResponseText("");
      return;
    }

    try {
      const response = await queryPdf.mutateAsync({
        pdfId: resolvedSelectedPdfId,
        prompt,
        context,
        token,
      });

      setResponseText(response.answer);
      setQueryError("");
    } catch (error) {
      setResponseText("");
      setQueryError(
        error instanceof ApiError ? error.message : "Unable to fetch an answer.",
      );
    }
  }

  if (!user) {
    return null;
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const pdfFiles = pdfsQuery.data?.files ?? [];
  const resolvedSelectedPdfId =
    selectedPdfId && pdfFiles.some((file) => file.id === selectedPdfId)
      ? selectedPdfId
      : pdfFiles[0]?.id ?? "";

  function getPdfLabel(file: PdfFile) {
    return file.originalFileName || file.key;
  }

  return (
    <div className={styles.page}>
      <main className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.copy}>
            <div className={styles.copyHeader}>
              <span className={styles.eyebrow}>User Workspace</span>
              <div className={styles.headerAction}>
                <span className={styles.headerActionLabel}>Library</span>
                <button
                  className={styles.headerUploadButton}
                  type="button"
                  onClick={() => {
                    setUploadError("");
                    setUploadMessage("");
                    setIsUploadModalOpen(true);
                  }}
                >
                  Upload PDF
                </button>
              </div>
            </div>
            <h1>Welcome, {fullName || user.firstName}.</h1>
            <p>
              This is your first post-login page. You can see your profile name,
              choose a task from the dropdown, and enter custom text below.
            </p>
          </div>

          <div className={styles.metaCard}>
            <span className={styles.metaLabel}>Signed in as</span>
            <strong>{user.email}</strong>
            <div className={styles.metaActions}>
              <Link href="/">Home</Link>
              <button type="button" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </div>
        </section>

        <form className={styles.formCard} onSubmit={handleQuerySubmit}>
          <div className={styles.sectionHeader}>
            <h2>Start a task</h2>
            <p>Select one of your uploaded PDFs and add your prompt and context.</p>
          </div>

          <div className={styles.field}>
            <label htmlFor="workspace-option">Uploaded PDFs</label>
            {pdfsQuery.isLoading ? (
              <input value="Loading uploaded PDFs..." readOnly />
            ) : pdfsQuery.isError ? (
              <input value="Unable to load uploaded PDFs" readOnly />
            ) : pdfsQuery.data?.files.length ? (
              <select
                id="workspace-option"
                value={resolvedSelectedPdfId}
                onChange={(event) => setSelectedPdfId(event.target.value)}
              >
                {pdfFiles.map((file) => (
                  <option key={file.id} value={file.id}>
                    {getPdfLabel(file)}
                  </option>
                ))}
              </select>
            ) : (
              <input value="No PDFs uploaded yet" readOnly />
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="workspace-prompt">Prompt</label>
            <input
              id="workspace-prompt"
              type="text"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="What do you want to ask about this PDF?"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="workspace-context">Context</label>
            <input
              id="workspace-context"
              type="text"
              value={context}
              onChange={(event) => setContext(event.target.value)}
              placeholder="Add background context or constraints"
            />
          </div>

          <div className={styles.formActions}>
            <button
              className={styles.submitButton}
              type="submit"
              disabled={queryPdf.isPending || !resolvedSelectedPdfId}
            >
              {queryPdf.isPending ? "Asking..." : "Ask PDF"}
            </button>
            {queryError ? (
              <div className={`${styles.feedback} ${styles.error}`}>{queryError}</div>
            ) : null}
          </div>

          <div className={styles.responseCard}>
            <span className={styles.responseLabel}>API Response</span>
            <div className={styles.responseBody}>
              {responseText ||
                "The text response from your API will appear here after you submit the prompt."}
            </div>
          </div>
        </form>

        {isUploadModalOpen ? (
          <div
            className={styles.modalBackdrop}
            role="presentation"
            onClick={() => setIsUploadModalOpen(false)}
          >
            <div
              className={styles.modal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="upload-modal-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <div>
                  <span className={styles.metaLabel}>PDF Upload</span>
                  <h2 id="upload-modal-title">Add a new PDF</h2>
                </div>
                <button
                  className={styles.closeButton}
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                >
                  Close
                </button>
              </div>

              <form className={styles.uploadSection} onSubmit={handleUploadSubmit}>
                <div className={styles.field}>
                  <label htmlFor="workspace-upload">Choose PDF</label>
                  <input
                    id="workspace-upload"
                    type="file"
                    accept="application/pdf"
                    onChange={(event) => {
                      setSelectedUpload(event.target.files?.[0] ?? null);
                      setUploadError("");
                      setUploadMessage("");
                    }}
                  />
                </div>

                <div className={styles.uploadActions}>
                  <button
                    className={styles.uploadButton}
                    type="submit"
                    disabled={!selectedUpload || uploadPdf.isPending}
                  >
                    {uploadPdf.isPending ? "Uploading..." : "Upload PDF"}
                  </button>
                  <span className={styles.fileName}>
                    {selectedUpload ? selectedUpload.name : "No file chosen"}
                  </span>
                </div>

                {uploadMessage ? (
                  <div className={`${styles.feedback} ${styles.success}`}>
                    {uploadMessage}
                  </div>
                ) : null}

                {uploadError ? (
                  <div className={`${styles.feedback} ${styles.error}`}>{uploadError}</div>
                ) : null}
              </form>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedUser = localStorage.getItem("query.user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    localStorage.removeItem("query.user");
    localStorage.removeItem("query.accessToken");
    return null;
  }
}
