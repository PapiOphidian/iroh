'use strict';

const mongoose = require('mongoose');

const accountSchema = mongoose.Schema({
    id: String,
    name: String,
    discordUserId: String,
    active: Boolean,
    tokens: [String],
    scopes: [String],
});

const accountModel = mongoose.model('Accounts', accountSchema);
module.exports = accountModel;
