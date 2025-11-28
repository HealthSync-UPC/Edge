type TokenCache = {
  token: string | null;
  expiresAt: string | null;
};

export const tokenCache: TokenCache = {
  token: null,
  expiresAt: null,
};

export function setToken(token: string, expiresAt: string) {
  tokenCache.token = token;
  tokenCache.expiresAt = expiresAt;
}

export function clearToken() {
  tokenCache.token = null;
  tokenCache.expiresAt = null;
}

export function getTokenCache() {
  return tokenCache;
}
