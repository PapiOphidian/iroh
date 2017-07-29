'use strict';

const accountModel = require('../DB/account.mongo');
const BaseMiddleware = require('wapi-core').BaseMiddleware;
const HTTPCodes = require('wapi-core').Constants.HTTPCodes;

class AuthMiddleware extends BaseMiddleware {
    constructor() {
        super();
        this.whitelist('/', true);
        this.whitelist('/validate');
        this.whitelist('/pubkey');
    }

    async exec(req) {
        if (!req.headers || !req.headers.authorization) return HTTPCodes.UNAUTHORIZED;
        let authHeader = req.headers.authorization;
        if (!authHeader.startsWith('Bearer ')) return HTTPCodes.UNAUTHORIZED;
        let jwtoken = authHeader.split('Bearer ')[1];
        if (jwtoken === '') return HTTPCodes.UNAUTHORIZED;

        if (req.config && req.config.masterToken && req.config.masterToken.enabled && jwtoken === req.config.masterToken.token) return HTTPCodes.OK;

        let decoded;
        try {
            decoded = await req.jwt.verify(jwtoken);
        } catch (e) {
            if (e.message === 'jwt malformed') return { status: HTTPCodes.BAD_REQUEST, message: 'Malformed JWT in Authorization header' };
            if (e.message === 'invalid signature') return HTTPCodes.UNAUTHORIZED;
            if (e.message === 'invalid algorithm') return HTTPCodes.UNAUTHORIZED;
            throw e;
        }

        let account = await accountModel.findOne({ id: decoded.userId });
        if (!account) return HTTPCodes.UNAUTHORIZED;
        if (account.tokens.indexOf(decoded.tokenId) === -1) return HTTPCodes.UNAUTHORIZED;
        if (account.scopes.indexOf('admin') === -1) return HTTPCodes.UNAUTHORIZED;

        req.authUser = account;
        return HTTPCodes.OK;
    }
}

module.exports = AuthMiddleware;
