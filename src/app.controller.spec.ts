import { Test, TestingModule } from '@nestjs/testing';
import { AccountController } from './controllers/account';
import { AccountService } from './services/account';

describe('AppController', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let appController: AccountController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [AccountService],
    }).compile();

    appController = app.get<AccountController>(AccountController);
  });

  // there was the default test here for the controllers, but I cannot fake the Request object
});
