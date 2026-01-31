/**
 * POST /api/auth/logout
 *
 * Clear authentication cookies and log out.
 */

import { NextResponse } from "next/server";

import { logout } from "@/lib/auth";

export async function POST() {
  try {
    await logout();

    return NextResponse.json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
