export async function hashOtp(otp: string, email: string): Promise<string> {
  const data = new TextEncoder().encode(`${otp}:${email}:bizsuite`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
