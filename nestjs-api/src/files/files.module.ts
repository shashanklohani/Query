import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseService } from '../database.service';
import { StorageModule } from '../storage/storage.module';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  imports: [AuthModule, StorageModule],
  controllers: [FilesController],
  providers: [FilesService, DatabaseService],
})
export class FilesModule {}
