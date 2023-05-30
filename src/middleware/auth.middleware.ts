import accountModel from '../DB/account.mongo';

import { Constants, BaseMiddleware } from '@weeb_services/wapi-core';

import type { Request } from 'express';

type Resp = {
  status: number;
  message: string;
};

class AuthMiddleware extends BaseMiddleware {
  public constructor() {
    super();

    this.whitelist('/');
    this.whitelist('/validate*');
    this.whitelist('/permnode');
  }

  public async exec(req: Request) {
    if (!req.headers?.authorization)
      return { status: Constants.HTTPCodes.UNAUTHORIZED, message: '' } as Resp;

    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Wolke ')) {
      const wolkeToken = authHeader.split('Wolke ')[1];
      if (wolkeToken === '')
        return {
          status: Constants.HTTPCodes.UNAUTHORIZED,
          message: '',
        } as Resp;
      const decodedToken = Buffer.from(wolkeToken, 'base64').toString();
      const userId = decodedToken.split(':')[0];
      const account = await accountModel.findOne({ id: userId });
      if (!account)
        return {
          status: Constants.HTTPCodes.UNAUTHORIZED,
          message: '',
        } as Resp;
      if (account.tokens[0]) {
        const verified = req.wwt.verify(
          decodedToken.split(':')[1],
          `${account.id}-${account.tokens[0]}`,
        );
        if (verified) {
          // @ts-expect-error perms will get applied in a later step
          req.account = account;
          return { status: Constants.HTTPCodes.OK, message: 'OK' } as Resp;
        }
      }
      return { status: Constants.HTTPCodes.UNAUTHORIZED, message: '' } as Resp;
    }

    if (!authHeader.startsWith('Bearer '))
      return { status: Constants.HTTPCodes.UNAUTHORIZED, message: '' } as Resp;

    const jwtoken = authHeader.split('Bearer ')[1];
    if (jwtoken === '')
      return { status: Constants.HTTPCodes.UNAUTHORIZED, message: '' } as Resp;

    if (
      req.config?.masterToken?.enabled &&
      jwtoken === req.config.masterToken.token
    ) {
      // @ts-expect-error A later step uses the scopes Array
      req.account = { id: 'yourIdHere', scopes: ['admin'] };
      return { status: Constants.HTTPCodes.OK, message: 'OK' } as Resp;
    }

    let decoded;
    try {
      decoded = await req.jwt.verify(jwtoken);
    } catch (e) {
      if (e.message === 'jwt malformed')
        return {
          status: Constants.HTTPCodes.BAD_REQUEST,
          message: 'Malformed JWT in Authorization header',
        } as Resp;

      if (e.message === 'invalid signature')
        return {
          status: Constants.HTTPCodes.UNAUTHORIZED,
          message: '',
        } as Resp;

      if (e.message === 'invalid algorithm')
        return {
          status: Constants.HTTPCodes.UNAUTHORIZED,
          message: '',
        } as Resp;

      throw e;
    }

    const account = await accountModel.findOne({ id: decoded.userId });
    if (!account)
      return { status: Constants.HTTPCodes.UNAUTHORIZED, message: '' } as Resp;
    if (account.tokens.indexOf(decoded.tokenId) === -1)
      return { status: Constants.HTTPCodes.UNAUTHORIZED, message: '' } as Resp;

    // @ts-expect-error except it is assignable
    req.account = account;
    return { status: Constants.HTTPCodes.OK, message: 'OK' } as Resp;
  }
}

export = AuthMiddleware;
