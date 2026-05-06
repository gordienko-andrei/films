import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  UsePipes,
  ValidationPipe,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Request as ExpressRequest, Response } from 'express';
import { UserWithoutPassword } from './interfaces/user.interface';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ACCESS_TOKEN_COOKIE } from './auth.constants';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { EmotionsService } from '../movies/emotions.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly emotionsService: EmotionsService,
  ) {}

  private authCookieOptions() {
    const raw = (this.configService.get<string>('COOKIE_SAME_SITE') ?? 'lax').toLowerCase();
    const sameSite = raw === 'none' || raw === 'strict' ? raw : 'lax';
    const secure = sameSite === 'none' || process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: sameSite as 'lax' | 'strict' | 'none',
      secure,
    };
  }

  @Post('login')
  @UsePipes(new ValidationPipe({ 
    whitelist: false, 
    forbidNonWhitelisted: false,
    transform: false 
  }))
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'User logged in successfully',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(
    @Body() loginDto: LoginDto & { deviceId?: string },
    @Request() req: ExpressRequest & { user: UserWithoutPassword },
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.login(req.user);
    const deviceId = loginDto.deviceId?.trim();
    if (deviceId) {
      await this.emotionsService.mergeDeviceReactionsToUser(deviceId, req.user.id);
    }
    res.cookie(ACCESS_TOKEN_COOKIE, data.access_token, this.authCookieOptions());
    return data;
  }

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ 
    status: 201, 
    description: 'User registered successfully and automatically logged in',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'user@example.com' },
            name: { type: 'string', example: 'John Doe' },
            role: { type: 'string', example: 'USER' },
            createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
            updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'User with this email already exists' })
  async register(
    @Body() registerDto: RegisterDto & { deviceId?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.register(registerDto);
    const deviceId = registerDto.deviceId?.trim();
    if (deviceId) {
      await this.emotionsService.mergeDeviceReactionsToUser(deviceId, data.user.id);
    }
    res.cookie(ACCESS_TOKEN_COOKIE, data.access_token, this.authCookieOptions());
    return data;
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout (clear auth cookie)' })
  @ApiResponse({ status: 200, description: 'Logged out' })
  logout(@Res({ passthrough: true }) res: Response) {
    const opts = this.authCookieOptions();
    res.clearCookie(ACCESS_TOKEN_COOKIE, {
      path: '/',
      httpOnly: true,
      sameSite: opts.sameSite,
      secure: opts.secure,
    });
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current user (JWT in cookie or Authorization header)' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async me(@Request() req: ExpressRequest & { user: { id: number } }) {
    const user = await this.usersService.findOne(req.user.id);
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }
} 