import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_URL || "http://localhost:8090";

export async function POST(request: Request) {
  try {
    // Read auth token from Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
      // Call HistoryLab Operational API to logout
      await fetch(`${API_BASE_URL}/api/operational/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Logout realizado com sucesso",
    });
  } catch (error) {
    console.error("[v0] Erro no logout:", error instanceof Error ? error.message : String(error));
    // Even if external logout fails, we return success as the client session will be cleared
    return NextResponse.json({
      success: true,
      message: "Logout realizado",
    });
  }
}
