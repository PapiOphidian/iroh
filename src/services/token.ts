import fs from 'fs';
import path from 'path';

import { Injectable } from '@nestjs/common';
import { Constants } from '@weeb_services/wapi-core';
import shortid from 'shortid';

import type WolkeWebToken from '../utils/WolkeWebToken';
import type JWT from '../utils/jwt';
import type { Account, Config, ErrorResponse } from '../types';

import accountModel from '../DB/account.mongo';

const pkg: import('../types').Package = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../package.json'), {
    encoding: 'utf-8',
  }),
);

@Injectable()
export class TokenService {
  public getWolkeToken(
    wwt: WolkeWebToken,
    account: Account,
  ): { token: string } {
    return {
      token: wwt.generate(account.id, `${account.id}-${account.tokens[0]}`),
    };
  }

  public async postToken(
    reqAccount: Account,
    config: Config,
    jwt: JWT,
    wwt: WolkeWebToken,
    body?: {
      userId: string;
    },
  ) {
    if (
      reqAccount &&
      !reqAccount.perms.all &&
      !reqAccount.perms.token_create &&
      !reqAccount.perms.token_create_self
    ) {
      return {
        status: Constants.HTTPCodes.FORBIDDEN,
        message: `missing scope ${pkg.name}-${config.env}:token_create or ${pkg.name}-${config.env}:token_create_self`,
      } as ErrorResponse;
    }

    if (!body?.userId)
      return {
        status: Constants.HTTPCodes.BAD_REQUEST,
        message: 'Missing user Id',
      } as ErrorResponse;

    const account = await accountModel.findOne({ id: body.userId });

    if (!account)
      return {
        status: Constants.HTTPCodes.NOT_FOUND,
        message: 'No account exists with this Id',
      } as ErrorResponse;

    if (
      account.id !== reqAccount.id &&
      !reqAccount.perms.all &&
      !reqAccount.perms.token_create
    )
      return {
        status: Constants.HTTPCodes.FORBIDDEN,
        message: `missing scope ${pkg.name}-${config.env}:token_create`,
      } as ErrorResponse;

    const tokenId = shortid.generate();

    const token = await jwt.sign({ userId: account.id, tokenId });
    const wolkeToken = await wwt.generate(
      account.id,
      `${account.id}-${tokenId}`,
    );
    account.tokens = [tokenId];
    await account.save();

    return { account, tokenId, token, wolkeToken };
  }

  public async deleteToken(
    reqAccount: Account | undefined,
    config: Config,
    id: string | undefined,
  ) {
    if (reqAccount && !reqAccount.perms.all && !reqAccount.perms.token_delete)
      return {
        status: Constants.HTTPCodes.FORBIDDEN,
        message: `missing scope ${pkg.name}-${config.env}:token_delete`,
      } as ErrorResponse;

    const account = id ? await accountModel.findOne({ tokens: id }) : null;

    if (!account || !id)
      return {
        status: Constants.HTTPCodes.NOT_FOUND,
        message: 'No user with this token Id could be found',
      };

    const index = account.tokens.indexOf(id);
    if (index === -1)
      return {
        status: Constants.HTTPCodes.NOT_FOUND,
        message: 'That user does not have that token',
      };

    account.tokens.splice(index, 1);
    await account.save();

    return { account };
  }

  public async validateToken(
    wwt: WolkeWebToken,
    jwt: JWT,
    wolkeTokenQuery: string | undefined,
    token: string | undefined,
  ) {
    let decoded;
    if (wolkeTokenQuery && token) {
      if (token === '')
        return { status: Constants.HTTPCodes.UNAUTHORIZED } as {
          status: number;
        };
      const decodedToken = Buffer.from(token, 'base64').toString();
      const userId = decodedToken.split(':')[0];
      const account = await accountModel.findOne({ id: userId });
      if (!account)
        return { status: Constants.HTTPCodes.UNAUTHORIZED } as {
          status: number;
        };
      if (account.tokens[0]) {
        const verified = wwt.verify(
          decodedToken.split(':')[1],
          `${account.id}-${account.tokens[0]}`,
        );
        if (verified) return { account, wolkeToken: true } as const;
      }
      return { status: Constants.HTTPCodes.UNAUTHORIZED } as { status: number };
    }

    try {
      decoded = await jwt.verify(token as string);
    } catch (e) {
      if (e.message === 'jwt malformed')
        return {
          status: Constants.HTTPCodes.BAD_REQUEST,
          message: 'Malformed JWT',
        } as ErrorResponse;

      if (e.message === 'invalid signature')
        return { status: Constants.HTTPCodes.UNAUTHORIZED } as {
          status: number;
        };

      if (e.message === 'invalid algorithm')
        return { status: Constants.HTTPCodes.UNAUTHORIZED } as {
          status: number;
        };

      console.log(e);
      throw e;
    }

    const account = await accountModel.findOne({ id: decoded.userId });

    if (!account)
      return {
        status: Constants.HTTPCodes.NOT_FOUND,
        message: 'No user with this token could be found',
      } as ErrorResponse;

    if (account.tokens.indexOf(decoded.tokenId) === -1)
      return { status: Constants.HTTPCodes.UNAUTHORIZED } as { status: number };

    return { iat: decoded.iat, account, wolkeToken: false } as const;
  }
}
