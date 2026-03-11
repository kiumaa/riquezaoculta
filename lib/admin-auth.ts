import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const jwtSecretValue = process.env.JWT_SECRET;
if (process.env.NODE_ENV === "production" && !jwtSecretValue) {
  throw new Error("JWT_SECRET must be set in production");
}
const JWT_SECRET = jwtSecretValue || "fallback-secret-for-dev-only";
const secret = new TextEncoder().encode(JWT_SECRET);
const COOKIE_NAME = "ro_admin_session";

export async function createSession(payload: { role: string }) {
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(secret);

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
    });
}

export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, secret);
        return payload as { role: string };
    } catch {
        return null;
    }
}

export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

export async function isAdmin() {
    const session = await getSession();
    return session?.role === "admin";
}
