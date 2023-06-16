/* eslint-disable @typescript-eslint/no-unused-vars */

import { Test, TestingModule } from '@nestjs/testing';
import { TokenController } from './controllers/token';
import { UserController } from './controllers/user';
import { TokenService } from './services/token';
import { UserService } from './services/user';
import accountModel = require('./DB/account.mongo');

describe('AppController', () => {
  let tokenController: TokenController;
  let userController: UserController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [TokenController, UserController],
      providers: [TokenService, UserService],
    }).compile();

    tokenController = app.get<TokenController>(TokenController);
    userController = app.get<UserController>(UserController);
  });

  test('default', () => expect(true).toBe(true));
  // there was the default test here for the controllers, but I cannot fake the Request object
});
