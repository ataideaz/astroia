"use client";

import { FormEvent, useState } from "react";
import type { AnalysisResult } from "../lib/astro-analysis";
import type { CompatResult } from "../lib/compatibility";
import type { PremiumChapter, PremiumReading } from "../lib/premium-reading";

export type CompatState = {
  result: CompatResult;
  partnerName: string;
  canEdit: boolean;
} | null;

type Props = {
  analysis: AnalysisResult;
  reading: PremiumReading;
  reportToken: string;
  compatOwned: boolean;
  compatOffered: boolean;
  compatPrice: string;
  compat: CompatState;
  compatPending: boolean;
  onBuyCompat: () => void;
  onCompatSaved: (compat: NonNullable<CompatState>) => void;
};

function Chapter({ chapter, index }: { chapter: PremiumChapter; index: number }) {
  return (
    <article className={`pr-chapter pr-chapter-${chapter.id}`} id={`pr-${chapter.id}`}>
      <div className="pr-chapter-head">
        <span className="pr-chapter-symbol" aria-hidden="true">{chapter.symbol}</span>
        <div>
          <span className="pr-kicker">
            {String(index + 1).padStart(2, "0")} · {chapter.label}
          </span>
          <h2>{chapter.title}</h2>
        </div>
      </div>
      <p className="pr-intro">{chapter.intro}</p>
      {chapter.payoff && (
        <p className="pr-payoff">
          <span>{chapter.payoff.lead} </span>
          <strong>{chapter.payoff.rest}</strong>
        </p>
      )}
      <div className={`pr-blocks ${chapter.blocks.length === 1 ? "pr-blocks-single" : ""}`}>
        {chapter.blocks.map((block) => (
          <section className="pr-block" key={block.title}>
            <h3>{block.title}</h3>
            <p>{block.text}</p>
            {block.example && <p className="pr-example">{block.example}</p>}
            {block.tip && (
              <p className="pr-tip">
                <strong>Experimente:</strong> {block.tip}
              </p>
            )}
          </section>
        ))}
      </div>
      <p className="pr-source">
        <span aria-hidden="true">✦</span> De onde vem: {chapter.source}
      </p>
    </article>
  );
}

