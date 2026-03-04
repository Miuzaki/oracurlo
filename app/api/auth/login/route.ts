import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE = "https://oauth-routes-cactus.grupoautoma.com";
const BRAND_SLUG = "apostatudo";

const SUPABASE_URL = "https://dufiwjtermmxfpcpeixd.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1Zml3anRlcm1teGZwY3BlaXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1ODc4NjAsImV4cCI6MjA3MDE2Mzg2MH0.lRw6CrAkjefy0mnSmdMYxFH6YRZI6j4-85WBh_hHCJE";

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

    // Step 1: Login to the external API to get access_token
    const loginUrl = `${API_BASE}/api/auth/login`;
    const loginBody = { email, password, app_source: "web" };

    const loginResponse = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/plain, */*",
        "X-Brand-Slug": BRAND_SLUG,
      },
      body: JSON.stringify(loginBody),
    });

    const loginText = await loginResponse.text();

    let loginData: Record<string, unknown>;
    try {
      loginData = JSON.parse(loginText);
    } catch {
      return NextResponse.json(
        { success: false, message: "Resposta invalida do servidor de autenticacao" },
        { status: 502 }
      );
    }

    if (!loginResponse.ok) {
      const message =
        loginData.message ||
        (loginData.error as Record<string, unknown>)?.message ||
        "Credenciais invalidas";
      return NextResponse.json(
        { success: false, message },
        { status: loginResponse.status || 422 }
      );
    }

    // Extract token and user data from login response
    const data = loginData.data as Record<string, unknown> | undefined;
    const token = (loginData.token || data?.token || data?.access_token || loginData.access_token) as string | undefined;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token nao encontrado na resposta" },
        { status: 500 }
      );
    }

    // Step 2: Get user profile using the token
    const userUrl = `${API_BASE}/api/auth/user?collection=users_lari_dados`;
    const userId = data?.id || (data?.user as Record<string, unknown>)?.id || loginData.id;

    const userResponse = await fetch(userUrl, {
      method: "GET",
      headers: {
        Accept: "*/*",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Brand-Slug": BRAND_SLUG,
        ...(userId ? { "X-Cactus-Cookie-Key": String(userId) } : {}),
      },
    });

    let player = null;
    const userText = await userResponse.text();

    if (userResponse.ok) {
      try {
        player = JSON.parse(userText);
      } catch {
        // fallback
      }
    }

    if (!player) {
      player = data?.user || data?.player || data;
    }

    // Step 3: Save session data in cookies for server-side use
    const cookieStore = await cookies();
    
    // Save the bearer token (from external API)
    cookieStore.set("bearer_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    // Save the connect_sid (user id from external API)
    const connectSid = String(player?.id || userId || "");
    cookieStore.set("connect_sid", connectSid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    // Save user email
    const userEmail = player?.email || email;
    cookieStore.set("user_email", userEmail, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    // Return session data to the frontend so it can save in sessionStorage
    return NextResponse.json({
      success: true,
      message: "Login realizado com sucesso",
      data: {
        player,
        // Return these so the frontend can save them for subsequent requests
        bearerToken: token,
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
