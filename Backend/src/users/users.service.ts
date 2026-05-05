import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import type { User } from '@prisma/client';

type SafeUser = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private toSafeUser(user: User): SafeUser {
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async create(userData: { email: string; password: string; name: string }): Promise<SafeUser> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: 'USER'
      }
    });
    return this.toSafeUser(user);
  }

  async findAll(): Promise<SafeUser[]> {
    const users = await this.prisma.user.findMany();
    return users.map((user) => this.toSafeUser(user));
  }

  async findOne(id: number): Promise<SafeUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });
    return user ? this.toSafeUser(user) : null;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email }
    });
  }

  async update(id: number, userData: { email?: string; name?: string }): Promise<SafeUser> {
    const user = await this.prisma.user.update({
      where: { id },
      data: userData
    });
    return this.toSafeUser(user);
  }

  async remove(id: number): Promise<SafeUser> {
    const user = await this.prisma.user.delete({
      where: { id }
    });
    return this.toSafeUser(user);
  }
} 