import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Pool } from 'pg';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private pool: Pool;

  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'nexusveritas-secret-key',
    });
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  async validate(payload: { sub: string; email: string }) {
    const result = await this.pool.query(
      'SELECT id, email, tier, api_key, subscription_status FROM users WHERE id = $1',
      [payload.sub]
    );
    if (!result.rows[0]) throw new UnauthorizedException();
    return result.rows[0];
  }
}
