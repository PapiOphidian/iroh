"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const body_parser_1 = __importDefault(require("body-parser"));
const winston_1 = __importDefault(require("winston"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
mongoose_1.default.Promise = Promise;
const jwt_1 = __importDefault(require("./utils/jwt"));
const WolkeWebToken_1 = __importDefault(require("./utils/WolkeWebToken"));
const auth_middleware_1 = __importDefault(require("./middleware/auth.middleware"));
const permNodes_json_1 = __importDefault(require("./permNodes.json"));
const wapi_core_1 = require("@weeb_services/wapi-core");
const pkg = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, '../package.json'), {
    encoding: 'utf-8',
}));
const config = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, '../config/main.json'), {
    encoding: 'utf-8',
}));
let registrator = undefined;
if (config.registration?.enabled) {
    registrator = new wapi_core_1.Registrator(config.registration.host, config.registration.token);
}
let shutdownManager;
const init = async () => {
    if (config.masterToken.enabled)
        winston_1.default.warn('Master token is enabled!');
    const jwt = new jwt_1.default(config.jwt.algorithm);
    const wwt = new WolkeWebToken_1.default();
    await jwt.loadCert(config.jwt.privCertFile, config.jwt.pubCertFile);
    await wwt.loadCert(config.jwt.privCertFile);
    winston_1.default.info('JWT initialized.');
    await mongoose_1.default.connect(config.dburl);
    winston_1.default.info('MongoDB connected.');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((req, res, next) => {
        req.config = config;
        req.jwt = jwt;
        req.wwt = wwt;
        next();
    });
    app.use(body_parser_1.default.json());
    app.use(body_parser_1.default.urlencoded({ extended: true }));
    app.use((0, cors_1.default)());
    app.use(new auth_middleware_1.default().middleware());
    app.use(new wapi_core_1.PermMiddleware(pkg.name, config.env).middleware());
    app.use(new wapi_core_1.GenericRouter(pkg.version, `Welcome to ${pkg.name}, the weeb account api`, `${pkg.name}-${config.env}`, permNodes_json_1.default).router());
    app.use(new wapi_core_1.WildcardRouter().router());
    const server = await app.listen(config.port, config.host);
    shutdownManager = new wapi_core_1.ShutdownHandler(server, registrator, mongoose_1.default, pkg.serviceName);
    if (registrator)
        await registrator.register(pkg.serviceName, [config.env], config.port);
    winston_1.default.info(`Server started on ${config.host}:${config.port}`);
};
init().catch((e) => {
    winston_1.default.error(e);
    winston_1.default.error('Failed to initialize.');
    return process.exit(1);
});
process.on('SIGTERM', () => shutdownManager.shutdown());
process.on('SIGINT', () => shutdownManager.shutdown());
