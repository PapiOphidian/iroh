/**
 * Created by Wolke on 11.06.2017.
 */
const mongoose = require('mongoose');
let accountSchema = mongoose.Schema({
    id: String,
    token:[String],
    active:Boolean
});
let accountModel = mongoose.model('Accounts', accountSchema);
module.exports = accountModel;