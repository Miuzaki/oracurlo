import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE = "https://oauth-routes-cactus.grupoautoma.com";
const BRAND_SLUG = "apostatudo";

export async function GET() {
  try {
    console.log("[v0] ====== GET /api/auth/me ======");

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    const userId = cookieStore.get("auth_user_id")?.value;

    console.log("[v0] Token presente:", !!token);
    console.log("[v0] User ID presente:", !!userId, "valor:", userId);

    if (token) {
      console.log("[v0] Token (primeiros 80 chars):", token.substring(0, 80) + "...");
    }

    if (!token) {
      console.log("[v0] Nenhum token encontrado - retornando 401");
      return NextResponse.json(
        { success: false, message: "Nao autenticado" },
        { status: 401 }
      );
    }

    // Fetch user profile using the /api/auth/user endpoint with collection param
    const userUrl = `${API_BASE}/api/auth/user?collection=users_lari_dados`;
    console.log("[v0] Fazendo GET para:", userUrl);
    console.log("[v0] Headers: Authorization=Bearer ..., X-Brand-Slug=" + BRAND_SLUG + ", X-Cactus-Cookie-Key=" + (userId || "N/A"));

    const response = await fetch(userUrl, {
      method: "GET",
      headers: {
        "Accept": "*/*",
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Brand-Slug": BRAND_SLUG,
        ...(userId ? { "X-Cactus-Cookie-Key": userId } : {}),
      },
    });

    console.log("[v0] /user response status:", response.status);
    console.log("[v0] /user response ok:", response.ok);
    console.log("[v0] /user response headers content-type:", response.headers.get("content-type"));

    const responseText = await response.text();
    console.log("[v0] /user response body (primeiros 1000 chars):", responseText.substring(0, 1000));

    if (!response.ok) {
      console.log("[v0] Sessao invalida/expirada - limpando cookies");
      cookieStore.delete("auth_token");
      cookieStore.delete("auth_user_id");
      return NextResponse.json(
        { success: false, message: "Sessao expirada" },
        { status: 401 }
      );
    }

    let player;
    try {
      player = JSON.parse(responseText);
    } catch {
      console.log("[v0] Erro ao parsear JSON do /user:", responseText.substring(0, 200));
      cookieStore.delete("auth_token");
      cookieStore.delete("auth_user_id");
      return NextResponse.json(
        { success: false, message: "Resposta invalida do servidor" },
        { status: 502 }
      );
    }

    console.log("[v0] Player id:", player?.id, "name:", player?.name, "email:", player?.email);

    if (!player || !player.id) {
      console.log("[v0] Player sem id - sessao invalida. Keys:", player ? Object.keys(player) : "null");
      cookieStore.delete("auth_token");
      cookieStore.delete("auth_user_id");
      return NextResponse.json(
        { success: false, message: "Sessao invalida" },
        { status: 401 }
      );
    }

    console.log("[v0] Sessao valida - retornando dados do player");
    console.log("[v0] ====== /me COMPLETO ======");

    return NextResponse.json({
      success: true,
      data: { player },
    });
  } catch (error) {
    console.error("[v0] ====== ERRO CRITICO NO /me ======");
    console.error("[v0] Mensagem:", error instanceof Error ? error.message : String(error));
    console.error("[v0] Stack:", error instanceof Error ? error.stack : "N/A");
    return NextResponse.json(
      { success: false, message: "Erro ao verificar sessao" },
      { status: 500 }
    );
  }
}
