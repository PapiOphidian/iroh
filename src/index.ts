import fs from 'fs';
import path from 'path';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import bodyParser from 'body-parser';
import winston from 'winston';
import cors from 'cors';
import mongoose from 'mongoose';
mongoose.Promise = Promise;

import JWT from './utils/jwt';
import WolkeWebToken from './utils/WolkeWebToken';

import AuthMiddleware from './middleware/auth.middleware';

import permNodes from './permNodes.json';

import {
  Registrator,
  WildcardRouter,
  PermMiddleware,
  GenericRouter,
  ShutdownHandler,
} from '@weeb_services/wapi-core';

const pkg: import('./types').Package = JSON.parse(
  // TypeScript doesn't like imports of files outside of the source directory
  fs.readFileSync(path.join(__dirname, '../package.json'), {
    encoding: 'utf-8',
  }),
);
const config: import('./types').Config = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../config/main.json'), {
    encoding: 'utf-8',
  }),
);
let registrator: Registrator | undefined = undefined;
if (config.registration?.enabled) {
  registrator = new Registrator(
    config.registration.host,
    config.registration.token,
  );
}
let shutdownManager;
winston.add(new winston.transports.Console());

const init = async () => {
  if (config.masterToken.enabled) winston.warn('Master token is enabled!');

  const jwt = new JWT(config.jwt.algorithm);
  const wwt = new WolkeWebToken();
  await jwt.loadCert(config.jwt.privCertFile, config.jwt.pubCertFile);
  await wwt.loadCert(config.jwt.privCertFile);
  winston.info('JWT initialized.');

  await mongoose.connect(config.dburl);
  winston.info('MongoDB connected.');

  const app = await NestFactory.create(AppModule);

  app.use((req, res, next) => {
    req.config = config;
    req.jwt = jwt;
    req.wwt = wwt;
    next();
  });

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cors());

  app.use(new AuthMiddleware().middleware());
  app.use(new PermMiddleware(pkg.name, config.env).middleware());

  app.use(
    new GenericRouter(
      pkg.version,
      `Welcome to ${pkg.name}, the weeb account api`,
      `${pkg.name}-${config.env}`,
      permNodes,
    ).router(),
  );

  app.use(new WildcardRouter().router());

  const server = await app.listen(config.port, config.host);
  shutdownManager = new ShutdownHandler(
    server,
    registrator,
    mongoose,
    pkg.serviceName,
  );

  if (registrator)
    await registrator.register(pkg.serviceName, [config.env], config.port);

  winston.info(`Server started on ${config.host}:${config.port}`);
};

init().catch((e) => {
  winston.error(e);
  winston.error('Failed to initialize.');
  return process.exit(1);
});

process.on('SIGTERM', () =>
  shutdownManager ? shutdownManager.shutdown() : process.exit(),
);
process.on('SIGINT', () =>
  shutdownManager ? shutdownManager.shutdown() : process.exit(),
);
