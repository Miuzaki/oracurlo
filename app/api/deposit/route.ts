import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_URL || "http://localhost:8090";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount } = body;

    if (!amount || amount < 1) {
      return NextResponse.json(
        { success: false, message: "Valor minimo de deposito e R$1,00" },
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

    // Convert amount from reais to centavos
    const amountCents = Math.round(Number(amount) * 100);

    // Call HistoryLab Operational API to create deposit
    const response = await fetch(
      `${API_BASE_URL}/api/operational/deposits`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ amountCents }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || "Erro ao processar deposito" },
        { status: response.status >= 400 ? response.status : 500 }
      );
    }

    // Response format: { success, data: { id, amountCents, status, pixQrCode, pixBrCode, expiresAt, createdAt } }
    const deposit = data.data;

    return NextResponse.json({
      success: true,
      data: {
        pix_code: deposit.pixBrCode,
        qr_code: deposit.pixQrCode,
        transaction_id: deposit.id,
        amount: deposit.amountCents / 100,
        value: deposit.amountCents,
        status: deposit.status,
        expiresAt: deposit.expiresAt,
      },
    });
  } catch (error) {
    console.error("[v0] Erro no deposit:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
