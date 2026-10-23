"use client";

import { useEffect, useState } from "react";
import { flushPendingEvents, getConsent, loadMetaPixel, rememberAttribution, setConsent, trackVisit } from "../lib/ad-tracking";

/** Aviso de cookies (LGPD) + Pixel da Meta só depois do "Aceitar". */
export default function CookieConsent({ pixelId }: { pixelId?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    rememberAttribution();
    trackVisit();
    if (!pixelId) return;
    const consent = getConsent();
    let timer = 0;
    const show = () => { window.clearTimeout(timer); window.removeEventListener("scroll", show); setOpen(true); };
    if (consent === "granted") loadMetaPixel(pixelId);
    else if (consent === null) {
      // Não cobre a primeira impressão: aparece depois de alguns segundos ou na primeira rolagem.
      timer = window.setTimeout(show, 4000);
      window.addEventListener("scroll", show, { passive: true, once: true });
    }
    const reopen = () => setOpen(true);
    window.addEventListener("astroia-open-cookies", reopen);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", show);
      window.removeEventListener("astroia-open-cookies", reopen);
    };
  }, [pixelId]);

  if (!pixelId || !open) return null;

  function choose(value: "granted" | "denied") {
    setConsent(value);
    setOpen(false);
    if (value === "granted" && pixelId) { loadMetaPixel(pixelId); flushPendingEvents(true); }
    else flushPendingEvents(false);
    if (value === "granted") return;
    // Recusar depois de aceitar: recarrega para o Pixel sair da página.
    else if (value === "denied" && window.fbq) window.location.reload();
  }

  return (
    <div className="cookie-bar" role="dialog" aria-live="polite" aria-label="Aviso de cookies">
      <p>
        <strong>Posso usar cookies? 🍪</strong> Eles ajudam o AstroIA a mostrar anúncios para quem gosta de
        astrologia. Seu mapa e seus dados de nascimento nunca são compartilhados. <a href="/privacidade">Saiba mais</a>
      </p>
      <div className="cookie-actions">
        <button className="cookie-deny" onClick={() => choose("denied")} type="button">Recusar</button>
        <button className="cookie-accept" onClick={() => choose("granted")} type="button">Aceitar</button>
      </div>
    </div>
  );
}
