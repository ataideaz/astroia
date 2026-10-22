"use client";

import type { NameReading } from "../lib/name-numerology";

export function NameReadingView({ reading }: { reading: NameReading }) {
  return (
    <section className="nm" id="numerologia-nome" aria-labelledby="nm-title">
      <span className="pr-kicker">✦ Numerologia do Nome</span>
      <h2 id="nm-title">{reading.headline}</h2>
      <p className="nm-intro">{reading.intro}</p>

      <div className="nm-numbers" aria-label="Os seus números">
        {reading.sections.map((section) => (
          <a className="nm-number" href={`#nm-${section.id}`} key={section.id}>
            <strong>{section.number}</strong>
            <span>{section.label.replace("Número da ", "").replace("Número do ", "")}</span>
          </a>
        ))}
      </div>

      <div className="nm-sections">
        {reading.sections.map((section) => (
          <article className={`nm-card nm-card-${section.id}`} id={`nm-${section.id}`} key={section.id}>
            <div className="nm-card-top">
              <span className="nm-badge" aria-hidden="true">{section.number}</span>
              <div>
                <small>{section.label}</small>
                <span>{section.question}</span>
              </div>
            </div>
            <h3>{section.title}</h3>
            <p>{section.text}</p>
            <p className={section.example.startsWith("Experimente") ? "pr-tip" : "pr-example"}>{section.example}</p>
            {section.extra && <p className="pr-source">{section.extra}</p>}
          </article>
        ))}
      </div>

      <div className="nm-power">
        <article>
          <span className="pr-kicker">Seus dias de poder</span>
          <div className="nm-days">
            {reading.powerDays.map((day) => <span key={day}>{day}</span>)}
          </div>
          <p>{reading.powerText}</p>
        </article>
        <article>
          <span className="pr-kicker">Seu número da sorte</span>
          <div className="nm-days"><span>{reading.numbers.lucky}</span></div>
          <p>{reading.luckyText}</p>
        </article>
      </div>

      <a className="st-reminder" href="#fr-archetype-title">
        <span aria-hidden="true">📲</span>
        <span>
          <strong>Os stories do seu nome já estão prontos</strong> junto com os outros, lá em cima. Poste
          e desafie os amigos a descobrir o número do nome deles.
        </span>
        <span aria-hidden="true">↑</span>
      </a>
      <p className="pr-source">{reading.closing}</p>
    </section>
  );
}

export function NameOffer({
  price,
  pending,
  onBuy,
  context,
}: {
  price: string;
  pending: boolean;
  onBuy: () => void;
  context: "premium" | "free";
}) {
  return (
    <section className="nm nm-offer" id="numerologia-nome" aria-labelledby="nm-offer-title">
      <span className="pr-kicker">✦ Novo · Numerologia do Nome</span>
      <h2 id="nm-offer-title">E o que o seu nome revela sobre você?</h2>
      <div className="cp-offer">
        <div>
          <p>
            {context === "premium"
              ? "O seu mapa usou a sua data de nascimento. Agora descubra o que dizem as letras do seu nome: uma camada que o mapa astral não mostra."
              : "Cada letra do seu nome tem um número. Somando todas, aparecem o seu desejo mais profundo, o jeito como os outros te veem e os seus talentos."}
          </p>
          <ul className="ck-includes">
            <li>Número da Alma: o que você deseja lá no fundo</li>
            <li>Número da Personalidade: como os outros te veem</li>
            <li>Número da Expressão: os seus talentos</li>
            <li>Destino, Maturidade e o seu Desafio</li>
            <li>Seus dias de poder e o seu número da sorte</li>
            <li>Stories coloridos para postar</li>
          </ul>
        </div>
        <div className="cp-offer-buy nm-offer-buy">
          <strong>{price}</strong>
          <span>pagamento único</span>
          <button className="analysis-button primary-analysis-button" disabled={pending} onClick={onBuy} type="button">
            {pending ? "Esperando o pagamento..." : "Quero descobrir o meu nome"}
          </button>
          <small>Pelo Mercado Pago. Abre aqui mesmo, logo depois do pagamento.</small>
        </div>
      </div>
    </section>
  );
}
