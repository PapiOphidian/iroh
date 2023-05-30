"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const readFileAsync = (filePath) => new Promise((resolve, reject) => {
    fs_1.default.readFile(filePath, (err, data) => {
        if (err)
            return reject(err);
        resolve(data);
    });
});
class WolkeWebToken {
    constructor(algorithm) {
        this.cert = null;
        this.pubCert = null;
        this.algorithm = algorithm || 'sha224';
    }
    async loadCert(privCertFilePath) {
        if (privCertFilePath)
            this.cert = await readFileAsync(path_1.default.resolve(privCertFilePath));
    }
    generate(accountId, data) {
        const secretPart = this.sign(data);
        const token = Buffer.from(`${accountId}:${secretPart.toString()}`);
        return token.toString('base64');
    }
    sign(data) {
        if (!this.cert)
            throw new Error('Certificate not loaded yet.');
        return crypto_1.default
            .createHmac(this.algorithm, this.cert)
            .update(data)
            .digest('hex');
    }
    verify(signedData, unsignedData) {
        if (!this.cert)
            throw new Error('Certificate not loaded yet.');
        const hash = crypto_1.default
            .createHmac(this.algorithm, this.cert)
            .update(unsignedData)
            .digest('hex');
        return hash === signedData;
    }
}
module.exports = WolkeWebToken;
