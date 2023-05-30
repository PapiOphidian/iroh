import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const readFileAsync = (filePath: string): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });

/**
 * Alternative Tokens
 */
class WolkeWebToken {
  public cert: Buffer | null;
  public pubCert: Buffer | null;
  public algorithm: string;

  public constructor(algorithm?: string) {
    this.cert = null;
    this.pubCert = null;
    this.algorithm = algorithm || 'sha224';
  }

  /**
   * Loads the certificate from the given file path
   *
   * @param privCertFilePath The path where the cert is located
   */
  public async loadCert(privCertFilePath: string): Promise<void> {
    if (privCertFilePath)
      this.cert = await readFileAsync(path.resolve(privCertFilePath));
  }

  /**
   * Generate a new token
   * @param accountId - id of the account
   * @param data - data that should be encrypted within the token
   * @return the encrypted token as base64
   */
  public generate(accountId: string, data: any): string {
    const secretPart = this.sign(data);
    const token = Buffer.from(`${accountId}:${secretPart.toString()}`);
    return token.toString('base64');
  }

  /**
   * Signs the secret part of a token
   * @param data - the data to sign
   * @return signed data
   */
  public sign(data: crypto.BinaryLike): string {
    if (!this.cert) throw new Error('Certificate not loaded yet.');

    return crypto
      .createHmac(this.algorithm, this.cert)
      .update(data)
      .digest('hex');
  }

  /**
   * Verifies a signed token
   * @param signedData - the received token
   * @param unsignedData - data that is expected within the token
   * @return whether the token is valid or not
   */
  public verify(signedData: string, unsignedData: crypto.BinaryLike): boolean {
    if (!this.cert) throw new Error('Certificate not loaded yet.');

    const hash = crypto
      .createHmac(this.algorithm, this.cert)
      .update(unsignedData)
      .digest('hex');
    return hash === signedData;
  }
}

export = WolkeWebToken;
