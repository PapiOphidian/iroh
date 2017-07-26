'use strict';

const BaseRouter = require('./base.router');
const version = require('../../package.json').version;

class GenericRouter extends BaseRouter {
    constructor() {
        super();

        this.all('/', async() => ({ version, message: 'Welcome to the weeb account api' }));
    }
}

module.exports = GenericRouter;
