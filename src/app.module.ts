import { Module } from '@nestjs/common';
import { TokenController } from './controllers/token';
import { UserController } from './controllers/user';
import { TokenService } from './services/token';
import { UserService } from './services/user';

@Module({
  imports: [],
  controllers: [TokenController, UserController],
  providers: [TokenService, UserService],
})
export class AppModule {}
