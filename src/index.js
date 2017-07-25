const express = require('express');
const bodyParser = require('body-parser');
const winston = require('winston');
const cors = require('cors');
const mongoose = require('mongoose');
mongoose.Promise = Promise;

const JWT = require('./jwt');
const genericRouter = require('./routes/generic.router');
const accountRouter = require('./routes/account.router');

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    timestamp: true,
    colorize: true,
});

class Base {
    async init() {
        let config;
        try {
            config = require('../config/main.json');
        } catch (e) {
            winston.error(e);
            winston.error('Failed to require config!');
            process.exit(1);
        }

        this.jwt = new JWT(config.jwt.algorithm);
        try {
            await this.jwt.loadCert(config.jwt.certFile);
        } catch (e) {
            winston.error(e);
            winston.error('Failed to load JWT key!');
            process.exit(1);
        }

        mongoose.connect(config.dburl, { useMongoClient: true }, (err) => {
            if (err) {
                winston.error('Unable to connect to Mongo Server!');
                process.exit(1);
            }
        });

        let app = express();
        app.use((req, res, next) => {
            req.config = config;
            next();
        });

        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(cors());
        app.use(genericRouter, accountRouter);

        app.listen(config.port, config.host);

        winston.info(`Server started ${config.host}:${config.port}`);
    }
}

global.base = new Base();
global.base.init().catch(e => {
    winston.error(e);
    winston.error('Failed to initialize.');
    process.exit(1);
});
