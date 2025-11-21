import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'opentracker-secret-key-2025'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface TokenPayload {
  userId: string
  username: string
}

export class JWTUtil {
  // 生成 Token
  static generateToken(payload: TokenPayload): string {
    return jwt.sign(payload as object, JWT_SECRET as jwt.Secret, {
      expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    })
  }

  // 验证 Token
  static verifyToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  }

  // 解码 Token
  static decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload
    } catch {
      return null
    }
  }
}
