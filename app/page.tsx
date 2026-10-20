import AstroIAClient from "./astroia-client";
import { asaasAmountCents, paymentsEnabled } from "../lib/asaas";
export const dynamic = "force-dynamic";
export default function Home() { return <AstroIAClient paymentAmountCents={asaasAmountCents()} paymentsEnabled={paymentsEnabled()} />; }
