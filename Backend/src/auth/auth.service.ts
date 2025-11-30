import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { UserWithoutPassword } from './interfaces/user.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<UserWithoutPassword | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (isPasswordValid) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: UserWithoutPassword) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(userData: { email: string; password: string; name: string }): Promise<{ access_token: string; user: UserWithoutPassword }> {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await this.usersService.create({
        email: userData.email,
        password: hashedPassword,
        name: userData.name
      });
      
      // Исключаем пароль из ответа
      const { password, ...userWithoutPassword } = user;
      
      // Автоматически логиним пользователя после регистрации
      const payload = { email: user.email, sub: user.id };
      const access_token = this.jwtService.sign(payload);
      
      return {
        access_token,
        user: userWithoutPassword
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`User with email ${userData.email} already exists`);
      }
      throw error;
    }
  }
} 