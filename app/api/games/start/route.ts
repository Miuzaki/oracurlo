import { NextResponse, type NextRequest } from "next/server";

const API_BASE_URL = process.env.API_URL || "http://localhost:8090";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const platform = searchParams.get("platform") || "desktop";
    const useDemo = searchParams.get("use_demo") || "0";

    if (!slug) {
      return NextResponse.json(
        { success: false, message: "Slug do jogo e obrigatorio" },
        { status: 400 }
      );
    }

    // Read auth token from Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Nao autenticado. Faca login novamente." },
        { status: 401 }
      );
    }

    // Build query params for the HistoryLab API
    const apiParams = new URLSearchParams();
    apiParams.set("platform", platform);
    if (useDemo === "1") {
      apiParams.set("demo", "1");
    }

    // Call HistoryLab Operational API to start game
    const response = await fetch(
      `${API_BASE_URL}/api/operational/games/${encodeURIComponent(slug)}/start?${apiParams.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      }
    );

    const gameData = await response.json();

    if (!response.ok || !gameData.success) {
      return NextResponse.json(
        { success: false, message: gameData.message || "Erro ao iniciar jogo" },
        { status: response.status >= 400 ? response.status : 500 }
      );
    }

    // Response format: { success, data: { launchUrl, gameSlug, platform, isDemo } }
    return NextResponse.json({
      success: true,
      data: {
        game_url: gameData.data.launchUrl,
        gameSlug: gameData.data.gameSlug,
        platform: gameData.data.platform,
        isDemo: gameData.data.isDemo,
      },
    });
  } catch (error) {
    console.error("[v0] Erro no start-game:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
