import { NextRequest } from "next/server";
import { forwardJsonBody } from "@/lib/backend-api";

export async function POST(request: NextRequest) {
  return forwardJsonBody(request, "/auth/password", "POST");
}
