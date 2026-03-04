import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE = "https://oauth-routes-cactus.grupoautoma.com";
const BRAND_SLUG = "apostatudo";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log("[v0] ====== POST /api/auth/login ======");
    console.log("[v0] Email recebido:", email);
    console.log("[v0] Password presente:", !!password);

    if (!email || !password) {
      console.log("[v0] ERRO: email ou password ausentes");
      return NextResponse.json(
        { success: false, message: "Email e senha sao obrigatorios" },
        { status: 400 }
      );
    }

    // Step 1: Login to get the token
    const loginUrl = `${API_BASE}/api/auth/login`;
    const loginBody = { email, password, app_source: "web" };

    console.log("[v0] Fazendo POST para:", loginUrl);
    console.log("[v0] Body enviado:", JSON.stringify(loginBody));

    const loginResponse = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/plain, */*",
        "X-Brand-Slug": BRAND_SLUG,
      },
      body: JSON.stringify(loginBody),
    });

    console.log("[v0] Login response status:", loginResponse.status);
    console.log("[v0] Login response statusText:", loginResponse.statusText);

    const loginText = await loginResponse.text();
    console.log("[v0] Login response body (primeiros 1000 chars):", loginText.substring(0, 1000));

    let loginData: Record<string, unknown>;
    try {
      loginData = JSON.parse(loginText);
    } catch {
      console.log("[v0] ERRO: Nao foi possivel parsear JSON do login");
      return NextResponse.json(
        { success: false, message: "Resposta invalida do servidor de autenticacao" },
        { status: 502 }
      );
    }

    console.log("[v0] Login data keys:", Object.keys(loginData));
    console.log("[v0] Login data.success:", loginData.success);
    console.log("[v0] Login data.message:", loginData.message);

    if (!loginResponse.ok) {
      console.log("[v0] Login FALHOU - status:", loginResponse.status);
      const message =
        loginData.message ||
        (loginData.error as Record<string, unknown>)?.message ||
        "Credenciais invalidas";
      return NextResponse.json(
        { success: false, message },
        { status: loginResponse.status || 422 }
      );
    }

    // Extract token from response
    const data = loginData.data as Record<string, unknown> | undefined;
    const token = (loginData.token || data?.token || data?.access_token || loginData.access_token) as string | undefined;

    console.log("[v0] Token extraido:", token ? token.substring(0, 80) + "..." : "NENHUM TOKEN");

    if (!token) {
      console.log("[v0] ERRO: Nenhum token na resposta do login!");
      console.log("[v0] loginData completo:", JSON.stringify(loginData).substring(0, 2000));
      return NextResponse.json(
        { success: false, message: "Token nao encontrado na resposta" },
        { status: 500 }
      );
    }

    // Step 2: Fetch user profile using the user endpoint
    const userUrl = `${API_BASE}/api/auth/user?collection=users_lari_dados`;
    console.log("[v0] Fazendo GET para buscar perfil:", userUrl);

    // Extract user_id from login data for X-Cactus-Cookie-Key
    const userId = data?.id || (data?.user as Record<string, unknown>)?.id || loginData.id;
    console.log("[v0] User ID extraido para X-Cactus-Cookie-Key:", userId);

    const userResponse = await fetch(userUrl, {
      method: "GET",
      headers: {
        "Accept": "*/*",
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Brand-Slug": BRAND_SLUG,
        "Origin": "https://visionbacboo.site",
        "Referer": "https://visionbacboo.site/",
        ...(userId ? { "X-Cactus-Cookie-Key": String(userId) } : {}),
      },
    });

    console.log("[v0] User response status:", userResponse.status);
    console.log("[v0] User response ok:", userResponse.ok);

    let player = null;
    const userText = await userResponse.text();
    console.log("[v0] User response body (primeiros 1000 chars):", userText.substring(0, 1000));

    if (userResponse.ok) {
      try {
        player = JSON.parse(userText);
        console.log("[v0] Player parseado - id:", player?.id, "name:", player?.name, "email:", player?.email);
      } catch {
        console.log("[v0] Erro ao parsear JSON do user profile");
      }
    } else {
      console.log("[v0] Falha ao buscar user profile, usando dados do login como fallback");
      player = data?.user || data?.player || data;
    }

    // Store token in HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    // Store user_id for X-Cactus-Cookie-Key in session verification
    const playerId = player?.id || userId;
    if (playerId) {
      cookieStore.set("auth_user_id", String(playerId), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      console.log("[v0] Cookie auth_user_id definido:", playerId);
    }

    console.log("[v0] Cookies definidos com sucesso");
    console.log("[v0] ====== LOGIN COMPLETO ======");

    return NextResponse.json({
      success: true,
      message: "Login realizado com sucesso",
      data: { player },
    });
  } catch (error) {
    console.error("[v0] ====== ERRO CRITICO NO LOGIN ======");
    console.error("[v0] Mensagem:", error instanceof Error ? error.message : String(error));
    console.error("[v0] Stack:", error instanceof Error ? error.stack : "N/A");
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
