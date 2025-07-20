import { jwtDecode } from 'jwt-decode';

export function storeToken(tok: { accessToken: string }): void {
  try {
    localStorage.setItem('token_data', tok.accessToken);
  } catch (e) {
    console.error("Error storing token:", e);
  }
}

export function retrieveToken(): string | null {
  try {
    return localStorage.getItem('token_data');
  } catch (e) {
    console.error("Error retrieving token:", e);
    return null;
  }
}

export function getUserInfo(): { userId: string; firstName: string; lastName: string } | null {
  const token = retrieveToken();
  if (!token) return null;

  try {
    const decoded: any = jwtDecode(token);
    return {
      userId: decoded.userId,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
    };
  } catch (e) {
    console.error("Error decoding token:", e);
    return null;
  }
}

export function isTokenValid(): boolean {
  const token = retrieveToken();
  if (!token) return false;

  try {
    const decoded: any = jwtDecode(token);
    const now = Date.now() / 1000;
    return decoded.exp > now;
  } catch (e) {
    return false;
  }
}