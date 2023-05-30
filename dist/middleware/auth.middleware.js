"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const account_mongo_1 = __importDefault(require("../DB/account.mongo"));
const wapi_core_1 = require("@weeb_services/wapi-core");
class AuthMiddleware extends wapi_core_1.BaseMiddleware {
    constructor() {
        super();
        this.whitelist('/');
        this.whitelist('/validate*');
        this.whitelist('/permnode');
    }
    async exec(req) {
        if (!req.headers?.authorization)
            return { status: wapi_core_1.Constants.HTTPCodes.UNAUTHORIZED, message: '' };
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith('Wolke ')) {
            const wolkeToken = authHeader.split('Wolke ')[1];
            if (wolkeToken === '')
                return {
                    status: wapi_core_1.Constants.HTTPCodes.UNAUTHORIZED,
                    message: '',
                };
            const decodedToken = Buffer.from(wolkeToken, 'base64').toString();
            const userId = decodedToken.split(':')[0];
            const account = await account_mongo_1.default.findOne({ id: userId });
            if (!account)
                return {
                    status: wapi_core_1.Constants.HTTPCodes.UNAUTHORIZED,
                    message: '',
                };
            if (account.tokens[0]) {
                const verified = req.wwt.verify(decodedToken.split(':')[1], `${account.id}-${account.tokens[0]}`);
                if (verified) {
                    req.account = account;
                    return { status: wapi_core_1.Constants.HTTPCodes.OK, message: 'OK' };
                }
            }
            return { status: wapi_core_1.Constants.HTTPCodes.UNAUTHORIZED, message: '' };
        }
        if (!authHeader.startsWith('Bearer '))
            return { status: wapi_core_1.Constants.HTTPCodes.UNAUTHORIZED, message: '' };
        const jwtoken = authHeader.split('Bearer ')[1];
        if (jwtoken === '')
            return { status: wapi_core_1.Constants.HTTPCodes.UNAUTHORIZED, message: '' };
        if (req.config?.masterToken?.enabled &&
            jwtoken === req.config.masterToken.token) {
            req.account = { id: 'yourIdHere', scopes: ['admin'] };
            return { status: wapi_core_1.Constants.HTTPCodes.OK, message: 'OK' };
        }
        let decoded;
        try {
            decoded = await req.jwt.verify(jwtoken);
        }
        catch (e) {
            if (e.message === 'jwt malformed')
                return {
                    status: wapi_core_1.Constants.HTTPCodes.BAD_REQUEST,
                    message: 'Malformed JWT in Authorization header',
                };
            if (e.message === 'invalid signature')
                return {
                    status: wapi_core_1.Constants.HTTPCodes.UNAUTHORIZED,
                    message: '',
                };
            if (e.message === 'invalid algorithm')
                return {
                    status: wapi_core_1.Constants.HTTPCodes.UNAUTHORIZED,
                    message: '',
                };
            throw e;
        }
        const account = await account_mongo_1.default.findOne({ id: decoded.userId });
        if (!account)
            return { status: wapi_core_1.Constants.HTTPCodes.UNAUTHORIZED, message: '' };
        if (account.tokens.indexOf(decoded.tokenId) === -1)
            return { status: wapi_core_1.Constants.HTTPCodes.UNAUTHORIZED, message: '' };
        req.account = account;
        return { status: wapi_core_1.Constants.HTTPCodes.OK, message: 'OK' };
    }
}
module.exports = AuthMiddleware;
