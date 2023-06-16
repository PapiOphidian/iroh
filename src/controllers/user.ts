import { Controller, Get, Req, Post, Delete, Put } from '@nestjs/common';
import { UserService } from '../services/user';
import { Request } from 'express';

@Controller()
export class UserController {
  public constructor(private readonly service: UserService) {}

  @Get('/user')
  public async getUsers(@Req() request: Request): Promise<string> {
    const users = await this.service.getUsers(request.account, request.config);
    return JSON.stringify(users);
  }

  @Get('/user/:id')
  public async getUser(@Req() request: Request): Promise<string> {
    const user = await this.service.getUser(
      request.account,
      request.config,
      request.params.id,
    );
    return JSON.stringify(user);
  }

  @Delete('/user:id')
  public async deleteUser(@Req() request: Request) {
    const result = await this.service.deleteUser(
      request.account,
      request.config,
      request.params.id,
    );
    return JSON.stringify(result);
  }

  @Post('/user')
  public async postUser(@Req() request: Request): Promise<string> {
    const account = await this.service.postUser(
      request.account,
      request.config,
      request.body,
    );
    return JSON.stringify(account);
  }

  @Put('/user/:id')
  public async putUser(@Req() request: Request): Promise<string> {
    const result = await this.service.putUser(
      request.account,
      request.config,
      request.params.id,
      request.body,
    );
    return JSON.stringify(result);
  }
}