function Months({ reading }: { reading: PremiumReading }) {
  if (!reading.months.length) return null;
  return (
    <section className="pr-months" id="pr-meses" aria-labelledby="pr-months-title">
      <span className="pr-kicker">Seus próximos 12 meses</span>
      <h2 id="pr-months-title">O tema de cada mês</h2>
      <p className="pr-months-intro">
        Cada mês tem um número (pela numerologia) e, em alguns, os planetas dão
        uma ajudinha extra. Use como um calendário de intenções.
      </p>
      <ol className="pr-month-grid">
        {reading.months.map((month) => (
          <li className="pr-month" key={month.key}>
            <div className="pr-month-top">
              <strong>{month.label}</strong>
              <span className="pr-month-number" aria-label={`Mês pessoal ${month.number}`}>
                {month.number}
              </span>
            </div>
            <p className="pr-month-theme">{month.theme}</p>
            {month.tip && <p className="pr-month-tip">{month.tip}</p>}
            {month.tags.length > 0 && (
              <ul className="pr-month-tags">
                {month.tags.map((tag) => (
                  <li className={`pr-tag pr-tag-${tag.id}`} key={tag.id}>
                    {tag.id === "amor" ? "♡" : tag.id === "sorte" ? "✦" : tag.id === "energia" ? "⚡" : "☼"} {tag.label}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

async function makeCompatImage(result: CompatResult): Promise<Blob> {
  const width = 1080;
  const height = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  const root = getComputedStyle(document.documentElement);
  const serif = root.getPropertyValue("--font-cormorant").trim() || "Georgia, serif";
  const sans = root.getPropertyValue("--font-manrope").trim() || "Arial, sans-serif";
  await Promise.all([
    document.fonts.load(`600 120px ${serif}`),
    document.fonts.load(`400 40px ${sans}`),
    document.fonts.load(`700 40px ${sans}`),
  ]).catch(() => undefined);

  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#1a0f2e");
  bg.addColorStop(1, "#070916");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  const glow = ctx.createRadialGradient(width / 2, 760, 40, width / 2, 760, 700);
  glow.addColorStop(0, "rgba(232, 120, 170, 0.35)");
  glow.addColorStop(1, "rgba(232, 120, 170, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  let seed = result.score * 97 + 13;
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let index = 0; index < 130; index += 1) {
    ctx.globalAlpha = 0.25 + random() * 0.6;
    ctx.fillStyle = random() > 0.7 ? "#f0d69d" : "#f7f1e8";
    ctx.beginPath();
    ctx.arc(random() * width, random() * height, 1 + random() * 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = "center";

  const fit = (text: string, weight: string, size: number, family: string, max: number) => {
    let current = size;
    ctx.font = `${weight} ${current}px ${family}`;
    while (ctx.measureText(text).width > max && current > 30) {
      current -= 4;
      ctx.font = `${weight} ${current}px ${family}`;
    }
  };

  ctx.fillStyle = "#f0d69d";
  ctx.beginPath();
  ctx.arc(width / 2 - 118, 196, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = `600 54px ${serif}`;
  ctx.fillStyle = "#f7f1e8";
  ctx.fillText("AstroIA", width / 2, 214);

  ctx.font = `700 34px ${sans}`;
  ctx.fillStyle = "#e4bc72";
  ctx.fillText("NOSSA COMPATIBILIDADE", width / 2, 430);

  const names = `${result.names[0]} + ${result.names[1]}`;
  fit(names, "600", 110, serif, 940);
  ctx.fillStyle = "#f7f1e8";
  ctx.fillText(names, width / 2, 570);

  // Anel do placar
  const cx = width / 2;
  const cy = 860;
  const radius = 210;
  ctx.lineWidth = 34;
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  const ring = ctx.createLinearGradient(cx - radius, 0, cx + radius, 0);
  ring.addColorStop(0, "#f0d69d");
  ring.addColorStop(1, "#ef8fbf");
  ctx.strokeStyle = ring;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * result.score) / 100);
  ctx.stroke();
  ctx.font = `600 170px ${serif}`;
  ctx.fillStyle = "#f7f1e8";
  ctx.fillText(`${result.score}%`, cx, cy + 58);
  ctx.font = `700 34px ${sans}`;
  ctx.fillStyle = "#e4bc72";
  ctx.fillText("DE SINTONIA", cx, cy + 300);

  fit(result.headline, "600", 76, serif, 940);
  ctx.fillStyle = "#f7f1e8";
  ctx.fillText(result.headline, width / 2, 1290);

  // Áreas
  const top = 1370;
  result.areas.forEach((area, index) => {
    const y = top + index * 66;
    ctx.textAlign = "left";
    ctx.font = `700 34px ${sans}`;
    ctx.fillStyle = "#ddd6ea";
    ctx.fillText(area.label, 150, y + 12);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.roundRect(430, y - 14, 420, 26, 13);
    ctx.fill();
    ctx.fillStyle = "#ef8fbf";
    ctx.beginPath();
    ctx.roundRect(430, y - 14, Math.max(26, (420 * area.score) / 100), 26, 13);
    ctx.fill();
    ctx.textAlign = "right";
    ctx.fillStyle = "#f7f1e8";
    ctx.fillText(`${area.score}%`, 960, y + 12);
  });
  ctx.textAlign = "center";
  ctx.font = `400 36px ${sans}`;
  ctx.fillStyle = "#b6aec5";
  ctx.fillText("Descubra a sua em", width / 2, 1720);
  ctx.font = `700 44px ${sans}`;
  ctx.fillStyle = "#f0d69d";
  ctx.fillText(window.location.host, width / 2, 1782);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("blob"))), "image/png"),
  );
}

function CompatResultView({
  compat,
  onEdit,
}: {
  compat: NonNullable<CompatState>;
  onEdit: () => void;
}) {
  const { result } = compat;
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${result.shareText} ${siteUrl}`)}`;

  async function shareImage() {
    setBusy(true);
    setStatus("");
    try {
      const blob = await makeCompatImage(result);
      const file = new File([blob], "nossa-compatibilidade-astroia.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text: `${result.shareText} ${siteUrl}` });
          setStatus("Pronto! Escolha onde quer postar.");
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
        }
      }
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "nossa-compatibilidade-astroia.png";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 5000);
      setStatus("Imagem baixada! Ela está na sua pasta de downloads.");
    } catch {
      setStatus("Não deu para criar a imagem neste navegador. Tente pelo celular ou use o WhatsApp.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cp-result">
      <div className="cp-hero">
        <div
          className="cp-ring"
          style={{ ["--cp-score" as string]: `${result.score}` }}
          aria-label={`${result.score}% de sintonia`}
        >
          <strong>{result.score}%</strong>
          <span>de sintonia</span>
        </div>
        <div className="cp-hero-text">
          <span className="pr-kicker">
            {result.names[0]} + {result.names[1]}
          </span>
          <h3>{result.headline}</h3>
          <p>{result.summary}</p>
          <div className="cp-signs">
            {result.signs.map((person) => (
              <span key={person.name}>
                <strong>{person.name}</strong> Sol em {person.sun} · Lua em {person.moon}
                {person.ascendant ? ` · Ascendente em ${person.ascendant}` : ""}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="cp-areas">
        {result.areas.map((area) => (
          <article className="cp-area" key={area.id}>
            <div className="cp-area-top">
              <span aria-hidden="true">{area.symbol}</span>
              <small>{area.label}</small>
              <strong>{area.score}%</strong>
            </div>
            <div className="cp-bar" aria-hidden="true">
              <span style={{ width: `${area.score}%` }} />
            </div>
            <h4>{area.title}</h4>
            <p>{area.text}</p>
            <p className="pr-tip">
              <strong>Dica para vocês:</strong> {area.tip}
            </p>
          </article>
        ))}
      </div>

      <div className="cp-extras">
        {result.love?.length > 0 && (
          <article className="cp-extra">
            <span className="cp-extra-icon" aria-hidden="true">♡</span>
            <h4>Como cada um se sente amado</h4>
            {result.love.map((item) => <p key={item.name}>{item.text}</p>)}
          </article>
        )}
        {result.makeUp?.length > 0 && (
          <article className="cp-extra">
            <span className="cp-extra-icon" aria-hidden="true">☮</span>
            <h4>Como fazer as pazes</h4>
            {result.makeUp.map((item) => <p key={item.name}>{item.text}</p>)}
          </article>
        )}
        {result.gifts?.length > 0 && (
          <article className="cp-extra">
            <span className="cp-extra-icon" aria-hidden="true">✦</span>
            <h4>O que um ensina ao outro</h4>
            {result.gifts.map((gift) => <p key={gift}>{gift}</p>)}
          </article>
        )}
        {result.date && (
          <article className="cp-extra">
            <span className="cp-extra-icon" aria-hidden="true">☕</span>
            <h4>O encontro perfeito</h4>
            <p>{result.date.replace(/^O encontro perfeito para vocês: /, "")}</p>
          </article>
        )}
        {result.coupleYear && (
          <article className="cp-extra cp-extra-year">
            <span className="cp-extra-icon cp-year-number" aria-hidden="true">{result.coupleYear.number}</span>
            <h4>O ano de vocês</h4>
            <p>{result.coupleYear.text}</p>
            <small>Pela numerologia: a soma do ano pessoal de cada um.</small>
          </article>
        )}
      </div>

      <div className="cp-share">
        <p className="fr-share-title">Mostre a compatibilidade de vocês</p>
        <div className="fr-share-buttons cp-share-buttons">
          <a className="fr-social fr-social-whatsapp" href={whatsapp} rel="noreferrer" target="_blank">
            <img alt="" className="fr-social-glyph" src="/icons/whatsapp-glyph-white.svg" /> WhatsApp
          </a>
          <button className="fr-social fr-social-instagram" disabled={busy} onClick={shareImage} type="button">
            <img alt="" className="fr-social-glyph" src="/icons/instagram-glyph-white.svg" /> Stories
          </button>
        </div>
        {status && <p role="status">{status}</p>}
      </div>
      <p className="cp-note">{result.note}</p>
      {compat.canEdit && (
        <button className="fr-share-download" onClick={onEdit} type="button">
          Errou algum dado? Corrigir uma vez
        </button>
      )}
    </div>
  );
}

function CompatForm({
  reportToken,
  onSaved,
  onCancel,
}: {
  reportToken: string;
  onSaved: (compat: NonNullable<CompatState>) => void;
  onCancel?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/compatibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: reportToken,
          consent: data.get("consent") === "on",
          partner: {
            name: String(data.get("name") ?? ""),
            birthDate: String(data.get("birthDate") ?? ""),
            birthTime: String(data.get("birthTime") ?? ""),
            city: String(data.get("city") ?? ""),
            country: String(data.get("country") ?? "Brasil"),
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível calcular agora.");
      onSaved(payload);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível calcular agora.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="cp-form" onSubmit={submit}>
      <p className="cp-form-intro">
        Preencha os dados de nascimento da outra pessoa. Quanto mais certinho o
        horário, mais precisa fica a leitura (se não souber, pode deixar em branco).
      </p>
      <div className="cp-form-grid">
        <label className="ck-field">
          <span>Nome</span>
          <input name="name" required maxLength={80} autoComplete="off" placeholder="Nome da pessoa" />
        </label>
        <label className="ck-field">
          <span>Data de nascimento</span>
          <input name="birthDate" required type="date" />
        </label>
        <label className="ck-field">
          <span>Horário (opcional)</span>
          <input name="birthTime" type="time" />
        </label>
        <label className="ck-field">
          <span>Cidade onde nasceu</span>
          <input name="city" required maxLength={80} placeholder="Ex.: Campinas" />
        </label>
        <label className="ck-field">
          <span>País</span>
          <input name="country" defaultValue="Brasil" maxLength={60} />
        </label>
      </div>
      <label className="cp-consent">
        <input name="consent" required type="checkbox" />
        <span>A outra pessoa sabe e concorda que eu use a data de nascimento dela aqui.</span>
      </label>
      {error && <p className="checkout-payment-message" role="alert">{error}</p>}
      <div className="cp-form-actions">
        <button className="analysis-button primary-analysis-button" disabled={busy} type="submit">
          {busy ? "Calculando..." : "Ver a nossa compatibilidade"}
        </button>
        {onCancel && (
          <button className="fr-share-download" onClick={onCancel} type="button">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

function CompatSection(props: Props) {
  const { compatOwned, compatOffered, compatPrice, compat, compatPending, onBuyCompat, reportToken, onCompatSaved } = props;
  const [editing, setEditing] = useState(false);
  if (!compatOwned && !compatOffered) return null;

  return (
    <section className="cp-section" id="compatibilidade" aria-labelledby="cp-title">
      <span className="pr-kicker">♡ Compatibilidade do casal</span>
      <h2 id="cp-title">
        {compat ? `Você e ${compat.result.names[1]}` : "E como você combina com o seu par?"}
      </h2>

      {!compatOwned && (
        <div className="cp-offer">
          <div>
            <p>
              Agora que você sabe como ama, descubra como o seu mapa conversa com
              o mapa de quem você ama: no coração, na atração, na conversa e no
              dia a dia.
            </p>
            <ul className="ck-includes">
              <li>A porcentagem de sintonia de vocês</li>
              <li>O que une vocês e o que pede mais atenção</li>
              <li>Uma dica prática para cada área</li>
              <li>Uma imagem linda para postar nos stories</li>
            </ul>
          </div>
          <div className="cp-offer-buy">
            <strong>+ {compatPrice}</strong>
            <span>para quem já tem o mapa completo</span>
            <button className="analysis-button primary-analysis-button" disabled={compatPending} onClick={onBuyCompat} type="button">
              {compatPending ? "Esperando o pagamento..." : "Quero ver a nossa compatibilidade"}
            </button>
            <small>Pagamento único pelo Mercado Pago. Você preenche os dados da outra pessoa depois.</small>
          </div>
        </div>
      )}

      {compatOwned && (!compat || editing) && (
        <CompatForm
          reportToken={reportToken}
          onCancel={editing ? () => setEditing(false) : undefined}
          onSaved={(saved) => {
            setEditing(false);
            onCompatSaved(saved);
          }}
        />
      )}

      {compatOwned && compat && !editing && (
        <CompatResultView compat={compat} onEdit={() => setEditing(true)} />
      )}
    </section>
  );
}

export function PremiumReport(props: Props) {
  const { reading, compatOwned, compatOffered, compat, compatPrice } = props;
  const showCompatLink = compatOwned || compatOffered;

  return (
    <div className="pr">
      <section className="pr-letter" aria-labelledby="pr-letter-title">
        <span className="pr-kicker">Seu mapa completo</span>
        <h2 id="pr-letter-title">{reading.letter.title}</h2>
        <p>{reading.letter.text}</p>
        <nav className="pr-index" aria-label="Partes do seu mapa completo">
          {reading.chapters.map((chapter) => (
            <a href={`#pr-${chapter.id}`} key={chapter.id}>
              <span aria-hidden="true">{chapter.symbol}</span> {chapter.label}
            </a>
          ))}
          <a href="#pr-meses">
            <span aria-hidden="true">◷</span> Próximos 12 meses
          </a>
          {showCompatLink && (
            <a className="pr-index-compat" href="#compatibilidade">
              <span aria-hidden="true">♡</span> Compatibilidade
            </a>
          )}
        </nav>
      </section>

      {showCompatLink && (
        <a className="pr-compat-banner" href="#compatibilidade">
          <span aria-hidden="true">♡</span>
          <span>
            {compat
              ? <>Sua compatibilidade com <strong>{compat.result.names[1]}</strong> deu <strong>{compat.result.score}%</strong>. Ver de novo</>
              : compatOwned
                ? <><strong>Sua compatibilidade está liberada.</strong> Falta só preencher os dados do seu par</>
                : <><strong>Novo:</strong> descubra como você combina com o seu par, por + {compatPrice}</>}
          </span>
          <span aria-hidden="true">→</span>
        </a>
      )}

      {reading.chapters.map((chapter, index) => (
        <div className="pr-chapter-wrap" key={chapter.id}>
          <Chapter chapter={chapter} index={index} />
          {chapter.id === "amor" && <CompatSection {...props} />}
          {chapter.id === "agora" && <Months reading={reading} />}
        </div>
      ))}

      <section className="pr-closing">
        <span aria-hidden="true">✦</span>
        <p>{reading.closing}</p>
      </section>
    </div>
  );
}
