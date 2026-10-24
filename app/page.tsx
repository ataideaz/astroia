import AstroIAClient from "./astroia-client";
import CookieConsent from "./cookie-consent";
import { asaasAmountCents, paymentsEnabled } from "../lib/asaas";
import { offerV2, productPrice } from "../lib/products";
import { readEnv } from "../lib/runtime-env";
export const dynamic = "force-dynamic";
export default function Home() {
  return (
    <>
    <CookieConsent pixelId={readEnv("META_PIXEL_ID")} />
    <AstroIAClient
      paymentAmountCents={asaasAmountCents()}
      compatAmountCents={productPrice("compat")}
      compatEnabled={Boolean(readEnv("MERCADO_PAGO_ACCESS_TOKEN"))}
      nameAmountCents={productPrice("name")}
      paymentsEnabled={paymentsEnabled()}
      offerV2={offerV2()}
      directPayments={Boolean(readEnv("MERCADO_PAGO_PUBLIC_KEY") && readEnv("MERCADO_PAGO_ACCESS_TOKEN"))}
    />
    </>
  );
}
