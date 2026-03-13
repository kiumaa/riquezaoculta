import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getProfileDistribution, getQuizSubmissions, getQuizSubmissionCount } from "@/lib/storage";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [submissions, profileDist, total] = await Promise.all([
    getQuizSubmissions(),
    getProfileDistribution(),
    getQuizSubmissionCount(),
  ]);

  return NextResponse.json({ submissions, profileDistribution: profileDist, total });
}
