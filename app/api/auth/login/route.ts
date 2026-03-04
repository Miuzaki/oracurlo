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
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email e senha sao obrigatorios" },
        { status: 400 }
      );
    }

    // Step 1: Call Supabase Edge Function external-login
    const loginResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/external-login`,
      {
        method: "POST",
        headers: supabaseHeaders(),
        body: JSON.stringify({ email, password }),
      }
    );

    const loginText = await loginResponse.text();
    console.log("[v0] external-login status:", loginResponse.status);
    console.log("[v0] external-login response:", loginText.substring(0, 500));

    let loginData: Record<string, unknown>;
    try {
      loginData = JSON.parse(loginText);
    } catch {
      return NextResponse.json(
        { success: false, message: "Resposta invalida do servidor de autenticacao" },
        { status: 502 }
      );
    }

    if (!loginResponse.ok || !loginData.success) {
      const message =
        (loginData.message as string) || "Credenciais invalidas";
      return NextResponse.json(
        { success: false, message },
        { status: loginResponse.status >= 400 ? loginResponse.status : 422 }
      );
    }

    // Response format: { success, user: { id, name, email }, access_token, token_type, expires_in, connect_sid }
    const accessToken = loginData.access_token as string;
    const connectSid = String(loginData.connect_sid || "");
    const userObj = loginData.user as Record<string, unknown> | undefined;
    const userEmail = (userObj?.email as string) || email;
    const userName = (userObj?.name as string) || email;
    const userId = userObj?.id;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: "Token nao encontrado na resposta" },
        { status: 500 }
      );
    }

    // Build player object from login response
    const player = {
      id: userId || connectSid,
      name: userName,
      email: userEmail,
    };

    // Return session data to the frontend
    return NextResponse.json({
      success: true,
      message: "Login realizado com sucesso",
      data: {
        player,
        bearerToken: accessToken,
        connectSid,
        userEmail,
      },
    });
  } catch (error) {
    console.error("[v0] Erro critico no login:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
