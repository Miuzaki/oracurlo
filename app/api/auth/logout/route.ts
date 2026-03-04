import { NextResponse } from "next/server";

export async function POST() {
  // Session is managed entirely via sessionStorage on the client.
  // This endpoint exists so the frontend has a consistent API to call.
  return NextResponse.json({
    success: true,
    message: "Logout realizado com sucesso",
  });
}
