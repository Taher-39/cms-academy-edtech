import jwt from "jsonwebtoken";

export type JwtPayload = {
  userId: string;
  role?: string;
  email?: string;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return secret;
}

export function signJwt(payload: JwtPayload, expiresIn: number = 7 * 24 * 60 * 60) {
  const secret = getJwtSecret();
  return jwt.sign(payload as object, secret, { expiresIn });
}

export function verifyJwt(token: string): JwtPayload {
  const secret = getJwtSecret();
  const decoded = jwt.verify(token, secret) as JwtPayload;

  if (!decoded || !decoded.userId) {
    throw new Error("Invalid JWT payload: missing userId");
  }

  return decoded;
}
