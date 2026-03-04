import { NextResponse } from "next/server";

const SUPABASE_URL = "https://dufiwjtermmxfpcpeixd.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1Zml3anRlcm1teGZwY3BlaXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1ODc4NjAsImV4cCI6MjA3MDE2Mzg2MH0.lRw6CrAkjefy0mnSmdMYxFH6YRZI6j4-85WBh_hHCJE";

function supabaseHeaders(): Record<string, string> {
  return {
    "Accept": "*/*",
    "Content-Type": "application/json",
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transaction_id } = body;

    if (!transaction_id) {
      return NextResponse.json(
        { success: false, message: "ID da transacao e obrigatorio" },
        { status: 400 }
      );
    }

    const userEmail = request.headers.get("x-user-email");

    if (!userEmail) {
      return NextResponse.json(
        { success: false, message: "Nao autenticado." },
        { status: 401 }
      );
    }

    // Call Supabase Edge Function check-deposit-status
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/check-deposit-status`,
      {
        method: "POST",
        headers: supabaseHeaders(),
        body: JSON.stringify({
          email: userEmail,
          transaction_id,
        }),
      }
    );

    const responseText = await response.text();

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { success: false, message: "Resposta invalida do servidor" },
        { status: 502 }
      );
    }

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: (data.message as string) || "Erro ao verificar status" },
        { status: response.status >= 400 ? response.status : 500 }
      );
    }

    // Response: { success, id, amount, status }
    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        amount: data.amount,
        status: data.status,
      },
    });
  } catch (error) {
    console.error("[v0] Erro no check-deposit-status:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
