'use strict';

const accountModel = require('../DB/account.mongo');
const shortid = require('shortid');
const BaseRouter = require('./base.router');

class AccountRouter extends BaseRouter {
    constructor(jwt) {
        super();

        this.get('/info', async() => ({ accounts: await accountModel.find({}) }));
        this.get('/info/:id', async(req) => {
            if (!req.params.id) return { status: this.httpCodes.BAD_REQUEST, message: 'No ID was passed' };

            let account = await accountModel.findOne({ id: req.params.id });
            if (!account) return { status: this.httpCodes.NOT_FOUND, message: 'No account exists with this ID' };

            return { account };
        });
        this.post('/user/create', async(req) => {
            if (!req.body || !req.body.name || !req.body.discordUserId) return { status: this.httpCodes.BAD_REQUEST, message: 'Missing name and or discordUserId' };
            let name = req.body.name;
            let discordUserId = req.body.discordUserId;
            let active = req.body.active !== undefined ? req.body.active : true;
            // TODO define default scopes
            let scopes = req.body.scopes !== undefined ? req.body.scopes.toString().split(',') : [];

            let account = new accountModel({ id: shortid.generate(), name, discordUserId, active, tokens: [], scopes });
            await account.save();
            return { message: 'Account created successfully', account };
        });
        // this.post('/user/update/:id');
        // this.delete('/user/:id');
        this.post('/token/create', async(req) => {
            if (!req.body || !req.body.userID) return { status: this.httpCodes.BAD_REQUEST, message: 'Missing user ID' };

            let account = await accountModel.findOne({ id: req.body.userID });
            if (!account) return { status: this.httpCodes.NOT_FOUND, message: 'No account exists with this ID' };

            let tokenID = shortid.generate();

            let token = await jwt.sign({ userID: account.id, tokenID });
            account.tokens.push(tokenID);
            await account.save();

            return { account, tokenID, token };
        });
        this.delete('/token/:id', async(req) => {
            if (!req.params.id) return { status: this.httpCodes.BAD_REQUEST, message: 'Missing token ID' };

            let account = await accountModel.findOne({ tokens: req.params.id });
            if (!account) return { status: this.httpCodes.NOT_FOUND, message: 'No user with this token could be found' };

            let index = account.tokens.indexOf(req.params.id);
            if (index === -1) return 500;
            account.tokens.splice(index, 1);
            await account.save();

            return { account };
        });
        this.get('/token', async() => ({ status: this.httpCodes.BAD_REQUEST, message: 'No token was passed' }));
        this.get('/token/:token', async(req) => {
            let decoded;
            try {
                decoded = await jwt.verify(req.params.token);
            } catch (e) {
                if (e.message === 'jwt malformed') return { status: this.httpCodes.BAD_REQUEST, message: 'Malformed JWT' };
                if (e.message === 'invalid signature') return { status: this.httpCodes.UNAUTHORIZED, message: 'Invalid signature' };
                if (e.message === 'invalid algorithm') return 500;
                console.log(e);
                throw e;
            }

            let account = await accountModel.findOne({ id: decoded.userID });
            if (!account) return { status: this.httpCodes.NOT_FOUND, message: 'No user with this token could be found' };
            if (account.tokens.indexOf(decoded.tokenID) === -1) return { status: this.httpCodes.NOT_FOUND, message: 'The token could not be found in the user' };

            return { iat: decoded.iat, account };
        });
    }
}

module.exports = AccountRouter;
