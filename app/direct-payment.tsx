"use client";

import { useEffect, useRef, useState } from "react";

// Pagamento dentro do AstroIA (Checkout Bricks do Mercado Pago): Pix e cartão,
// sem login e sem criar conta. Os dados do cartão ficam nos campos seguros do
// Mercado Pago; o nosso servidor recebe só um token.

type BrickController = { unmount: () => void };
type MercadoPagoSdk = new (publicKey: string, options?: { locale?: string }) => {
  bricks: () => { create: (type: string, containerId: string, settings: unknown) => Promise<BrickController> };
};
declare global {
  interface Window { MercadoPago?: MercadoPagoSdk }
}

let sdkPromise: Promise<void> | null = null;
function loadSdk() {
  if (window.MercadoPago) return Promise.resolve();
  if (!sdkPromise) {
    sdkPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://sdk.mercadopago.com/js/v2";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => { sdkPromise = null; reject(new Error("sdk")); };
      document.head.appendChild(script);
    });
  }
  return sdkPromise;
}

export type PixInfo = { code: string; image: string; url: string };

type Props = {
  publicKey: string;
  amount: number;
  email: string;
  orderId: string;
  reportToken: string;
  onApproved: () => void;
  onPix: (pix: PixInfo) => void;
  onFallback: () => void;
  /** Pix direto: gera o código na hora, sem passar pelo formulário. */
  autoPix?: boolean;
  /** Pix que já veio pronto junto com o pedido (mostra o QR Code na hora). */
  initialPix?: PixInfo | null;
};

