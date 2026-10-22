import Link from "next/link";
import { productPrice } from "../../lib/products";

export const dynamic = "force-dynamic";

function price(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const CONTACT = "contato@meuastroia.com.br";

export default function TermsPage() {
  const map = price(productPrice("map"));
  const compat = price(productPrice("compat"));
  const name = price(productPrice("name"));

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
        <span className="section-kicker">Última atualização: 22/10/2026</span>
        <h1>Termos de Uso</h1>
        <p>
          As regras do AstroIA em linguagem simples: o que você recebe, como
          funciona o pagamento e como pedir o reembolso se não gostar.
        </p>
      </section>

      <div className="legal-layout shell">
        <article className="legal-content">
          <section>
            <h2>1. O que é o AstroIA</h2>
            <p>
              O AstroIA é um serviço digital de astrologia e numerologia para
              entretenimento e autoconhecimento. O mapa é calculado com a
              posição real dos planetas no dia, na hora e na cidade de
              nascimento. Os textos foram escritos com apoio de inteligência
              artificial e revisados por nós.
            </p>
            <p>
              O conteúdo <strong>não prevê o futuro</strong> e <strong>não
              substitui</strong> orientação médica, psicológica, jurídica ou
              financeira. Use as leituras como reflexão, nunca como única base
              para decisões importantes.
            </p>
          </section>

          <section>
            <h2>2. O que é grátis e o que é pago</h2>
            <ul>
              <li><strong>Prévia do mapa:</strong> grátis, sem cadastro.</li>
              <li><strong>Mapa completo:</strong> {map}, pagamento único.</li>
              <li><strong>Compatibilidade do casal:</strong> + {compat}, junto com o mapa completo ou depois dele.</li>
              <li><strong>Numerologia do Nome:</strong> {name}, pagamento único.</li>
            </ul>
            <p>
              Não existe assinatura nem cobrança recorrente. Os preços podem
              mudar, mas valem sempre os que aparecem na hora da compra.
            </p>
          </section>

          <section>
            <h2>3. Pagamento e acesso</h2>
            <p>
              O pagamento é feito pelo Mercado Pago, por Pix ou cartão. O
              conteúdo é liberado automaticamente assim que o Mercado Pago
              confirma o pagamento, no mesmo link privado do seu mapa.
            </p>
            <p>
              Guarde esse link: é ele que dá acesso ao seu mapa, em qualquer
              aparelho. Quem tiver o link pode ver o conteúdo, então não o
              compartilhe com quem você não quer que veja. Você também pode
              baixar o PDF para guardar.
            </p>
          </section>

          <section id="garantia">
            <h2>4. Garantia de 7 dias e reembolso</h2>
            <p>
              Se você não gostar, devolvemos o seu dinheiro. Você tem
              <strong> 7 dias corridos a partir da compra</strong> para pedir
              o reembolso, sem precisar explicar o motivo.
            </p>
            <p>Como pedir:</p>
            <ol>
              <li>Escreva para <a href={`mailto:${CONTACT}`}>{CONTACT}</a> com o assunto <strong>&quot;Reembolso&quot;</strong>.</li>
              <li>Informe o <strong>e-mail usado na compra</strong> e o <strong>nome que está no mapa</strong>.</li>
              <li>Devolvemos 100% do valor pelo mesmo meio de pagamento, pelo Mercado Pago.</li>
            </ol>
            <p>
              No Pix, o dinheiro volta para a conta de origem. No cartão, o
              estorno aparece na fatura conforme o prazo do seu banco
              (normalmente de uma a duas faturas). Depois do reembolso, o
              acesso ao conteúdo pago daquele mapa é encerrado.
            </p>
            <p>
              Pedimos que você fale primeiro com a gente: assim resolvemos
              mais rápido do que por uma reclamação no Mercado Pago ou no
              banco do cartão.
            </p>
          </section>

          <section>
            <h2>5. Dados de outras pessoas</h2>
            <p>
              Ao fazer o mapa, a compatibilidade ou a numerologia de outra
              pessoa, você confirma que tem autorização para usar os dados
              dela. Mapas de crianças e adolescentes devem ser pedidos por um
              responsável, e recebem uma leitura adaptada, sem rótulos. A
              compatibilidade do casal e a numerologia do nome são só para
              maiores de 18 anos.
            </p>
          </section>

          <section>
            <h2>6. Uso do conteúdo</h2>
            <p>
              O mapa é para uso pessoal. Você pode compartilhar as imagens de
              stories e o seu PDF com amigos e familiares. Não é permitido
              revender os textos ou copiá-los para outros sites e serviços.
            </p>
          </section>

          <section>
            <h2>7. Problemas técnicos</h2>
            <p>
              Se o pagamento foi aprovado e o conteúdo não abriu, ou se você
              perdeu o link do seu mapa, escreva para{" "}
              <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. Resolvemos o mais
              rápido possível.
            </p>
          </section>

          <section>
            <h2>8. Privacidade</h2>
            <p>
              O uso dos seus dados segue a nossa{" "}
              <Link href="/privacidade">Política de Privacidade</Link>.
            </p>
          </section>

          <section>
            <h2>9. Mudanças nestes termos</h2>
            <p>
              Podemos atualizar estes termos. A data da última atualização
              fica no topo da página, e as compras já feitas seguem as regras
              da época da compra. Estes termos seguem a lei brasileira,
              incluindo o Código de Defesa do Consumidor.
            </p>
          </section>
        </article>

        <aside className="privacy-request-card">
          <span className="section-kicker">Fale com a gente</span>
          <h2>Dúvidas, reembolso ou problema de acesso?</h2>
          <p>
            Escreva para <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. Para
            reembolso, informe o e-mail da compra e o nome do mapa.
          </p>
          <Link className="primary-button" href="/#criar">
            Voltar ao meu mapa
          </Link>
        </aside>
      </div>
    </main>
  );
}
