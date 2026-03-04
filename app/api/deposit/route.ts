import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE = "https://oauth-routes-cactus.grupoautoma.com";
const BRAND_SLUG = "apostatudo";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount } = body;

    console.log("[v0] ====== POST /api/deposit ======");
    console.log("[v0] Amount recebido:", amount);

    if (!amount || amount < 1) {
      return NextResponse.json(
        { success: false, message: "Valor minimo de deposito e R$1,00" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    const userId = cookieStore.get("auth_user_id")?.value;

    console.log("[v0] Token presente:", !!token);
    console.log("[v0] User ID:", userId);

    if (!token || !userId) {
      return NextResponse.json(
        { success: false, message: "Nao autenticado. Faca login novamente." },
        { status: 401 }
      );
    }

    const depositUrl = `${API_BASE}/api/deposit`;
    console.log("[v0] Fazendo POST para:", depositUrl);

    const depositBody = {
      amount: Number(amount),
      user_id: userId,
    };

    console.log("[v0] Body enviado:", JSON.stringify(depositBody));

    const response = await fetch(depositUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/plain, */*",
        "Authorization": `Bearer ${token}`,
        "X-Brand-Slug": BRAND_SLUG,
        "Origin": "https://visionbacboo.site",
        "Referer": "https://visionbacboo.site/",
      },
      body: JSON.stringify(depositBody),
    });

    console.log("[v0] Deposit response status:", response.status);

    const responseText = await response.text();
    console.log("[v0] Deposit response body:", responseText.substring(0, 1000));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.log("[v0] Erro ao parsear JSON do deposit");
      return NextResponse.json(
        { success: false, message: "Resposta invalida do servidor" },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data?.message || "Erro ao processar deposito" },
        { status: response.status }
      );
    }

    console.log("[v0] Deposit sucesso:", JSON.stringify(data).substring(0, 500));
    console.log("[v0] ====== DEPOSIT COMPLETO ======");

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("[v0] ====== ERRO CRITICO NO DEPOSIT ======");
    console.error("[v0] Mensagem:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
