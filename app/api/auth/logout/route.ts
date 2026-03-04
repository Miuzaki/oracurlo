import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("bearer_token");
    cookieStore.delete("connect_sid");
    cookieStore.delete("user_email");
    // Also clear legacy cookies from old implementation
    cookieStore.delete("auth_token");
    cookieStore.delete("auth_user_id");
    cookieStore.delete("auth_data");

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
