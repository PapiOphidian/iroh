'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const winston = require('winston');
const cors = require('cors');
const mongoose = require('mongoose');
const { GenericRouter, WildcardRouter } = require('wapi-core');
mongoose.Promise = Promise;

const JWT = require('./utils/jwt');
const AuthMiddleware = require('./middleware/auth.middleware');
const AccountRouter = require('./routers/account.router');

let init = async() => {
    let config;
    try {
        config = require('../config/main.json');
    } catch (e) {
        winston.error(e);
        winston.error('Failed to require config.');
        return process.exit(1);
    }
    winston.info('Config loaded.');

    if (config.masterToken.enabled) winston.warn('Master token is enabled!');

    let jwt = new JWT(config.jwt.algorithm);
    try {
        await jwt.loadCert(config.jwt.privCertFile, config.jwt.pubCertFile);
    } catch (e) {
        winston.error(e);
        winston.error('Failed to load JWT key.');
        return process.exit(1);
    }
    winston.info('JWT initialized.');

    try {
        await mongoose.connect(config.dburl, { useMongoClient: true });
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
        next();
    });

    // Some other middleware
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cors());

    // Auth middleware
    app.use(new AuthMiddleware().middleware());

    // Routers
    app.use(new GenericRouter('v', 'm').router());
    app.use(new AccountRouter().router());

    // Always use this last
    app.use(new WildcardRouter().router());

    app.listen(config.port, config.host);
    winston.info(`Server started on ${config.host}:${config.port}`);
};

init().catch(e => {
    winston.error(e);
    winston.error('Failed to initialize.');
    process.exit(1);
});
