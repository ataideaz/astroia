"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function UnsubscribePage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setMessage(payload.message);
      setEmail("");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Não foi possível concluir o descadastro.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="legal-page">
      <header className="legal-header shell">
        <Link className="brand" href="/" aria-label="Voltar ao AstroIA">
          <span className="brand-mark" aria-hidden="true">✦</span>
          <span>AstroIA</span>
        </Link>
        <Link className="legal-back" href="/">Voltar ao site</Link>
      </header>

      <section className="legal-hero shell">
        <span className="section-kicker">Controle dos seus dados</span>
        <h1>Cancelar comunicações de marketing</h1>
        <p>
          Informe o e-mail usado no AstroIA. O consentimento será revogado
          imediatamente e o endereço ficará bloqueado para novos envios.
        </p>
      </section>

      <section className="legal-card shell unsubscribe-card">
        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Seu e-mail</span>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@exemplo.com"
            />
          </label>
          <button className="primary-button" disabled={loading} type="submit">
            {loading ? "Cancelando..." : "Cancelar comunicações"}
          </button>
          {message && <p className="form-success" role="status">{message}</p>}
          {error && <p className="analysis-error" role="alert">{error}</p>}
        </form>
        <p className="legal-note">
          O descadastro é gratuito. Guardaremos somente o mínimo necessário
          para respeitar sua escolha e impedir novas inclusões involuntárias.
        </p>
      </section>
    </main>
  );
}
