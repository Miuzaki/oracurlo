import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL = "https://dufiwjtermmxfpcpeixd.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1Zml3anRlcm1teGZwY3BlaXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1ODc4NjAsImV4cCI6MjA3MDE2Mzg2MH0.lRw6CrAkjefy0mnSmdMYxFH6YRZI6j4-85WBh_hHCJE";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const platform = searchParams.get("platform") || "WEB";
    const useDemo = searchParams.get("use_demo") || "0";

    if (!slug) {
      return NextResponse.json(
        { success: false, message: "Slug do jogo e obrigatorio" },
        { status: 400 }
      );
    }

    // Get auth data from cookies + fallback to headers
    const cookieStore = await cookies();

    let bearerToken = cookieStore.get("bearer_token")?.value;
    let connectSid = cookieStore.get("connect_sid")?.value;
    let userEmail = cookieStore.get("user_email")?.value;

    // Fallback: read from custom headers
    if (!bearerToken) {
      bearerToken = request.headers.get("x-bearer-token") || undefined;
    }
    if (!connectSid) {
      connectSid = request.headers.get("x-connect-sid") || undefined;
    }
    if (!userEmail) {
      userEmail = request.headers.get("x-user-email") || undefined;
    }

    if (!bearerToken || !connectSid) {
      return NextResponse.json(
        { success: false, message: "Nao autenticado. Faca login novamente." },
        { status: 401 }
      );
    }

    // Call Supabase Edge Function get-game-url
    // The gameSlug needs to be URL-encoded as per the curl example
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/get-game-url`,
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
          gameSlug: slug,
          platform,
          useDemo,
        }),
      }
    );

    const responseText = await response.text();

    let gameData: Record<string, unknown>;
    try {
      gameData = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { success: false, message: "Resposta invalida do servidor de jogos" },
        { status: 502 }
      );
    }

    if (!response.ok || !gameData.success) {
      return NextResponse.json(
        { success: false, message: (gameData.message as string) || "Erro ao iniciar jogo" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: gameData,
    });
  } catch (error) {
    console.error("[v0] Erro no start-game:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
