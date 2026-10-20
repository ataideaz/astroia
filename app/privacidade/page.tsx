"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

const requestLabels: Record<string, string> = {
  confirmacao: "Confirmar se meus dados são tratados",
  acesso: "Solicitar acesso aos meus dados",
  correcao: "Corrigir dados incompletos ou incorretos",
  eliminacao: "Solicitar eliminação dos dados",
  revogacao: "Revogar um consentimento",
  informacao: "Saber como os dados são compartilhados",
  outro: "Outro pedido sobre privacidade",
};

export default function PrivacyPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePrivacyRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/privacy-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          requestType: form.get("requestType"),
          details: form.get("details"),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setMessage(
        `${payload.message} Protocolo: ${payload.protocol}. Guarde este número.`,
      );
      event.currentTarget.reset();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Não foi possível registrar sua solicitação.",
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
        <span className="section-kicker">Última atualização: 20/09/2026</span>
        <h1>Política de Privacidade</h1>
        <p>
          Entenda, em linguagem simples, quais dados o AstroIA utiliza, para
          quê, por quanto tempo e como você pode exercer seus direitos.
        </p>
      </section>

      <div className="legal-layout shell">
        <article className="legal-content">
          <section>
            <h2>1. Quem controla os dados</h2>
            <p>
              O controlador é o <strong>AstroIA</strong>, serviço digital
              brasileiro de astrologia e autoconhecimento. Durante a fase de
              protótipo, o canal oficial de privacidade é o formulário desta
              página. A identificação empresarial será atualizada antes do
              lançamento comercial.
            </p>
          </section>

          <section>
            <h2>2. Quais dados utilizamos</h2>
            <ul>
              <li>Nome, data, horário e cidade de nascimento.</li>
              <li>
                Indicação de para quem o mapa será gerado: titular, parceiro,
                filho, familiar ou outra pessoa.
              </li>
              <li>Tema escolhido e informações necessárias para gerar a leitura.</li>
              <li>E-mail, somente quando você decidir informá-lo.</li>
              <li>Registro do consentimento, revogação e pedidos de privacidade.</li>
              <li>Dados técnicos mínimos de segurança e funcionamento.</li>
            </ul>
          </section>

          <section>
            <h2>3. Finalidades e bases legais</h2>
            <p>
              Os dados de nascimento são processados para gerar a análise
              solicitada. Se o mapa for de outra pessoa, quem solicita deverá
              confirmar que pode utilizar esses dados. Nesta versão, os dados
              do mapa não são adicionados à lista de marketing. Quando você
              pedir o envio do mapa, o e-mail será usado para realizar essa
              entrega e anexar o PDF. Esse uso não ativa comunicações
              promocionais. Novidades, conteúdos, lançamentos e ofertas só
              serão enviados quando você marcar o consentimento específico,
              que é opcional.
            </p>
            <p>
              Também podemos conservar registros mínimos para cumprir
              obrigações legais, proteger o serviço, prevenir fraudes e
              responder às solicitações dos titulares.
            </p>
          </section>

          <section>
            <h2>4. Prazo de conservação</h2>
            <p>
              O e-mail autorizado para marketing permanece ativo até a
              revogação. Depois do descadastro, mantemos o endereço na lista de
              bloqueio apenas para impedir novos envios ou recadastros
              involuntários. Pedidos de privacidade e registros exigidos por
              lei podem ser conservados pelo prazo necessário à comprovação e
              ao cumprimento de obrigações.
            </p>
            <p>
              No envio solicitado do mapa, o endereço, o conteúdo do e-mail e o
              PDF podem transitar pelo fornecedor de entrega pelo tempo
              necessário ao envio, à segurança e à verificação de falhas.
            </p>
            <p>
              Os relatórios e dados de nascimento ficam armazenados no servidor para permitir consultas posteriores pelo link privado, até solicitação de exclusão, ressalvados registros necessários de pagamentos. Quem tiver esse endereço pode acessar o conteúdo: guarde-o com cuidado. Limpar o navegador não exclui o relatório. Contadores técnicos de abuso expiram em até duas horas; o IP é transformado em uma chave resumida que muda a cada hora.
            </p>
          </section>

          <section>
            <h2>5. Compartilhamento e armazenamento</h2>
            <p>
              Não vendemos dados pessoais para terceiros usarem em campanhas
              próprias. Podemos utilizar fornecedores de infraestrutura,
              hospedagem, segurança, processamento e envio de e-mails e pagamentos, sempre limitados à finalidade
              contratada.
              Alguns fornecedores podem processar dados fora do Brasil, com
              medidas contratuais e técnicas de proteção compatíveis.
            </p>
          </section>

          <section>
            <h2>6. Seus direitos</h2>
            <p>
              Você pode pedir confirmação do tratamento, acesso, correção,
              informação sobre compartilhamento, portabilidade quando
              aplicável, anonimização, bloqueio, eliminação e revogação do
              consentimento. O pedido é gratuito e poderá exigir validação de
              identidade para proteger seus dados.
            </p>
          </section>

          <section>
            <h2>7. Segurança e menores de idade</h2>
            <p>
              Adotamos medidas para reduzir acessos indevidos, perdas e usos
              incompatíveis. O serviço pode gerar um mapa adaptado para uma
              criança ou adolescente quando solicitado por responsável legal
              ou pessoa autorizada. O tratamento deverá observar o melhor
              interesse do menor, com coleta limitada ao necessário e
              linguagem que evite rótulos, diagnósticos ou decisões sobre seu
              futuro.
            </p>
            <p>
              O e-mail informado deve pertencer à pessoa adulta que solicita o
              mapa. Não solicitamos e-mail da criança ou adolescente para
              comunicações comerciais.
            </p>
          </section>

          <section>
            <h2>8. Cookies e alterações</h2>
            <p>
              Nesta versão, usamos somente recursos técnicos necessários ao
              funcionamento e à segurança do site; não usamos cookies
              publicitários próprios. Mudanças relevantes nesta política serão
              comunicadas de forma destacada antes de passarem a valer.
            </p>
          </section>

          <section>
            <h2>9. Cancelamento de marketing</h2>
            <p>
              Você pode cancelar comunicações a qualquer momento. A revogação
              é gratuita e não afeta o acesso ao mapa.
            </p>
            <Link className="secondary-link" href="/descadastrar">
              Ir para o descadastro automático →
            </Link>
          </section>
        </article>

        <aside className="privacy-request-card" id="solicitar">
          <span className="section-kicker">Canal de privacidade</span>
          <h2>Exercer meus direitos</h2>
          <p>
            Envie sua solicitação. Ela será registrada com um protocolo para
            acompanhamento.
          </p>
          <form onSubmit={handlePrivacyRequest}>
            <label className="field">
              <span>E-mail para retorno</span>
              <input required name="email" type="email" />
            </label>
            <label className="field">
              <span>Tipo de solicitação</span>
              <select required name="requestType" defaultValue="">
                <option disabled value="">Selecione</option>
                {Object.entries(requestLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Detalhes (opcional)</span>
              <textarea maxLength={1200} name="details" rows={5} />
            </label>
            <button className="primary-button" disabled={loading} type="submit">
              {loading ? "Registrando..." : "Enviar solicitação"}
            </button>
            {message && <p className="form-success" role="status">{message}</p>}
            {error && <p className="analysis-error" role="alert">{error}</p>}
          </form>
        </aside>
      </div>
    </main>
  );
}
