"use client";

import { FormEvent, type ReactNode, useState } from "react";
import type { AnalysisResult } from "../lib/astro-analysis";
import type { CompatResult } from "../lib/compatibility";
import type { PremiumChapter, PremiumReading } from "../lib/premium-reading";
import { StoryShare, compatCards } from "./story-cards";
import { formatPersonName } from "../lib/name-format";

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
  /** Numerologia do Nome (comprada) ou a oferta dela, logo depois do capítulo do número. */
  nameSlot?: ReactNode;
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

function CompatResultView({
  compat,
  onEdit,
}: {
  compat: NonNullable<CompatState>;
  onEdit: () => void;
}) {
  const { result } = compat;
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
          {result.archetype && (
            <p className="cp-archetype">
              Vocês são <strong>{result.archetype.name}</strong>. {result.archetype.text}
            </p>
          )}
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
        {result.firstImpression && result.firstImpression.length > 0 && (
          <article className="cp-extra">
            <span className="cp-extra-icon" aria-hidden="true">👀</span>
            <h4>A primeira impressão</h4>
            {result.firstImpression.map((line) => <p key={line}>{line}</p>)}
          </article>
        )}
        {result.trust && result.trust.length > 0 && (
          <article className="cp-extra">
            <span className="cp-extra-icon" aria-hidden="true">🔒</span>
            <h4>Ciúme e confiança</h4>
            {result.trust.map((line) => <p key={line}>{line}</p>)}
          </article>
        )}
        {result.money && (
          <article className="cp-extra">
            <span className="cp-extra-icon" aria-hidden="true">$</span>
            <h4>Dinheiro a dois</h4>
            {result.money.lines.map((line) => <p key={line}>{line}</p>)}
            <p className="pr-tip"><strong>Dica para vocês:</strong> {result.money.tip}</p>
          </article>
        )}
        {result.love?.length > 0 && (
          <article className="cp-extra">
            <span className="cp-extra-icon" aria-hidden="true">♡</span>
            <h4>O que faz cada pessoa se sentir amada</h4>
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
            <small>Pela numerologia: a soma do ano pessoal de cada pessoa.</small>
          </article>
        )}
      </div>

      {result.pacts && result.pacts.length > 0 && (
        <article className="cp-list-card">
          <span className="pr-kicker">Os 3 combinados de vocês</span>
          <ul className="cp-pacts">
            {result.pacts.map((pact) => <li key={pact}>{pact}</li>)}
          </ul>
        </article>
      )}
      {result.questions && result.questions.length > 0 && (
        <article className="cp-list-card">
          <span className="pr-kicker">Perguntas para o casal</span>
          <p className="cp-list-intro">Escolham uma noite tranquila e respondam a dois. Não existe resposta errada.</p>
          <ol className="cp-questions">
            {result.questions.map((question) => <li key={question}>{question}</li>)}
          </ol>
        </article>
      )}

      <StoryShare
        cards={compatCards(result)}
        filePrefix="nossa-compatibilidade-astroia"
        shareText={result.shareText}
        subtitle="Três stories com a sintonia de vocês, o arquétipo do casal e o que mais une vocês. Marque o seu par e desafie os amigos a fazer o deles 💞"
        title="Postem a compatibilidade de vocês"
      />
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
          <input
            name="name"
            required
            maxLength={80}
            autoCapitalize="words"
            autoComplete="off"
            placeholder="Nome completo da pessoa"
            onBlur={(event) => { event.currentTarget.value = formatPersonName(event.currentTarget.value); }}
          />
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

export type CompatSectionProps = Pick<
  Props,
  "compatOwned" | "compatOffered" | "compatPrice" | "compat" | "compatPending" | "onBuyCompat" | "reportToken" | "onCompatSaved"
>;

/** Exemplo do gráfico de compatibilidade (o mesmo visual que o cliente recebe, com números de exemplo). */
export function CompatSample({ compact = false }: { compact?: boolean }) {
  const areas = [
    { label: "Coração", symbol: "♡", score: 90 },
    { label: "Atração", symbol: "🔥", score: 84 },
    { label: "Conversa", symbol: "💬", score: 72 },
    { label: "Dia a dia", symbol: "🏡", score: 78 },
  ];
  return (
    <div className={`cp-sample${compact ? " cp-sample-compact" : ""}`} role="img" aria-label="Exemplo ilustrativo: 87% de sintonia, com coração, atração, conversa e dia a dia">
      <div className="cp-ring" style={{ ["--cp-score" as string]: "87" }} aria-hidden="true">
        <strong>87%</strong>
        <span>de sintonia</span>
      </div>
      <div className="cp-sample-bars" aria-hidden="true">
        {areas.map((area) => (
          <div className="cp-sample-row" key={area.label}>
            <span>{area.symbol} {area.label}</span>
            <b>{area.score}%</b>
            <div className="cp-bar"><span style={{ width: `${area.score}%` }} /></div>
          </div>
        ))}
      </div>
      <small className="cp-sample-note">Exemplo ilustrativo · o resultado de vocês depende dos dois mapas</small>
    </div>
  );
}

export function CompatSection(props: CompatSectionProps) {
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
            <CompatSample />
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
        <span className="pr-kicker">{props.analysis.person.isMinor ? "Mapa completo" : "Seu mapa completo"}</span>
        <h2 id="pr-letter-title">{reading.letter.title}</h2>
        <p>{reading.letter.text}</p>
        <nav className="pr-index" aria-label="Partes do seu mapa completo">
          {reading.chapters.map((chapter) => (
            <a href={`#pr-${chapter.id}`} key={chapter.id}>
              <span aria-hidden="true">{chapter.symbol}</span> {chapter.label}
            </a>
          ))}
          {reading.months.length > 0 && (
            <a href="#pr-meses">
              <span aria-hidden="true">◷</span> Próximos 12 meses
            </a>
          )}
          {props.nameSlot && (
            <a href="#numerologia-nome">
              <span aria-hidden="true">✦</span> Seu nome
            </a>
          )}
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
          {chapter.id === "numero" && props.nameSlot}
        </div>
      ))}

      <section className="pr-closing">
        <span aria-hidden="true">✦</span>
        <p>{reading.closing}</p>
      </section>

      <a className="st-reminder" href="#fr-archetype-title">
        <span aria-hidden="true">📲</span>
        <span>
          {props.analysis.freeReading?.audience === "child" ? (
            <><strong>Os stories de {props.analysis.person.firstName} estão prontos</strong> lá em cima. Mostre para a família e os amigos.</>
          ) : (
            <><strong>Gostou do seu mapa?</strong> Os seus stories estão prontos lá em cima. Poste e descubra quais amigos têm o mesmo arquétipo que você.</>
          )}
        </span>
        <span aria-hidden="true">↑</span>
      </a>
    </div>
  );
}
