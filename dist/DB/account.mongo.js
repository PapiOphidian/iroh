"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const mongoose_1 = __importDefault(require("mongoose"));
const accountSchema = new mongoose_1.default.Schema({
    id: String,
    name: String,
    discordUserId: String,
    active: Boolean,
    tokens: [String],
    scopes: [String],
});
const accountModel = mongoose_1.default.model('Accounts', accountSchema);
module.exports = accountModel;
