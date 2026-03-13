import { NextResponse } from "next/server";
import { getLeadIdByPhone, insertQuizSubmission, updateLeadQuizProfile } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const { phone, answers, scores, profile, profileTitle } = await req.json();
    if (!phone || !profile || !answers || !scores) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const leadId = await getLeadIdByPhone(phone);
    await insertQuizSubmission({ leadId, phone, answers, scores, profile, profileTitle });
    if (leadId) await updateLeadQuizProfile(leadId, profile);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
