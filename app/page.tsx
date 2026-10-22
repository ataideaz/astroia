import AstroIAClient from "./astroia-client";
import { asaasAmountCents, paymentsEnabled } from "../lib/asaas";
import { productPrice } from "../lib/products";
import { readEnv } from "../lib/runtime-env";
export const dynamic = "force-dynamic";
export default function Home() {
  return (
    <AstroIAClient
      paymentAmountCents={asaasAmountCents()}
      compatAmountCents={productPrice("compat")}
      compatEnabled={Boolean(readEnv("MERCADO_PAGO_ACCESS_TOKEN"))}
      nameAmountCents={productPrice("name")}
      paymentsEnabled={paymentsEnabled()}
    />
  );
}
