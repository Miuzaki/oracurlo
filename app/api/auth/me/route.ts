import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_URL || "http://localhost:8090";

export async function GET(request: Request) {
  try {
    // Read auth token from Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Nao autenticado" },
        { status: 401 }
      );
    }

    // Call HistoryLab Operational API to get user profile
    const meResponse = await fetch(
      `${API_BASE_URL}/api/operational/auth/me`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      }
    );

    const meData = await meResponse.json();

    if (!meResponse.ok || !meData.success) {
      return NextResponse.json(
        { success: false, message: meData.message || "Sessao expirada" },
        { status: 401 }
      );
    }

    // Get balance from provider
    const balanceResponse = await fetch(
      `${API_BASE_URL}/api/operational/auth/balance`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      }
    );

    let balance = 0;
    let currency = "BRL";
    
    if (balanceResponse.ok) {
      const balanceData = await balanceResponse.json();
      if (balanceData.success && balanceData.data) {
        balance = balanceData.data.balance || 0;
        currency = balanceData.data.currency || "BRL";
      }
    }

    const user = meData.data;

    const player = {
      id: user.id,
      email: user.email,
      name: user.name,
      externalId: user.externalId,
      tenantId: user.tenantId,
      wallet: {
        balance: balance,
        credit: balance,
        available_value: balance,
        currency: currency,
      },
      _cached: {
        "get-credits": {
          credit: balance,
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
