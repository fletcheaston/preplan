import { Google } from "arctic";

export function getGoogleOAuth(env: {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}) {
  const baseUrl =
    process.env.VITE_BASE_URL ??
    (process.env.NODE_ENV === "production"
      ? "https://preplan.fletcheaston.com"
      : "http://localhost:3000");
  return new Google(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    `${baseUrl}/auth/callback`,
  );
}
