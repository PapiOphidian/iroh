'use strict';

const accountModel = require('../DB/account.mongo');
const BaseMiddleware = require('./base.middleware');
const { HTTPCodes } = require('../utils/constants');

class AuthMiddleware extends BaseMiddleware {
    async on(req) {
        // Allow token validation to be an "unauthorized" request (it requires a valid token anyways)
        if (req.path && (req.path.startsWith('/validate') || req.path.startsWith('/pubkey') || req.path === '/')) return HTTPCodes.OK;

        // Check every other path for authorization
        if (!req.headers || !req.headers.authorization) return HTTPCodes.UNAUTHORIZED;
        let authHeader = req.headers.authorization;
        if (!authHeader.startsWith('Bearer ')) return HTTPCodes.UNAUTHORIZED;
        let jwtoken = authHeader.split('Bearer ')[1];
        if (jwtoken === '') return HTTPCodes.UNAUTHORIZED;

        if (req.config && req.config.masterToken && req.config.masterToken.enable && jwtoken === req.config.masterToken.token) return HTTPCodes.OK;

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
        return 200;
    }
}

module.exports = AuthMiddleware;
