import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const readFileAsync = (filePath: string): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });

/**
 * Class for creating and verifying JSON web tokens
 * Call loadCert() before using sign() or verify()
 */
class JWT {
  cert: Buffer | null;
  pubCert: Buffer | null;
  algorithm: string;

  /**
   * Creates a new JWT handler instance
   *
   * @param algorithm The algorithm to be used. If undefined RS256 will be used as algorithm.
   */
  public constructor(algorithm: string) {
    this.cert = null;
    this.pubCert = null;
    this.algorithm = algorithm || 'RS256';
  }

  /**
   * Loads the certificate from the given file path
   *
   * @param privCertFilePath The path where the cert is located
   * @param pubCertFilePath The path where the public cert is located if algorithm is asym
   */
  public async loadCert(
    privCertFilePath: string,
    pubCertFilePath: string,
  ): Promise<void> {
    if (privCertFilePath)
      this.cert = await readFileAsync(path.resolve(privCertFilePath));
    if (pubCertFilePath)
      this.pubCert = await readFileAsync(path.resolve(pubCertFilePath));
  }

  /**
   * Signs a payload and returns a JSON web token
   *
   * @param payload The payload to be signed
   * @returns The JSON web token
   */
  public sign(payload: Record<any, any>): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.cert) return reject(Error('Certificate not loaded yet.'));
      jwt.sign(
        payload,
        this.cert,
        { algorithm: this.algorithm },
        (err, token) => {
          if (err) return reject(err);
          resolve(token);
        },
      );
    });
  }

  /**
   * Verifies a JSON web token and returns its payload
   *
   * @param token The JSON web token
   * @returns The payload
   */
  public verify(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const cert = this.pubCert ? this.pubCert : this.cert;
      if (!this.cert) return reject(Error('Certificate not loaded yet.'));
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
   * @param token The JSON web token
   * @returns The payload
   */
  public decode(token: string): any {
    return jwt.decode(token);
  }
}

export = JWT;
