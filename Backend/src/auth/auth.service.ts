import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { UserWithoutPassword } from './interfaces/user.interface';

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
    const existing = await this.usersService.findByEmail(userData.email);
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }
    const user = await this.usersService.create({
      email: userData.email,
      password: userData.password,
      name: userData.name,
    });

    // Автоматически логиним пользователя после регистрации
    const payload = { email: user.email, sub: user.id };
    const access_token = this.jwtService.sign(payload);
    
    return {
      access_token,
      user,
    };
  }
} 