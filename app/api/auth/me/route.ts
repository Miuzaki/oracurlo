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

export async function GET(request: Request) {
  try {
    // Read auth data from custom headers (frontend sends from sessionStorage)
    const bearerToken = request.headers.get("x-bearer-token");
    const connectSid = request.headers.get("x-connect-sid");
    const userEmail = request.headers.get("x-user-email");

    if (!bearerToken || !connectSid || !userEmail) {
      return NextResponse.json(
        { success: false, message: "Nao autenticado" },
        { status: 401 }
      );
    }

    // Call Supabase Edge Function get-user-balance
    const balanceResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/get-user-balance`,
      {
        method: "POST",
        headers: supabaseHeaders(),
        body: JSON.stringify({
          bearerToken,
          connectSid,
          userEmail,
        }),
      }
    );

    const balanceText = await balanceResponse.text();
    console.log("[v0] get-user-balance status:", balanceResponse.status);
    console.log("[v0] get-user-balance response:", balanceText.substring(0, 500));

    let balanceData: Record<string, unknown>;
    try {
      balanceData = JSON.parse(balanceText);
    } catch {
      return NextResponse.json(
        { success: false, message: "Resposta invalida do servidor" },
        { status: 502 }
      );
    }

    if (!balanceResponse.ok || !balanceData.success) {
      return NextResponse.json(
        { success: false, message: (balanceData.message as string) || "Sessao expirada" },
        { status: 401 }
      );
    }

    // Response format: { success, saldo, saldo_formatted, wallet: { id, balance, credit, ... } }
    const wallet = balanceData.wallet as Record<string, unknown> | undefined;

    const player = {
      id: connectSid,
      email: userEmail,
      name: userEmail,
      wallet: {
        balance: wallet?.balance ?? 0,
        credit: wallet?.credit ?? 0,
        available_value: wallet?.available_value ?? 0,
        bonus: wallet?.bonus ?? 0,
      },
      _cached: {
        "get-credits": {
          credit: (balanceData.saldo as number) ?? 0,
          bonus: (wallet?.bonus as number) ?? 0,
        },
      },
    };

    return NextResponse.json({
      success: true,
      data: { player },
    });
  } catch (error) {
    console.error("[v0] Erro no /me:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, message: "Erro ao verificar sessao" },
      { status: 500 }
    );
  }
}
