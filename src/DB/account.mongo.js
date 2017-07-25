const mongoose = require('mongoose');

let accountSchema = mongoose.Schema({
    id: String,
    name: String,
    discordUserId: String,
    active: Boolean,
    tokens: [String],
    scopes: [String],
});

let accountModel = mongoose.model('Accounts', accountSchema);
module.exports = accountModel;
