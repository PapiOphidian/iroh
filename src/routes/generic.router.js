let router = require('express').Router();
const version = require('../../package.json').version;
router.all('/', ((req, res) => {
    return res.status(200).json({status:200, version, message: 'Welcome to the rem-account-api'})
}));
module.exports = router;