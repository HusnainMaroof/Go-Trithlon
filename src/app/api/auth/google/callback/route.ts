import { NextResponse } from "next/server";
import axios from "axios";
import setRedis from "@/src/lib/redis";
import { serialize } from "cookie";
import { envConfig } from "@/src/config/envConfig";
import { prisma } from "@/src/lib/prisma";

export async function GET(req: Request) {
  try {
    // =========================
    // 1. GET GOOGLE CODE
    // =========================
    const url = new URL(req.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    // =========================
    // 2. EXCHANGE CODE → TOKEN
    // =========================
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: envConfig.GOOGLE_CONFIG.GOOGLE_CLIENT_ID!,
        client_secret: envConfig.GOOGLE_CONFIG.GOOGLE_CLIENT_SECRETS!,
        redirect_uri: `${envConfig.ORIGINS.ORIGIN_ONE}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );

    const { access_token } = tokenResponse.data;

    // =========================
    // 3. GET USER INFO FROM GOOGLE
    // =========================
    const userInfoResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );

    const googleUser = userInfoResponse.data;

    // =========================
    // 4. CHECK USER IN DATABASE
    // =========================
    let dbUser = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    let isNewUser = false;

    // =========================
    // 🆕 CREATE ACCOUNT
    // =========================
    if (!dbUser) {
      isNewUser = true;

      dbUser = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          userToken: googleUser.sub, // stable unique ID
          status: "ACTIVE",
          google_id: googleUser.sub,
          profileImage : googleUser.picture,
        },
      });
    }

    // =========================
    // ✅ LOGIN (EXISTING USER)
    // =========================
    if (!isNewUser && dbUser.status === "PENDING") {
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: { status: "ACTIVE",},
      });
    }

    // =========================
    // 5. FETCH EXTRA DATA
    // =========================
  const athleteData = await prisma.athleteProfile.findUnique({
      where: { userId: dbUser.id },
      include: {
        raceResults: true,    // ← ADDED THIS
        achievements: true,   // ← ADDED THIS
      },
    });
    // =========================
    // 6. CREATE SESSION (REDIS)
    // =========================
    const sessionData = {
      userId: dbUser.id,
      userToken: dbUser.userToken,
      email: dbUser.email,
      name: dbUser.name,
      inTeam: dbUser.inTeam,
      isOnboard: dbUser.is_Onboard,
      profileImage: googleUser.picture,
      athleteData: athleteData || null,
    };

    const expiresAt = 60 * 60 * 24 * 7; // 7 days
    const redisKey = `auth_session:${dbUser.userToken}`;

    await setRedis.set(redisKey, JSON.stringify(sessionData), {
      ex: expiresAt,
    });

    // =========================
    // 7. SET COOKIE
    // =========================
    const cookie = serialize("auth_sessionId", dbUser.userToken!, {
      path: "/",
      httpOnly: true,
      sameSite: envConfig.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: expiresAt,
    });

    // =========================
    // 8. REDIRECT BASED ON FLOW
    // =========================
    let redirectPath = "";

    if (isNewUser) {
      redirectPath = "/dashboard/setprofile";
    } else {
      redirectPath = dbUser.is_Onboard
        ? "/dashboard/home"
        : "/dashboard/setprofile";
    }

    const res = NextResponse.redirect(
      `${envConfig.ORIGINS.ORIGIN_ONE}${redirectPath}`,
    );

    res.headers.set("Set-Cookie", cookie);

    return res;
  } catch (error) {
    console.error("GOOGLE AUTH ERROR:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 },
    );
  }
}
