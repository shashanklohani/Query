import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import {
  LoginUserResponseDto,
  RegisterUserResponseDto,
} from './dto/user-response.dto';
import { UsersService } from './users.service';

type RegisterUserResponse = Awaited<ReturnType<UsersService['register']>>;
type LoginUserResponse = Awaited<ReturnType<UsersService['login']>>;

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterUserDto })
  @ApiCreatedResponse({ type: RegisterUserResponseDto })
  register(
    @Body() registerUserDto: RegisterUserDto,
  ): Promise<RegisterUserResponse> {
    return this.usersService.register(registerUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in a user' })
  @ApiBody({ type: LoginUserDto })
  @ApiOkResponse({ type: LoginUserResponseDto })
  login(@Body() loginUserDto: LoginUserDto): Promise<LoginUserResponse> {
    return this.usersService.login(loginUserDto);
  }
}
