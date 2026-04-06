import { decode } from 'base-64';

export function jwtDecode(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decode(base64));
  } catch {
    return null;
  }
}
