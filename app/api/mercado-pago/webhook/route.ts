import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function receiveNotification(request: Request) {
  try {
    const url = new URL(request.url);
    const body = request.method === "POST" ? await request.json().catch(() => ({})) : {};
    const payload = body as {
      type?: string;
      topic?: string;
      data?: { id?: string | number };
      id?: string | number;
    };
    const type = payload.type || payload.topic || url.searchParams.get("type");
    const paymentId = String(
      payload.data?.id || payload.id || url.searchParams.get("data.id") || "",
    );

    if ((type === "payment" || !type) && paymentId) {
      const { syncPaymentById } = await import(
        "../../../../lib/mercado-pago"
      );
      await syncPaymentById(paymentId);
    }
  } catch {
    // A notificação nunca é usada como prova isolada: o servidor consulta a API
    // autenticada do Mercado Pago antes de alterar um pedido.
  }

  return NextResponse.json({ received: true });
}

export async function POST(request: Request) {
  return receiveNotification(request);
}

export async function GET(request: Request) {
  return receiveNotification(request);
}
