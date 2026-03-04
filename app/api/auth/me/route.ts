import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SUPABASE_URL = "https://dufiwjtermmxfpcpeixd.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1Zml3anRlcm1teGZwY3BlaXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1ODc4NjAsImV4cCI6MjA3MDE2Mzg2MH0.lRw6CrAkjefy0mnSmdMYxFH6YRZI6j4-85WBh_hHCJE";

export async function GET(request: Request) {
  try {
    // Try cookies first, then fall back to custom headers from frontend
    const cookieStore = await cookies();
    
    let bearerToken = cookieStore.get("bearer_token")?.value;
    let connectSid = cookieStore.get("connect_sid")?.value;
    let userEmail = cookieStore.get("user_email")?.value;

    // Fallback: read from custom headers (frontend sends these from sessionStorage)
    if (!bearerToken) {
      bearerToken = request.headers.get("x-bearer-token") || undefined;
    }
    if (!connectSid) {
      connectSid = request.headers.get("x-connect-sid") || undefined;
    }
    if (!userEmail) {
      userEmail = request.headers.get("x-user-email") || undefined;
    }

    if (!bearerToken || !connectSid || !userEmail) {
      return NextResponse.json(
        { success: false, message: "Nao autenticado" },
        { status: 401 }
      );
    }

    // Call Supabase Edge Function get-user-balance to verify session and get balance
    const balanceResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/get-user-balance`,
      {
        method: "POST",
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          bearerToken,
          connectSid,
          userEmail,
        }),
      }
    );

    const balanceText = await balanceResponse.text();
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
      // Session expired or invalid
      cookieStore.delete("bearer_token");
      cookieStore.delete("connect_sid");
      cookieStore.delete("user_email");
      return NextResponse.json(
        { success: false, message: (balanceData.message as string) || "Sessao expirada" },
        { status: 401 }
      );
    }

    // Also get user profile from Supabase Edge Function
    const profileResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/get-user-profile`,
      {
        method: "POST",
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ userEmail }),
      }
    );

    let profileData: Record<string, unknown> = {};
    try {
      const profileText = await profileResponse.text();
      profileData = JSON.parse(profileText);
    } catch {
      // profile is optional, continue
    }

    // Build a player object from the balance + profile data
    const player = {
      id: connectSid,
      email: userEmail,
      name: (profileData.nome as string) || userEmail,
      wallet: {
        balance: balanceData.saldo ?? balanceData.balance ?? 0,
        credit: balanceData.saldo ?? balanceData.balance ?? 0,
      },
      _cached: {
        "get-credits": {
          credit: balanceData.saldo ?? balanceData.balance ?? 0,
          bonus: 0,
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
