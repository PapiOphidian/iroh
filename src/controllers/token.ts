import { Controller, Get, Req, Post, Delete } from '@nestjs/common';
import { TokenService } from '../services/token';
import { Request } from 'express';

@Controller()
export class TokenController {
  public constructor(private readonly service: TokenService) {}

  @Get('/wolkeToken')
  public getWolkeToken(@Req() request: Request): string {
    return JSON.stringify(
      this.service.getWolkeToken(request.wwt, request.account),
    );
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
