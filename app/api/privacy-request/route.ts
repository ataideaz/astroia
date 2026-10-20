import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!(request.headers.get("content-type") ?? "").includes("application/json")) {
      return NextResponse.json(
        { error: "Envie os dados no formato correto." },
        { status: 415 },
      );
    }

    const body = (await request.json()) as {
      email?: string;
      requestType?: string;
      details?: string;
    };
    const { savePrivacyRequest } = await import(
      "../../../lib/privacy-requests"
    );
    const protocol = await savePrivacyRequest({
      email: body.email ?? "",
      requestType: body.requestType ?? "",
      details: body.details,
    });

    return NextResponse.json({
      success: true,
      protocol,
      message: "Solicitação recebida com sucesso.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível registrar sua solicitação.",
      },
      { status: 400 },
    );
  }
}
