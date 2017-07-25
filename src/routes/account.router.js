let router = require('express').Router();
const winston = require('winston');
let accountModel = require('../DB/account.mongo');
const shortid = require('shortid');
router.get('/info', async (req, res) => {
    try {
        let accounts = await accountModel.find({});
        return res.status(200).json({status: 200, accounts})
    } catch (e) {
        winston.error(e);
        return res.status(500).json({status: 500, message: 'Internal error'});
    }
});
router.get('/info/:id', async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(404).json({status: 404, message: 'No id was passed'});
        }
        let account = await accountModel.findOne({id: req.params.id});
        if (!account) {
            return res.status(404).json({status: 404, message: 'No account exists with this id'});
        }
        return res.status(200).json({status: 200, account});
    } catch (e) {
        winston.error(e);
        return res.status(500).json({status: 500, message: 'Internal error'});
    }
});
router.get('/token/:token', async (req, res) => {
    try {
        if (!req.params.token) {
            return res.status(404).json({status: 404, message: 'No token was passed'});
        }
        let account = await accountModel.findOne({token: {$in: [req.params.token]}, active: true});
        if (!account) {
            return res.status(404).json({status: 404, message: 'This token seems to be invalid'});
        }
        if (!account.active) {
            return res.status(404).json({status: 404, message: 'This token seems to be invalid'});
        }
        return res.status(200).json({status: 200, active: true, id: account.id});
    } catch (e) {
        winston.error(e);
        return res.status(500).json({status: 500, message: 'Internal error'});
    }
});
router.post('/new', async (req, res) => {
    try {
        let tokens = [];
        console.log(req.body);
        if (req.body && req.body.token) {
            tokens.push(req.body.token.substring(0, req.body.token.length / 2))
        }
        let account = new accountModel({
            id: shortid.generate(),
            token: tokens,
            active: true
        });
        await account.save();
        return res.status(200).json({status: 200, message: 'Account created successfully', account});
    } catch (e) {
        winston.error(e);
        return res.status(500).json({status: 500, message: 'Internal error'});
    }
});
//TODO Allow accounts to be edited
// router.post('/edit', async (req, res) => {
//
// });
module.exports = router;