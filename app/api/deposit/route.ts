import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SUPABASE_URL = "https://dufiwjtermmxfpcpeixd.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1Zml3anRlcm1teGZwY3BlaXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1ODc4NjAsImV4cCI6MjA3MDE2Mzg2MH0.lRw6CrAkjefy0mnSmdMYxFH6YRZI6j4-85WBh_hHCJE";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount } = body;

    if (!amount || amount < 1) {
      return NextResponse.json(
        { success: false, message: "Valor minimo de deposito e R$1,00" },
        { status: 400 }
      );
    }

    // Get auth data from cookies + fallback to headers
    const cookieStore = await cookies();

    let bearerToken = cookieStore.get("bearer_token")?.value;
    let connectSid = cookieStore.get("connect_sid")?.value;
    let userEmail = cookieStore.get("user_email")?.value;

    if (!bearerToken) {
      bearerToken = request.headers.get("x-bearer-token") || undefined;
    }
    if (!connectSid) {
      connectSid = request.headers.get("x-connect-sid") || undefined;
    }
    if (!userEmail) {
      userEmail = request.headers.get("x-user-email") || undefined;
    }

    if (!bearerToken || !userEmail) {
      return NextResponse.json(
        { success: false, message: "Nao autenticado. Faca login novamente." },
        { status: 401 }
      );
    }

    // Call Supabase Edge Function generate-pix
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/generate-pix`,
      {
        method: "POST",
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email: userEmail,
          valor: Number(amount),
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
        { success: false, message: (data.message as string) || "Erro ao processar deposito" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("[v0] Erro no deposit:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
