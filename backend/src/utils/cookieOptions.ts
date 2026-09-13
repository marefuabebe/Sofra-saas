import { CookieOptions } from "express";

export const getCookieOptions = (): CookieOptions => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? ("none" as const) : ("lax" as const),
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  };
};
