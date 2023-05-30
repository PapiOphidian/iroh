import type WolkeWebToken from '../src/utils/WolkeWebToken';
import type JWT from "../src/utils/jwt";

import type { Account, Config } from "../src/types";

declare module 'express' {
	interface Request {
		wwt: WolkeWebToken;
		jwt: JWT;
		account: Account;
		config: Config;
	}
}
