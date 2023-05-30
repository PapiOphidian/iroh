import { Module } from '@nestjs/common';
import { AccountController } from './controllers/account';
import { AccountService } from './services/account';

@Module({
  imports: [],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AppModule {}
