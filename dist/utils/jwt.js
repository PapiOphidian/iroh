"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const readFileAsync = (filePath) => new Promise((resolve, reject) => {
    fs_1.default.readFile(filePath, (err, data) => {
        if (err)
            return reject(err);
        resolve(data);
    });
});
class JWT {
    constructor(algorithm) {
        this.cert = null;
        this.pubCert = null;
        this.algorithm = algorithm || 'RS256';
    }
    async loadCert(privCertFilePath, pubCertFilePath) {
        if (privCertFilePath)
            this.cert = await readFileAsync(path_1.default.resolve(privCertFilePath));
        if (pubCertFilePath)
            this.pubCert = await readFileAsync(path_1.default.resolve(pubCertFilePath));
    }
    sign(payload) {
        return new Promise((resolve, reject) => {
            if (!this.cert)
                return reject(Error('Certificate not loaded yet.'));
            jsonwebtoken_1.default.sign(payload, this.cert, { algorithm: this.algorithm }, (err, token) => {
                if (err)
                    return reject(err);
                resolve(token);
            });
        });
    }
    verify(token) {
        return new Promise((resolve, reject) => {
            const cert = this.pubCert ? this.pubCert : this.cert;
            if (!this.cert)
                return reject(Error('Certificate not loaded yet.'));
            jsonwebtoken_1.default.verify(token, cert, { algorithm: this.algorithm }, (err, decoded) => {
                if (err)
                    return reject(err);
                return resolve(decoded);
            });
        });
    }
    decode(token) {
        return jsonwebtoken_1.default.decode(token);
    }
}
module.exports = JWT;
