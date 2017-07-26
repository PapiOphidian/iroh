const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

/**
 * Class for creating and verifying JSON web tokens
 * Call loadCert() before using sign() or verify()
 */
class JWT {
    /**
     * Creates a new JWT handler instance
     * 
     * @param {string} algorithm The algorithm to be used. If undefined RS256 will be used as algorithm.
     */
    constructor(algorithm) {
        this.cert = null;
        this.pubCert = null;
        this.algorithm = algorithm || 'RS256';
    }

    /**
     * Loads the certificate from the given file path
     * 
     * @param {string} privCertFilePath The path where the cert is located
     * @param {string} pubCertFilePath The path where the public cert is located if algorithm is asym
     * @returns {Promise<void>}
     */
    loadCert(privCertFilePath, pubCertFilePath) {
        return new Promise((resolve, reject) => {
            fs.readFile(path.resolve(privCertFilePath), (err, data) => {
                if (err) return reject(err);
                this.cert = data;
                if (!pubCertFilePath) return resolve();
                fs.readFile(path.resolve(pubCertFilePath), (err2, data2) => {
                    if (err2) return reject(err2);
                    this.pubCert = data2;
                    resolve();
                });
            });
        });
    }

    /**
     * Signs a payload and returns a JSON web token
     * 
     * @param {any} payload The payload to be signed
     * @returns {Promise<string>} The JSON web token
     */
    sign(payload) {
        return new Promise((resolve, reject) => {
            if (!this.cert) return reject(Error('Certificate not loaded yet.'));
            jwt.sign(payload, this.cert, { algorithm: this.algorithm }, (err, token) => {
                if (err) return reject(err);
                resolve(token);
            });
        });
    }

    /**
     * Verifies a JSON web token and returns its payload
     * 
     * @param {string} token The JSON web token
     * @returns {Promise<any>} The payload
     */
    verify(token) {
        return new Promise((resolve, reject) => {
            if (!this.cert) return reject(Error('Certificate not loaded yet.'));
            let cert = this.pubCert ? this.pubCert : this.cert;
            jwt.verify(token, cert, { algorithm: this.algorithm }, (err, decoded) => {
                if (err) return reject(err);
                return resolve(decoded);
            });
        });
    }

    /**
     * Decodes a JSON web token
     * 
     * WARNING: DO NOT USE THIS FUNCTION FOR UNTRUSTED TOKENS
     * ONLY USE THIS FUNCTION FOR GETTING THE DATA
     * USE verify() IF YOU HAVE AN UNTRUSTED TOKEN
     * 
     * @param {string} token The JSON web token
     * @returns {any} The payload
     */
    decode(token) {
        return jwt.decode(token);
    }
}

module.exports = JWT;
