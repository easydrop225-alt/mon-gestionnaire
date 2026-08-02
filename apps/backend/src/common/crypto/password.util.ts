import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);

/**
 * Hachage de mots de passe / tokens via `crypto.scrypt`, intégré nativement
 * à Node.js (aucun module natif tiers). Remplace `argon2`, dont le binaire
 * natif compilé peut être incompatible avec l'environnement serverless de
 * Vercel selon la plateforme cible — cause probable des erreurs 500 au
 * premier appel de hachage (register/login).
 *
 * Format stocké : "sel_hexadécimal:clé_dérivée_hexadécimale"
 */
export async function hashSecret(secret: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scrypt(secret, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifySecret(hash: string, secret: string): Promise<boolean> {
  const [salt, storedKeyHex] = hash.split(':');
  if (!salt || !storedKeyHex) return false;

  const storedKey = Buffer.from(storedKeyHex, 'hex');
  const derivedKey = (await scrypt(secret, salt, 64)) as Buffer;

  if (storedKey.length !== derivedKey.length) return false;
  return timingSafeEqual(storedKey, derivedKey);
}
