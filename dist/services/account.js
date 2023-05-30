"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const common_1 = require("@nestjs/common");
const wapi_core_1 = require("@weeb_services/wapi-core");
const shortid_1 = __importDefault(require("shortid"));
const account_mongo_1 = __importDefault(require("../DB/account.mongo"));
const pkg = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, '../package.json'), {
    encoding: 'utf-8',
}));
const validNameRegex = /^[a-zA-Z0-9_]*$/;
const validSnowflakeRegex = /^[0-9]*$/;
let AccountService = class AccountService {
    getWolkeToken(wwt, account) {
        return {
            token: wwt.generate(account.id, `${account.id}-${account.tokens[0]}`),
        };
    }
    async getUsers(account, config) {
        if (account && !account.perms.all && !account.perms.user_list) {
            return {
                status: wapi_core_1.Constants.HTTPCodes.FORBIDDEN,
                message: `missing scope ${pkg.name}-${config.env}:user_list`,
            };
        }
        const accounts = await account_mongo_1.default.find();
        return { accounts };
    }
    async getUser(reqAccount, config, id) {
        const account = id ? await account_mongo_1.default.findOne({ id }) : null;
        if (!account)
            return {
                status: wapi_core_1.Constants.HTTPCodes.NOT_FOUND,
                message: 'No account exists with this ID',
            };
        if (account.id !== reqAccount.id &&
            !reqAccount.perms.all &&
            !reqAccount.perms.user_list)
            return {
                status: wapi_core_1.Constants.HTTPCodes.FORBIDDEN,
                message: `missing scope ${pkg.name}-${config.env}:user_list`,
            };
        return { account };
    }
    async deleteUser(reqAccount, config, id) {
        if (reqAccount && !reqAccount.perms.all && !reqAccount.perms.user_delete)
            return {
                status: wapi_core_1.Constants.HTTPCodes.FORBIDDEN,
                message: `missing scope ${pkg.name}-${config.env}:user_delete`,
            };
        const account = id ? await account_mongo_1.default.findOne({ id }) : null;
        if (!account)
            return {
                status: wapi_core_1.Constants.HTTPCodes.NOT_FOUND,
                message: 'No account exists with this ID',
            };
        await account.deleteOne();
        return { account };
    }
    async postUser(reqAccount, config, body) {
        if (reqAccount && !reqAccount.perms.all && !reqAccount.perms.user_create)
            return {
                status: wapi_core_1.Constants.HTTPCodes.FORBIDDEN,
                message: `missing scope ${pkg.name}-${config.env}:user_delete`,
            };
        if (!body?.name || !body?.discordUserId)
            return {
                status: wapi_core_1.Constants.HTTPCodes.BAD_REQUEST,
                message: 'Missing name and or discordUserId',
            };
        const name = body.name;
        const discordUserId = body.discordUserId;
        const active = body.active ?? true;
        const scopes = body.scopes
            ? typeof body.scopes.map === 'function'
                ? body.scopes
                : body.scopes.toString().split(',')
            : [];
        const validate = this.validate(name, discordUserId, active);
        if (validate)
            return validate;
        const account = new account_mongo_1.default({
            id: shortid_1.default.generate(),
            name,
            discordUserId,
            active,
            tokens: [],
            scopes,
        });
        await account.save();
        return { message: 'Account created successfully', account };
    }
    async putUser(reqAccount, config, id, body) {
        if (reqAccount && !reqAccount.perms.all && !reqAccount.perms.user_update)
            return {
                status: wapi_core_1.Constants.HTTPCodes.FORBIDDEN,
                message: `missing scope ${pkg.name}-${config.env}:user_delete`,
            };
        if (!body)
            return {
                status: wapi_core_1.Constants.HTTPCodes.BAD_REQUEST,
                message: 'No body was passed',
            };
        const account = id ? await account_mongo_1.default.findOne({ id }) : null;
        if (!account)
            return {
                status: wapi_core_1.Constants.HTTPCodes.NOT_FOUND,
                message: 'No account exists with this ID',
            };
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
        if (!modified)
            return { account };
        const validate = this.validate(account.name, account.discordUserId, body.active ?? true);
        if (validate)
            return validate;
        await account.save();
        return { account };
    }
    async postToken(reqAccount, config, jwt, wwt, body) {
        if (reqAccount &&
            !reqAccount.perms.all &&
            !reqAccount.perms.token_create &&
            !reqAccount.perms.token_create_self) {
            return {
                status: wapi_core_1.Constants.HTTPCodes.FORBIDDEN,
                message: `missing scope ${pkg.name}-${config.env}:token_create or ${pkg.name}-${config.env}:token_create_self`,
            };
        }
        if (!body?.userId)
            return {
                status: wapi_core_1.Constants.HTTPCodes.BAD_REQUEST,
                message: 'Missing user Id',
            };
        const account = await account_mongo_1.default.findOne({ id: body.userId });
        if (!account)
            return {
                status: wapi_core_1.Constants.HTTPCodes.NOT_FOUND,
                message: 'No account exists with this Id',
            };
        if (account.id !== reqAccount.id &&
            !reqAccount.perms.all &&
            !reqAccount.perms.token_create)
            return {
                status: wapi_core_1.Constants.HTTPCodes.FORBIDDEN,
                message: `missing scope ${pkg.name}-${config.env}:token_create`,
            };
        const tokenId = shortid_1.default.generate();
        const token = await jwt.sign({ userId: account.id, tokenId });
        const wolkeToken = await wwt.generate(account.id, `${account.id}-${tokenId}`);
        account.tokens = [tokenId];
        await account.save();
        return { account, tokenId, token, wolkeToken };
    }
    async deleteToken(reqAccount, config, id) {
        if (reqAccount && !reqAccount.perms.all && !reqAccount.perms.token_delete)
            return {
                status: wapi_core_1.Constants.HTTPCodes.FORBIDDEN,
                message: `missing scope ${pkg.name}-${config.env}:token_delete`,
            };
        const account = id ? await account_mongo_1.default.findOne({ tokens: id }) : null;
        if (!account || !id)
            return {
                status: wapi_core_1.Constants.HTTPCodes.NOT_FOUND,
                message: 'No user with this token Id could be found',
            };
        const index = account.tokens.indexOf(id);
        if (index === -1)
            return {
                status: wapi_core_1.Constants.HTTPCodes.NOT_FOUND,
                message: 'That user does not have that token',
            };
        account.tokens.splice(index, 1);
        await account.save();
        return { account };
    }
    async validateToken(wwt, jwt, wolkeTokenQuery, token) {
        let decoded;
        if (wolkeTokenQuery && token) {
            if (token === '')
                return { status: wapi_core_1.Constants.HTTPCodes.UNAUTHORIZED };
            const decodedToken = Buffer.from(token, 'base64').toString();
            const userId = decodedToken.split(':')[0];
            const account = await account_mongo_1.default.findOne({ id: userId });
            if (!account)
                return { status: wapi_core_1.Constants.HTTPCodes.UNAUTHORIZED };
            if (account.tokens[0]) {
                const verified = wwt.verify(decodedToken.split(':')[1], `${account.id}-${account.tokens[0]}`);
                if (verified)
                    return { account, wolkeToken: true };
            }
            return { status: wapi_core_1.Constants.HTTPCodes.UNAUTHORIZED };
        }
        try {
            decoded = await jwt.verify(token);
        }
        catch (e) {
            if (e.message === 'jwt malformed')
                return {
                    status: wapi_core_1.Constants.HTTPCodes.BAD_REQUEST,
                    message: 'Malformed JWT',
                };
            if (e.message === 'invalid signature')
                return { status: wapi_core_1.Constants.HTTPCodes.UNAUTHORIZED };
            if (e.message === 'invalid algorithm')
                return { status: wapi_core_1.Constants.HTTPCodes.UNAUTHORIZED };
            console.log(e);
            throw e;
        }
        const account = await account_mongo_1.default.findOne({ id: decoded.userId });
        if (!account)
            return {
                status: wapi_core_1.Constants.HTTPCodes.NOT_FOUND,
                message: 'No user with this token could be found',
            };
        if (account.tokens.indexOf(decoded.tokenId) === -1)
            return { status: wapi_core_1.Constants.HTTPCodes.UNAUTHORIZED };
        return { iat: decoded.iat, account, wolkeToken: false };
    }
    isValidName(name) {
        return validNameRegex.test(name);
    }
    isValidSnowflake(snowflake) {
        return validSnowflakeRegex.test(snowflake);
    }
    isValidBoolean(boolean) {
        return (boolean === true ||
            boolean === false ||
            boolean === 'true' ||
            boolean === 'false');
    }
    validate(name, discordUserId, active) {
        if (!this.isValidName(name))
            return {
                status: wapi_core_1.Constants.HTTPCodes.BAD_REQUEST,
                message: 'Invalid name',
            };
        if (!this.isValidSnowflake(discordUserId))
            return {
                status: wapi_core_1.Constants.HTTPCodes.BAD_REQUEST,
                message: 'Invalid discordUserId',
            };
        if (!this.isValidBoolean(active))
            return {
                status: wapi_core_1.Constants.HTTPCodes.BAD_REQUEST,
                message: 'Invalid active',
            };
        return null;
    }
};
AccountService = __decorate([
    (0, common_1.Injectable)()
], AccountService);
exports.AccountService = AccountService;
