import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Pool } from 'pg';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private pool: Pool;

  constructor(private jwtService: JwtService) {
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  private generateApiKey(): string {
    return 'nv_' + crypto.randomBytes(32).toString('hex');
  }

  async register(dto: RegisterDto) {
    const existing = await this.pool.query(
      'SELECT id FROM users WHERE email = $1', [dto.email]
    );
    if (existing.rows.length > 0) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const apiKey = this.generateApiKey();

    const result = await this.pool.query(
      `INSERT INTO users (email, password_hash, api_key, tier)
       VALUES ($1, $2, $3, 'free')
       RETURNING id, email, tier, api_key, created_at`,
      [dto.email, passwordHash, apiKey]
    );

    const user = result.rows[0];
    const token = this.jwtService.sign({ sub: user.id, email: user.email });

    return { user, token, api_key: apiKey };
  }

  async login(dto: LoginDto) {
    const result = await this.pool.query(
      'SELECT id, email, password_hash, tier, api_key, subscription_status FROM users WHERE email = $1',
      [dto.email]
    );

    const user = result.rows[0];
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    const { password_hash, ...safeUser } = user;

    return { user: safeUser, token };
  }

  async getMe(userId: string) {
    const result = await this.pool.query(
      `SELECT id, email, tier, api_key, subscription_status, scans_today, created_at
       FROM users WHERE id = $1`,
      [userId]
    );
    return result.rows[0];
  }
}
