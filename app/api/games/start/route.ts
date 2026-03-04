import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

const API_BASE = "https://oauth-routes-cactus.grupoautoma.com";
const BRAND_SLUG = "apostatudo";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const platform = searchParams.get("platform") || "WEB";
    const useDemo = searchParams.get("use_demo") || "1";

    console.log("[v0] ====== GET /api/games/start ======");
    console.log("[v0] slug:", slug);
    console.log("[v0] platform:", platform);
    console.log("[v0] use_demo:", useDemo);

    if (!slug) {
      console.log("[v0] ERRO: slug ausente");
      return NextResponse.json(
        { success: false, message: "Slug do jogo e obrigatorio" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    const userId = cookieStore.get("auth_user_id")?.value;

    console.log("[v0] Token presente:", !!token);
    console.log("[v0] Token (primeiros 80 chars):", token ? token.substring(0, 80) + "..." : "NENHUM");
    console.log("[v0] User ID do cookie:", userId || "NENHUM");

    // List all cookies for debugging
    const allCookies = cookieStore.getAll();
    console.log("[v0] Todos os cookies:", allCookies.map(c => `${c.name}=${c.value.substring(0, 20)}...`));

    if (!token) {
      console.log("[v0] ERRO: nao autenticado - cookie auth_token nao encontrado");
      return NextResponse.json(
        { success: false, message: "Nao autenticado. Faca login novamente." },
        { status: 401 }
      );
    }

    const gameUrl = `${API_BASE}/api/start-game?slug=${encodeURIComponent(slug)}&platform=${encodeURIComponent(platform)}&use_demo=${encodeURIComponent(useDemo)}`;
    console.log("[v0] Fazendo GET para:", gameUrl);

    const requestHeaders: Record<string, string> = {
      "Accept": "application/json, text/plain, */*",
      "Authorization": `Bearer ${token}`,
      "X-Brand-Slug": BRAND_SLUG,
    };

    if (userId) {
      requestHeaders["X-Cactus-Cookie-Key"] = userId;
    }

    console.log("[v0] Headers enviados:", JSON.stringify({
      ...requestHeaders,
      Authorization: `Bearer ${token.substring(0, 40)}...`,
    }));

    const response = await fetch(gameUrl, {
      method: "GET",
      headers: requestHeaders,
    });

    console.log("[v0] start-game response status:", response.status);
    console.log("[v0] start-game response ok:", response.ok);
    console.log("[v0] start-game response headers:", JSON.stringify(Object.fromEntries(response.headers.entries())));

    const responseText = await response.text();
    console.log("[v0] start-game response body (primeiros 2000 chars):", responseText.substring(0, 2000));

    if (!response.ok) {
      console.log("[v0] ERRO: start-game falhou");
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText.substring(0, 200) };
      }
      return NextResponse.json(
        { success: false, message: errorData?.message || "Erro ao iniciar jogo" },
        { status: response.status }
      );
    }

    let gameData;
    try {
      gameData = JSON.parse(responseText);
    } catch {
      console.log("[v0] ERRO: nao foi possivel parsear JSON do start-game");
      return NextResponse.json(
        { success: false, message: "Resposta invalida do servidor de jogos" },
        { status: 502 }
      );
    }

    console.log("[v0] gameData keys:", Object.keys(gameData));
    console.log("[v0] gameData.url:", gameData?.url || gameData?.game_url || gameData?.data?.url || "N/A");
    console.log("[v0] ====== start-game COMPLETO ======");

    return NextResponse.json({
      success: true,
      data: gameData,
    });
  } catch (error) {
    console.error("[v0] ====== ERRO CRITICO NO start-game ======");
    console.error("[v0] Mensagem:", error instanceof Error ? error.message : String(error));
    console.error("[v0] Stack:", error instanceof Error ? error.stack : "N/A");
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
