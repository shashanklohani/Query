import { Injectable, UnauthorizedException } from '@nestjs/common';
import { sign, verify } from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import type { JwtUserPayload } from './jwt-user-payload.type';

@Injectable()
export class JwtService {
  private readonly jwtSecret = process.env.JWT_SECRET ?? 'change-me';

  signAccessToken(payload: JwtUserPayload): string {
    return sign(payload, this.jwtSecret, {
      expiresIn: '1d',
    });
  }

  verifyAccessToken(token: string): JwtUserPayload {
    try {
      const decoded = verify(token, this.jwtSecret);

      if (!this.isJwtPayload(decoded)) {
        throw new UnauthorizedException('Invalid token payload.');
      }

      const { sub, email } = decoded;

      if (typeof sub !== 'string' || typeof email !== 'string') {
        throw new UnauthorizedException('Invalid token payload.');
      }

      return { sub, email };
    } catch {
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }

  private isJwtPayload(decoded: string | JwtPayload): decoded is JwtPayload {
    return typeof decoded === 'object' && decoded !== null;
  }
}
