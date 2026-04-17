// app/api/auth/google/route.ts
import { envConfig } from "@/src/config/envConfig";
import { NextResponse } from "next/server";

export async function GET() {



  
  const client_id = envConfig.GOOGLE_CONFIG.GOOGLE_CLIENT_ID!;
  const redirect_uri = `${envConfig.ORIGINS.ORIGIN_ONE}/api/auth/google/callback`;
  const scope = encodeURIComponent("openid email profile");
  const response_type = "code";
  
  const url = `https://accounts.google.com/o/oauth2/v2/auth?response_type=${response_type}&client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}&prompt=select_account`;
  
  console.log("from from /api/auth/google" , url) ;
  return NextResponse.redirect(url);
}