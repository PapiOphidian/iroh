import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  id: String,
  name: String,
  discordUserId: String,
  active: Boolean,
  tokens: [String],
  scopes: [String],
});

const accountModel = mongoose.model('Accounts', accountSchema);
export = accountModel;
