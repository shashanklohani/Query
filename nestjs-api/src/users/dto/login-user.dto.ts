import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({ example: 'shashank@example.com' })
  email!: string;

  @ApiProperty({ example: 'strongPassword123' })
  password!: string;
}
