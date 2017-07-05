/**
 * Created by Wolke on 09.06.2017.
 */
const express = require('express');
const bodyParser = require('body-parser');
const loader = require('docker-config-loader');
const winston = require('winston');
const cors = require('cors');
const genericRouter = require('./routes/generic.router');
const accountRouter = require('./routes/account.router');
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    'timestamp': true,
    'colorize': true
});
let config;
try {
    config = loader({secretName: 'secret_name', localPath: './config/main.json'});
} catch (e) {
    winston.error(e);
    winston.error('Failed to require config!');
    process.exit(1);
}
let mongoose = require('mongoose');
mongoose.Promise = Promise;
mongoose.connect(config.dburl, (err) => {
    if (err) {
        winston.error("Unable to connect to Mongo Server!");
        process.exit(1);
    }
});
let app = express();
app.use((req, res, next) => {
    req.config = config;
    next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());
app.use(genericRouter, accountRouter);
app.listen(config.port, config.host);
winston.info(`Server started ${config.host}:${config.port}`);