import { Google } from "arctic";

export function getGoogleOAuth(env: {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}) {
  return new Google(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    `${process.env.VITE_BASE_URL ?? "http://localhost:3000"}/auth/callback`,
  );
}
