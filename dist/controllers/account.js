"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountController = void 0;
const common_1 = require("@nestjs/common");
const account_1 = require("../services/account");
let AccountController = class AccountController {
    constructor(service) {
        this.service = service;
    }
    getWolkeToken(request) {
        return JSON.stringify(this.service.getWolkeToken(request.wwt, request.account));
    }
    async getUsers(request) {
        const users = await this.service.getUsers(request.account, request.config);
        return JSON.stringify(users);
    }
    async getUser(request) {
        const user = await this.service.getUser(request.account, request.config, request.params.id);
        return JSON.stringify(user);
    }
    async deleteUser(request) {
        const result = await this.service.deleteUser(request.account, request.config, request.params.id);
        return JSON.stringify(result);
    }
    async postUser(request) {
        const account = await this.service.postUser(request.account, request.config, request.body);
        return JSON.stringify(account);
    }
    async putUser(request) {
        const result = await this.service.putUser(request.account, request.config, request.params.id, request.body);
        return JSON.stringify(result);
    }
    async postToken(request) {
        const result = await this.service.postToken(request.account, request.config, request.jwt, request.wwt, request.body);
        return JSON.stringify(result);
    }
    async deleteToken(request) {
        const result = await this.service.deleteToken(request.account, request.config, request.params.id);
        return JSON.stringify(result);
    }
    async validateToken(request) {
        const result = await this.service.validateToken(request.wwt, request.jwt, request.query.wolkeToken, request.params.token);
        return JSON.stringify(result);
    }
};
__decorate([
    (0, common_1.Get)('/wolkeToken'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", String)
], AccountController.prototype, "getWolkeToken", null);
__decorate([
    (0, common_1.Get)('/user'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AccountController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('/user/:id'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AccountController.prototype, "getUser", null);
__decorate([
    (0, common_1.Delete)('/user:id'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AccountController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Post)('/user'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AccountController.prototype, "postUser", null);
__decorate([
    (0, common_1.Put)('/user/:id'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AccountController.prototype, "putUser", null);
__decorate([
    (0, common_1.Post)('/token'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AccountController.prototype, "postToken", null);
__decorate([
    (0, common_1.Delete)('/token/:id'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AccountController.prototype, "deleteToken", null);
__decorate([
    (0, common_1.Get)('/validate/:token'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AccountController.prototype, "validateToken", null);
AccountController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [account_1.AccountService])
], AccountController);
exports.AccountController = AccountController;
