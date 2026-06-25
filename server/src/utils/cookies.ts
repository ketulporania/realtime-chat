import { COOKIE_NAME } from "./jwt";

function parseCookies(
  cookieHeader: string | undefined
): Record<string, string> {
  if (!cookieHeader) return {};

  return Object.fromEntries(
    cookieHeader.split(";").map((part) => {
      const [key, ...valueParts] = part.trim().split("=");
      return [key, decodeURIComponent(valueParts.join("="))];
    })
  );
}

export function getTokenFromCookieHeader(
  cookieHeader: string | undefined
): string | undefined {
  return parseCookies(cookieHeader)[COOKIE_NAME];
}
