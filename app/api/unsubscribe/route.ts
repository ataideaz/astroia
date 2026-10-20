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

    const body = (await request.json()) as { email?: string };
    const { unsubscribeMarketing } = await import(
      "../../../lib/marketing-leads"
    );
    await unsubscribeMarketing(body.email ?? "");

    return NextResponse.json({
      success: true,
      message:
        "Descadastro concluído. Este e-mail não receberá novas comunicações de marketing do AstroIA.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível concluir o descadastro.",
      },
      { status: 400 },
    );
  }
}
