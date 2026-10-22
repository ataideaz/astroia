import type { Metadata } from "next";
import PainelClient from "./painel-client";

export const metadata: Metadata = {
  title: "Painel — AstroIA",
  robots: { index: false, follow: false },
};

export default function PainelPage() {
  return <PainelClient />;
}
