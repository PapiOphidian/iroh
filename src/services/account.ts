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
  fs.readFileSync(path.join(__dirname, '../package.json'), {
    encoding: 'utf-8',
  }),
);
const validNameRegex = /^[a-zA-Z0-9_]*$/;
const validSnowflakeRegex = /^[0-9]*$/;

@Injectable()
export class AccountService {
  public getWolkeToken(
    wwt: WolkeWebToken,
    account: Account,
  ): { token: string } {
    return {
      token: wwt.generate(account.id, `${account.id}-${account.tokens[0]}`),
    };
  }

  public async getUsers(account: Account | undefined, config: Config) {
    if (account && !account.perms.all && !account.perms.user_list) {
      return {
        status: Constants.HTTPCodes.FORBIDDEN,
        message: `missing scope ${pkg.name}-${config.env}:user_list`,
      } as ErrorResponse;
    }

    const accounts = await accountModel.find();
    return { accounts };
  }

  public async getUser(
    reqAccount: Account,
    config: Config,
    id: string | undefined,
  ) {
    const account = id ? await accountModel.findOne({ id }) : null;

    if (!account)
      return {
        status: Constants.HTTPCodes.NOT_FOUND,
        message: 'No account exists with this ID',
      } as ErrorResponse;

    if (
      account.id !== reqAccount.id &&
      !reqAccount.perms.all &&
      !reqAccount.perms.user_list
    )
      return {
        status: Constants.HTTPCodes.FORBIDDEN,
        message: `missing scope ${pkg.name}-${config.env}:user_list`,
      } as ErrorResponse;

    return { account };
  }

  public async deleteUser(
    reqAccount: Account,
    config: Config,
    id: string | undefined,
  ) {
    if (reqAccount && !reqAccount.perms.all && !reqAccount.perms.user_delete)
      return {
        status: Constants.HTTPCodes.FORBIDDEN,
        message: `missing scope ${pkg.name}-${config.env}:user_delete`,
      } as ErrorResponse;

    const account = id ? await accountModel.findOne({ id }) : null;

    if (!account)
      return {
        status: Constants.HTTPCodes.NOT_FOUND,
        message: 'No account exists with this ID',
      };

    await account.deleteOne(); // StackOverflow was saying to use deleteOne since remove() is deprecated/removed. I hope it knows which one to remove
    return { account };
  }

  public async postUser(
    reqAccount: Account | undefined,
    config: Config,
    body?: {
      name: string;
      discordUserId: string;
      active?: boolean;
      scopes?: Array<string>;
    },
  ) {
    if (reqAccount && !reqAccount.perms.all && !reqAccount.perms.user_create)
      return {
        status: Constants.HTTPCodes.FORBIDDEN,
        message: `missing scope ${pkg.name}-${config.env}:user_delete`,
      } as ErrorResponse;

    if (!body?.name || !body?.discordUserId)
      return {
        status: Constants.HTTPCodes.BAD_REQUEST,
        message: 'Missing name and or discordUserId',
      } as ErrorResponse;

    const name = body.name;
    const discordUserId = body.discordUserId;
    const active = body.active ?? true;
    const scopes = body.scopes
      ? typeof body.scopes.map === 'function'
        ? body.scopes
        : body.scopes.toString().split(',')
      : [];

    const validate = this.validate(name, discordUserId, active);
    if (validate) return validate;

    const account = new accountModel({
      id: shortid.generate(),
      name,
      discordUserId,
      active,
      tokens: [],
      scopes,
    });
    await account.save();

    return { message: 'Account created successfully', account };
  }

  public async putUser(
    reqAccount: Account | undefined,
    config: Config,
    id: string | undefined,
    body?: {
      name?: string;
      discordUserId?: string;
      active?: boolean;
      scopes?: Array<string>;
    },
  ) {
    if (reqAccount && !reqAccount.perms.all && !reqAccount.perms.user_update)
      return {
        status: Constants.HTTPCodes.FORBIDDEN,
        message: `missing scope ${pkg.name}-${config.env}:user_delete`,
      } as ErrorResponse;

    if (!body)
      return {
        status: Constants.HTTPCodes.BAD_REQUEST,
        message: 'No body was passed',
      } as ErrorResponse;

    const account = id ? await accountModel.findOne({ id }) : null;

    if (!account)
      return {
        status: Constants.HTTPCodes.NOT_FOUND,
        message: 'No account exists with this ID',
      } as ErrorResponse;

    let modified = false;

    if (body.name) {
      account.name = body.name;
      modified = true;
    }

    if (body.discordUserId) {
      account.discordUserId = body.discordUserId;
      modified = true;
    }

    if (body.active !== undefined) {
      account.active = body.active;
      modified = true;
    }

    if (body.scopes) {
      account.scopes = body.scopes
        ? typeof body.scopes.map === 'function'
          ? body.scopes
          : body.scopes.toString().split(',')
        : [];
      modified = true;
    }

    if (!modified) return { account };
    const validate = this.validate(
      account.name as string,
      account.discordUserId as string,
      body.active ?? true,
    );
    if (validate) return validate;

    await account.save();
    return { account };
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

  private isValidName(name: string): boolean {
    return validNameRegex.test(name);
  }

  private isValidSnowflake(snowflake: string): boolean {
    return validSnowflakeRegex.test(snowflake);
  }

  private isValidBoolean(boolean: boolean | 'true' | 'false'): boolean {
    return (
      boolean === true ||
      boolean === false ||
      boolean === 'true' ||
      boolean === 'false'
    );
  }

  private validate(
    name: string,
    discordUserId: string,
    active: boolean | 'true' | 'false',
  ): ErrorResponse | null {
    if (!this.isValidName(name))
      return {
        status: Constants.HTTPCodes.BAD_REQUEST,
        message: 'Invalid name',
      };

    if (!this.isValidSnowflake(discordUserId))
      return {
        status: Constants.HTTPCodes.BAD_REQUEST,
        message: 'Invalid discordUserId',
      };

    if (!this.isValidBoolean(active))
      return {
        status: Constants.HTTPCodes.BAD_REQUEST,
        message: 'Invalid active',
      };

    return null;
  }
}
