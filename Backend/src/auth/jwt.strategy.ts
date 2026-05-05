import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { ACCESS_TOKEN_COOKIE } from './auth.constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const raw = req?.cookies?.[ACCESS_TOKEN_COOKIE];
          return typeof raw === 'string' ? raw : null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: { sub: number | string; email: string }) {
    const userId = Number(payload.sub);
    if (!Number.isFinite(userId)) {
      throw new UnauthorizedException();
    }
    return {
      id: userId,
      userId,
      email: payload.email,
    };
  }
} 