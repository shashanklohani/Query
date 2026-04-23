import { Module } from '@nestjs/common';
import { FilesModule } from './files/files.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [UsersModule, FilesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