export function DirectPayment({ publicKey, amount, email, orderId, reportToken, onApproved, onPix, onFallback, autoPix, initialPix }: Props) {
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [pix, setPix] = useState<PixInfo | null>(initialPix?.code ? initialPix : null);
  const [copied, setCopied] = useState(false);
  // "pix": gera o Pix direto (1 toque). "brick": formulário do Mercado Pago (cartão).
  const [view, setView] = useState<"pix" | "brick">(autoPix ? "pix" : "brick");
  const controller = useRef<BrickController | null>(null);
  // Callbacks em ref: re-renderizar a tela não recria o formulário de pagamento.
  const callbacks = useRef({ onApproved, onPix });
  callbacks.current = { onApproved, onPix };
  const containerId = `mp-brick-${orderId.slice(-8)}-${attempt}`;

  useEffect(() => {
    if (view !== "pix" || pix) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/pay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportToken, orderId, formData: { payment_method_id: "pix" } }),
        });
        const result = await response.json() as { approved?: boolean; error?: string; pix?: PixInfo | null };
        if (cancelled) return;
        if (result.approved) { callbacks.current.onApproved(); return; }
        if (!response.ok || !result.pix?.code) throw new Error(result.error || "pix");
        setPix(result.pix); callbacks.current.onPix(result.pix);
      } catch {
        if (cancelled) return;
        setMessage("Não deu para gerar o Pix agora. Escolha a forma de pagamento abaixo.");
        setView("brick");
      }
    })();
    return () => { cancelled = true; };
  }, [view, pix, orderId, reportToken]);

  useEffect(() => {
    if (view !== "brick" || pix) return;
    let cancelled = false;
    setReady(false);
    (async () => {
      try {
        await loadSdk();
        if (cancelled || !window.MercadoPago) return;
        const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" });
        const brick = await mp.bricks().create("payment", containerId, {
          initialization: { amount, payer: { email } },
          customization: {
            visual: {
              hideFormTitle: true,
              style: {
                theme: "dark",
                // Cores e tamanhos do AstroIA: letras maiores e botão dourado.
                customVariables: {
                  baseColor: "#f0d69d",
                  baseColorFirstVariant: "#e4bc72",
                  baseColorSecondVariant: "#c9a6ff",
                  buttonTextColor: "#1a1530",
                  formBackgroundColor: "#17132f",
                  inputBackgroundColor: "#211b40",
                  textPrimaryColor: "#f4f0ff",
                  textSecondaryColor: "#c7bfe6",
                  outlinePrimaryColor: "#5a4d99",
                  fontSizeSmall: "15px",
                  fontSizeMedium: "17px",
                  fontSizeLarge: "19px",
                  fontSizeExtraLarge: "22px",
                  borderRadiusMedium: "14px",
                  borderRadiusLarge: "18px",
                  formPadding: "18px",
                  inputVerticalPadding: "14px",
                },
              },
            },
            paymentMethods: { bankTransfer: "all", creditCard: "all", debitCard: "all", maxInstallments: 1 },
          },
          callbacks: {
            onReady: () => { if (!cancelled) setReady(true); },
            onError: (error: { type?: string }) => {
              console.warn("Mercado Pago Brick", error);
              if (error?.type === "critical" && !cancelled) setFailed(true);
            },
            onSubmit: async ({ formData }: { formData: unknown }) => {
              setMessage("");
              try {
                const response = await fetch("/api/pay", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ reportToken, orderId, formData }),
                });
                const result = await response.json() as { approved?: boolean; status?: string; message?: string; error?: string; pix?: PixInfo | null };
                if (!response.ok) throw new Error(result.error || "Não foi possível processar o pagamento.");
                if (result.approved) { callbacks.current.onApproved(); return; }
                if (result.pix) { setPix(result.pix); callbacks.current.onPix(result.pix); return; }
                if (result.status === "in_process" || result.status === "pending") {
                  setMessage("O banco está analisando o pagamento. Assim que ele aprovar, o conteúdo abre aqui sozinho.");
                  callbacks.current.onPix({ code: "", image: "", url: "" });
                  return;
                }
                throw new Error(result.message || "O pagamento não foi aprovado. Tente outro cartão ou pague com Pix.");
              } catch (error) {
                setMessage(error instanceof Error ? error.message : "Não foi possível processar o pagamento.");
                // Recria o formulário para a pessoa tentar de novo.
                window.setTimeout(() => setAttempt((value) => value + 1), 50);
              }
            },
          },
        });
        if (cancelled) brick.unmount(); else controller.current = brick;
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      try { controller.current?.unmount(); } catch { /* já desmontado */ }
      controller.current = null;
    };
  }, [publicKey, amount, email, orderId, reportToken, containerId, pix, view]);

  async function copyPix() {
    if (!pix?.code) return;
    try {
      await navigator.clipboard.writeText(pix.code);
    } catch {
      const area = document.createElement("textarea");
      area.value = pix.code; document.body.appendChild(area); area.select();
      try { document.execCommand("copy"); } catch { /* sem cópia */ }
      area.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  }

  if (pix?.code) {
    return (
      <div className="dp-pix">
        <h3>Pague com Pix</h3>
        <ol>
          <li>Toque em <strong>Copiar código Pix</strong>.</li>
          <li>Abra o app do seu banco → Pix → <strong>Pix Copia e Cola</strong>.</li>
          <li>Cole e confirme. Pronto: aqui libera sozinho em segundos.</li>
        </ol>
        <p className="dp-receiver">
          <span aria-hidden="true">🔒</span>
          <span>No app do banco, o recebedor aparece como <b>ATAIDE DE AZEVEDO NETTO</b>, o responsável pelo AstroIA, com pagamento processado pelo Mercado Pago. Pode pagar tranquilo: o seu conteúdo libera aqui na hora.</span>
        </p>
        <button className="checkout-primary dp-copy" onClick={copyPix} type="button">
          {copied ? "✓ Código copiado!" : "Copiar código Pix"}
        </button>
        {pix.image ? <img alt="QR Code do Pix" className="dp-qr" src={`data:image/png;base64,${pix.image}`} /> : null}
        <p className="dp-hint">No computador? Aponte a câmera do celular para o QR Code no app do banco.</p>
        <p className="dp-wait"><span className="dp-dot" aria-hidden="true" /> Esperando o pagamento… o código vale por 30 minutos.</p>
        <button className="dp-alt" onClick={() => { setPix(null); setMessage(""); setView("brick"); }} type="button">Prefiro pagar com cartão</button>
      </div>
    );
  }

  if (view === "pix") {
    return (
      <div className="dp-pix">
        <p className="dp-loading">Gerando o seu Pix…</p>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="dp-fallback">
        <p>Não conseguimos abrir o formulário de pagamento aqui.</p>
        <button className="checkout-primary" onClick={onFallback} type="button">Pagar pelo site do Mercado Pago →</button>
      </div>
    );
  }

  return (
    <div className="dp-wrap">
      <div className="dp-trust">
        <span className="dp-trust-icon" aria-hidden="true">🔒</span>
        <div>
          <strong>Pagamento 100% seguro pelo Mercado Pago</strong>
          <small>Os dados do cartão vão direto para o Mercado Pago, não passam pelo AstroIA. Pix aprovado em segundos.</small>
        </div>
      </div>
      {!ready ? <p className="dp-loading">Carregando pagamento seguro…</p> : null}
      {message ? <p className="checkout-payment-message" role="alert">{message}</p> : null}
      <div className="dp-brick" id={containerId} key={containerId} />
      <ul className="dp-badges" aria-label="Garantias">
        <li><span aria-hidden="true">✓</span> Sem login e sem criar conta</li>
        <li><span aria-hidden="true">✓</span> Liberado na hora</li>
        <li><span aria-hidden="true">✓</span> Garantia de 7 dias</li>
      </ul>
      <button className="dp-alt" onClick={onFallback} type="button">Prefiro pagar pelo site do Mercado Pago</button>
    </div>
  );
}
