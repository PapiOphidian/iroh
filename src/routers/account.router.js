'use strict';

const accountModel = require('../DB/account.mongo');
const shortid = require('shortid');

const BaseRouter = require('@weeb_services/wapi-core').BaseRouter
const HTTPCodes = require('@weeb_services/wapi-core').Constants.HTTPCodes
const pkg = require('../../package.json');

class AccountRouter extends BaseRouter {
    constructor() {
        super();
        this.get('/wolkeToken', async (req) => ({token: req.wwt.generate(req.account.id, `${req.account.id}-${req.account.tokens[0]}`)}));

        // User get, create, update, delete
        // Get all accounts
        this.get('/user', async (req) => {
            if (req.account && !req.account.perms.all && !req.account.perms.user_list) {
                return {
                    status: HTTPCodes.FORBIDDEN,
                    message: `missing scope ${pkg.name}-${req.config.env}:user_list`,
                };
            }
            let accounts = await accountModel.find();
            return {accounts};
        });

        this.get('/user/:id', async (req) => {
            let account = await accountModel.findOne({id: req.params.id});
            if (!account) return {status: HTTPCodes.NOT_FOUND, message: 'No account exists with this ID'};
            if (account.id !== req.account.id && !req.account.perms.all && !req.account.perms.user_list) {
                return {
                    status: HTTPCodes.FORBIDDEN,
                    message: `missing scope ${pkg.name}-${req.config.env}:user_list`,
                };
            }
            return {account};
        });
        this.delete('/user/:id', async (req) => {
            if (req.account && !req.account.perms.all && !req.account.perms.user_delete) {
                return {
                    status: HTTPCodes.FORBIDDEN,
                    message: `missing scope ${pkg.name}-${req.config.env}:user_delete`,
                };
            }
            let account = await accountModel.findOne({id: req.params.id});
            if (!account) return {status: HTTPCodes.NOT_FOUND, message: 'No account exists with this ID'};

            await account.remove();
            return {account};
        });
        this.post('/user', async (req) => {
            if (req.account && !req.account.perms.all && !req.account.perms.user_create) {
                return {
                    status: HTTPCodes.FORBIDDEN,
                    message: `missing scope ${pkg.name}-${req.config.env}:user_delete`,
                };
            }
            if (!req.body || !req.body.name || !req.body.discordUserId) return {
                status: HTTPCodes.BAD_REQUEST,
                message: 'Missing name and or discordUserId',
            };
            let name = req.body.name;
            let discordUserId = req.body.discordUserId;
            let active = req.body.active !== undefined ? req.body.active : true;
            let scopes = req.body.scopes ? typeof req.body.scopes.map === 'function' ? req.body.scopes : req.body.scopes.toString()
                .split(',') : [];

            let validate = this.validate(name, discordUserId, active, scopes);
            if (validate) return validate;

            let account = new accountModel({id: shortid.generate(), name, discordUserId, active, tokens: [], scopes});
            await account.save();
            return {message: 'Account created successfully', account};
        });
        this.put('/user/:id', async (req) => {
            if (req.account && !req.account.perms.all && !req.account.perms.user_update) {
                return {
                    status: HTTPCodes.FORBIDDEN,
                    message: `missing scope ${pkg.name}-${req.config.env}:user_delete`,
                };
            }
            if (!req.body) return {status: HTTPCodes.BAD_REQUEST, message: 'No body was passed'};

            let account = await accountModel.findOne({id: req.params.id});
            if (!account) return {status: HTTPCodes.NOT_FOUND, message: 'No account exists with this ID'};

            let modified = false;
            if (req.body.name) {
                account.name = req.body.name;
                modified = true;
            }
            if (req.body.discordUserId) {
                account.discordUserId = req.body.discordUserId;
                modified = true;
            }
            if (req.body.active !== undefined) {
                account.active = req.body.active;
                modified = true;
            }
            if (req.body.scopes) {
                account.scopes = req.body.scopes ? typeof req.body.scopes.map === 'function' ? req.body.scopes : req.body.scopes.toString()
                    .split(',') : [];
                modified = true;
            }

            if (!modified) return {account};
            let validate = this.validate(account.name, account.discordUserId, req.body.active !== undefined ? req.body.active : true, account.scopes);
            if (validate) return validate;

            await account.save();
            return {account};
        });

        // Token get, create, delete
        this.post('/token', async (req) => {
            if (req.account && !req.account.perms.all && !req.account.perms.token_create && !req.account.perms.token_create_self) {
                return {
                    status: HTTPCodes.FORBIDDEN,
                    message: `missing scope ${pkg.name}-${req.config.env}:token_create or ${pkg.name}-${req.config.env}:token_create_self`,
                };
            }
            if (!req.body || !req.body.userId) return {status: HTTPCodes.BAD_REQUEST, message: 'Missing user Id'};
            let account = await accountModel.findOne({id: req.body.userId});
            if (!account) return {status: HTTPCodes.NOT_FOUND, message: 'No account exists with this Id'};
            if (account.id !== req.account.id && !req.account.perms.all && !req.account.perms.token_create) {
                return {
                    status: HTTPCodes.FORBIDDEN,
                    message: `missing scope ${pkg.name}-${req.config.env}:token_create`,
                };
            }

            let tokenId = shortid.generate();

            let token = await req.jwt.sign({userId: account.id, tokenId});
            let wolkeToken = await req.wwt.generate(account.id, `${account.id}-${tokenId}`);
            account.tokens = [tokenId];
            await account.save();

            return {account, tokenId, token, wolkeToken};
        });
        this.delete('/token/:id', async (req) => {
            if (req.account && !req.account.perms.all && !req.account.perms.token_delete) {
                return {
                    status: HTTPCodes.FORBIDDEN,
                    message: `missing scope ${pkg.name}-${req.config.env}:token_delete`,
                };
            }
            let account = await accountModel.findOne({tokens: req.params.id});
            if (!account) return {status: HTTPCodes.NOT_FOUND, message: 'No user with this token Id could be found'};

            let index = account.tokens.indexOf(req.params.id);
            if (index === -1) return HTTPCodes.NOT_FOUND;
            account.tokens.splice(index, 1);
            await account.save();

            return {account};
        });
        this.get('/validate/:token', async (req) => {
            let decoded;
            if (req.query.wolkeToken) {
                let wolkeToken = req.params.token;
                if (wolkeToken === '') return HTTPCodes.UNAUTHORIZED;
                let decodedToken = Buffer.from(wolkeToken, 'base64')
                    .toString();
                let userId = decodedToken.split(':')[0];
                let account = await accountModel.findOne({id: userId});
                if (!account) return HTTPCodes.UNAUTHORIZED;
                if (account.tokens[0]) {
                    let verified = req.wwt.verify(decodedToken.split(':')[1], `${account.id}-${account.tokens[0]}`);
                    if (verified) {
                        return {account, wolkeToken: true};
                    }
                }
                return HTTPCodes.UNAUTHORIZED;
            }
            try {
                decoded = await req.jwt.verify(req.params.token);
            } catch (e) {
                if (e.message === 'jwt malformed') return {status: HTTPCodes.BAD_REQUEST, message: 'Malformed JWT'};
                if (e.message === 'invalid signature') return HTTPCodes.UNAUTHORIZED;
                if (e.message === 'invalid algorithm') return HTTPCodes.UNAUTHORIZED;
                console.log(e);
                throw e;
            }

            let account = await accountModel.findOne({id: decoded.userId});
            if (!account) return {status: HTTPCodes.NOT_FOUND, message: 'No user with this token could be found'};
            if (account.tokens.indexOf(decoded.tokenId) === -1) return {status: HTTPCodes.UNAUTHORIZED};
            return {iat: decoded.iat, account, wolkeToken: false};
        });
    }

    isValidName(name) {
        return /^[a-zA-Z0-9_]*$/.test(name);
    }

    isValidSnowflake(snowflake) {
        return /^[0-9]*$/.test(snowflake);
    }

    isValidBoolean(boolean) {
        return boolean === true || boolean === false || boolean === 'true' || boolean === 'false';
    }

    validate(name, discordUserId, active) {
        if (!this.isValidName(name)) return {status: HTTPCodes.BAD_REQUEST, message: 'Invalid name'};
        if (!this.isValidSnowflake(discordUserId)) return {
            status: HTTPCodes.BAD_REQUEST,
            message: 'Invalid discordUserId',
        };
        if (!this.isValidBoolean(active)) return {status: HTTPCodes.BAD_REQUEST, message: 'Invalid active'};
        return null;
    }
}

module.exports = AccountRouter;
