"use client";

import { useEffect, useState } from "react";
import { getConsent, loadMetaPixel, rememberAttribution, setConsent, trackVisit } from "../lib/ad-tracking";

/** Aviso de cookies (LGPD) + Pixel da Meta só depois do "Aceitar". */
export default function CookieConsent({ pixelId }: { pixelId?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    rememberAttribution();
    trackVisit();
    if (!pixelId) return;
    const consent = getConsent();
    if (consent === "granted") loadMetaPixel(pixelId);
    else if (consent === null) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener("astroia-open-cookies", reopen);
    return () => window.removeEventListener("astroia-open-cookies", reopen);
  }, [pixelId]);

  if (!pixelId || !open) return null;

  function choose(value: "granted" | "denied") {
    setConsent(value);
    setOpen(false);
    if (value === "granted" && pixelId) loadMetaPixel(pixelId);
    // Recusar depois de aceitar: recarrega para o Pixel sair da página.
    else if (value === "denied" && window.fbq) window.location.reload();
  }

  return (
    <div className="cookie-bar" role="dialog" aria-live="polite" aria-label="Aviso de cookies">
      <p>
        🍪 Usamos cookies para saber quais anúncios trazem as pessoas até aqui. Seu mapa e seus dados de
        nascimento nunca são compartilhados. <a href="/privacidade">Saiba mais</a>
      </p>
      <div className="cookie-actions">
        <button className="cookie-deny" onClick={() => choose("denied")} type="button">Recusar</button>
        <button className="cookie-accept" onClick={() => choose("granted")} type="button">Aceitar</button>
      </div>
    </div>
  );
}
