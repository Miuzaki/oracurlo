import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_URL || "http://localhost:8090";
const TENANT_SLUG = process.env.NEXT_PUBLIC_TENANT_SLUG || "oraculo-aviator";

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

    // Call HistoryLab Operational API login
    const loginResponse = await fetch(
      `${API_BASE_URL}/api/operational/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantSlug: TENANT_SLUG,
          email,
          password,
        }),
      }
    );

    const loginData = await loginResponse.json();

    if (!loginResponse.ok || !loginData.success) {
      const message = loginData.message || "Credenciais invalidas";
      return NextResponse.json(
        { success: false, message },
        { status: loginResponse.status >= 400 ? loginResponse.status : 422 }
      );
    }

    // Response format: { success, data: { token, user: { id, email, name, tenantId, identityType } } }
    const { token, user } = loginData.data;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token nao encontrado na resposta" },
        { status: 500 }
      );
    }

    // Build player object from login response
    const player = {
      id: user.id,
      name: user.name,
      email: user.email,
      externalId: user.externalId,
      tenantId: user.tenantId,
    };

    // Return session data to the frontend
    return NextResponse.json({
      success: true,
      message: "Login realizado com sucesso",
      data: {
        player,
        token,
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
