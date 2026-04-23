import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty({ example: 'Shashank' })
  firstName!: string;

  @ApiPropertyOptional({ example: 'Sharma' })
  lastName?: string;

  @ApiProperty({ example: 'shashank@example.com' })
  email!: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  phone?: string;

  @ApiProperty({ example: 'strongPassword123' })
  password!: string;
}
