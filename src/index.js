'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const winston = require('winston');
const cors = require('cors');
const mongoose = require('mongoose');
mongoose.Promise = Promise;

const JWT = require('./utils/jwt');
const WolkeWebToken = require('./utils/WolkeWebToken');

const AuthMiddleware = require('./middleware/auth.middleware');

const PermMiddleware = require('wapi-core').PermMiddleware;

const GenericRouter = require('wapi-core').GenericRouter;
const AccountRouter = require('./routers/account.router');
const WildcardRouter = require('wapi-core').WildcardRouter;

const permNodes = require('./permNodes');

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    timestamp: true,
    colorize: true,
});

let init = async () => {
    let config, pkg;
    try {
        config = require('../config/main.json');
        pkg = require('../package.json');
    } catch (e) {
        winston.error(e);
        winston.error('Failed to require config.');
        return process.exit(1);
    }
    winston.info('Config loaded.');

    if (config.masterToken.enabled) winston.warn('Master token is enabled!');

    let jwt = new JWT(config.jwt.algorithm);
    let wwt = new WolkeWebToken();
    try {
        await jwt.loadCert(config.jwt.privCertFile, config.jwt.pubCertFile);
        await wwt.loadCert(config.jwt.privCertFile);
    } catch (e) {
        winston.error(e);
        winston.error('Failed to load JWT key.');
        return process.exit(1);
    }
    winston.info('JWT initialized.');

    try {
        await mongoose.connect(config.dburl, {useMongoClient: true});
    } catch (e) {
        winston.error('Unable to connect to Mongo Server.');
        return process.exit(1);
    }
    winston.info('MongoDB connected.');

    // Initialize express
    let app = express();

    // Middleware for config & jwt
    app.use((req, res, next) => {
        req.config = config;
        req.jwt = jwt;
        req.wwt = wwt;
        next();
    });

    // Some other middleware
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(cors());

    // Auth middleware
    app.use(new AuthMiddleware().middleware());

    app.use(new PermMiddleware(pkg.name, config.env).middleware());

    // Routers
    app.use(new GenericRouter(pkg.version, `Welcome to ${pkg.name}, the weeb account api`, `${pkg.name}-${config.env}`, permNodes).router());
    app.use(new AccountRouter().router());

    // Always use this last
    app.use(new WildcardRouter().router());

    app.listen(config.port, config.host);
    winston.info(`Server started on ${config.host}:${config.port}`);
};

init()
    .catch(e => {
        winston.error(e);
        winston.error('Failed to initialize.');
        process.exit(1);
    });
