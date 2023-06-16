import fs from 'fs';
import path from 'path';

import { Injectable } from '@nestjs/common';
import { Constants } from '@weeb_services/wapi-core';
import shortid from 'shortid';

import type { Account, Config, ErrorResponse } from '../types';

import accountModel from '../DB/account.mongo';

const pkg: import('../types').Package = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../package.json'), {
    encoding: 'utf-8',
  }),
);

const validNameRegex = /^[a-zA-Z0-9_]*$/;
const validSnowflakeRegex = /^[0-9]*$/;

@Injectable()
export class UserService {
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
