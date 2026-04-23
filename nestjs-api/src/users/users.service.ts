import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { JwtService } from '../auth/jwt.service';
import { DatabaseService } from '../database.service';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';

type UserRow = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  password_hash: string;
};

type AuthUser = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type RegisterUserResponse = {
  message: string;
  user: AuthUser;
};

type LoginUserResponse = {
  message: string;
  user: AuthUser;
  accessToken: string;
};

@Injectable()
export class UsersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    registerUserDto: RegisterUserDto,
  ): Promise<RegisterUserResponse> {
    const firstName = registerUserDto.firstName?.trim();
    const lastName = registerUserDto.lastName?.trim() || null;
    const email = registerUserDto.email?.trim().toLowerCase();
    const phone = registerUserDto.phone?.trim() || null;
    const password = registerUserDto.password;

    if (!firstName || !email || !password) {
      throw new BadRequestException(
        'firstName, email, and password are required.',
      );
    }

    if (password.length < 8) {
      throw new BadRequestException(
        'Password must be at least 8 characters long.',
      );
    }

    const passwordHash = this.hashPassword(password);

    try {
      const result = await this.databaseService.query<UserRow>(
        `INSERT INTO users (first_name, last_name, email, phone, password_hash)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, first_name, last_name, email, phone, is_active, created_at, updated_at`,
        [firstName, lastName, email, phone, passwordHash],
      );

      const user = result.rows[0];

      return {
        message: 'User registered successfully.',
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone,
          isActive: user.is_active,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
      };
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('A user with this email already exists.');
      }

      throw error;
    }
  }

  async login(loginUserDto: LoginUserDto): Promise<LoginUserResponse> {
    const email = loginUserDto.email?.trim().toLowerCase();
    const password = loginUserDto.password;

    if (!email || !password) {
      throw new BadRequestException('email and password are required.');
    }

    const result = await this.databaseService.query<UserRow>(
      `SELECT id, first_name, last_name, email, phone, is_active, created_at, updated_at, password_hash
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email],
    );

    const user = result.rows[0];

    if (!user || !this.verifyPassword(password, user.password_hash)) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return {
      message: 'User logged in successfully.',
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
      accessToken: this.jwtService.signAccessToken({
        sub: user.id,
        email: user.email,
      }),
    };
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');

    return `${salt}:${hash}`;
  }

  private verifyPassword(
    password: string,
    storedPasswordHash: string,
  ): boolean {
    const [salt, storedHash] = storedPasswordHash.split(':');

    if (!salt || !storedHash) {
      return false;
    }

    const derivedHash = scryptSync(password, salt, 64);
    const storedHashBuffer = Buffer.from(storedHash, 'hex');

    if (derivedHash.length !== storedHashBuffer.length) {
      return false;
    }

    return timingSafeEqual(derivedHash, storedHashBuffer);
  }

  private isUniqueViolation(
    error: unknown,
  ): error is { code: string; constraint?: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }
}
