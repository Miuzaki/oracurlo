import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    console.log("[v0] ====== POST /api/auth/logout ======");

    const cookieStore = await cookies();
    cookieStore.delete("auth_token");
    cookieStore.delete("auth_user_id");
    cookieStore.delete("auth_data");

    console.log("[v0] Cookies removidos com sucesso");

    return NextResponse.json({
      success: true,
      message: "Logout realizado com sucesso",
    });
  } catch (error) {
    console.error("[v0] Erro no logout:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao realizar logout" },
      { status: 500 }
    );
  }
}
