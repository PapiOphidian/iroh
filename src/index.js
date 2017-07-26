const express = require('express');
const bodyParser = require('body-parser');
const winston = require('winston');
const cors = require('cors');
const mongoose = require('mongoose');
mongoose.Promise = Promise;

const JWT = require('./jwt');
const GenericRouter = require('./routes/generic.router');
const AccountRouter = require('./routes/account.router');
const WildcardRouter = require('./routes/wildcard.router');

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
            await this.jwt.loadCert(config.jwt.privCertFile, config.jwt.pubCertFile);
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

        this.app = express();
        this.app.use((req, res, next) => {
            req.config = config;
            next();
        });

        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(cors());
        this.app.use(new GenericRouter().router(), new AccountRouter(this.jwt).router(), new WildcardRouter().router());

        this.app.listen(config.port, config.host);

        winston.info(`Server started ${config.host}:${config.port}`);
    }
}

let base = new Base();
base.init().catch(e => {
    winston.error(e);
    winston.error('Failed to initialize.');
    process.exit(1);
});
