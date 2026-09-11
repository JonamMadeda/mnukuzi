export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function missingDbMessage(): string {
  return "DATABASE_URL is not set. Add it to .env.local (see .env.example) and restart `npm run dev`.";
}
