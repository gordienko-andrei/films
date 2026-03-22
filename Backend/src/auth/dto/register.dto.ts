import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'StrongPassword123!',
    description: 'User password',
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Display name',
  })
  @IsString()
  @MinLength(2)
  name!: string;
}
