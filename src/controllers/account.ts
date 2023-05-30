import { Controller, Get, Req, Post, Delete, Put } from '@nestjs/common';
import { AccountService } from '../services/account';
import { Request } from 'express';

@Controller()
export class AccountController {
  constructor(private readonly service: AccountService) {}

  @Get('/wolkeToken')
  public getWolkeToken(@Req() request: Request): string {
    return JSON.stringify(
      this.service.getWolkeToken(request.wwt, request.account),
    );
  }

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

  @Post('/token')
  public async postToken(@Req() request: Request): Promise<string> {
    const result = await this.service.postToken(
      request.account,
      request.config,
      request.jwt,
      request.wwt,
      request.body,
    );
    return JSON.stringify(result);
  }

  @Delete('/token/:id')
  public async deleteToken(@Req() request: Request): Promise<string> {
    const result = await this.service.deleteToken(
      request.account,
      request.config,
      request.params.id,
    );
    return JSON.stringify(result);
  }

  @Get('/validate/:token')
  public async validateToken(@Req() request: Request): Promise<string> {
    const result = await this.service.validateToken(
      request.wwt,
      request.jwt,
      request.query.wolkeToken as string,
      request.params.token,
    );
    return JSON.stringify(result);
  }
}
