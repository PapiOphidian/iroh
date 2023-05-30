declare module '@weeb_services/wapi-core' {
	type UnpackArray<T> = T extends Array<infer R> ? R : never;
	type UnpackRecord<T> = T extends Record<any, infer V> ? V : never;
	export class BaseMiddleware {
		public whitelistArray: Array<{ pattern: import("url-pattern"), method: string; }>;

		public getResponse(response: number | { status?: number; message?: string; }): { status: number; message: string; };
		public exec(request: any, response: any, next: () => unknown): Promise<{ status: number; message: string; }>;
		public whitelist(path: string, method?: string): void;
		public middleware(): (req: any, res: any, next: () => void) => Promise<void>;
	}
	export class AccountAPIMiddleware extends BaseMiddleware {
		public urlBase: string;
		public uagent: string;

		public constructor(urlBase: string, uagent: string, whitelist: Array<{ path: string; method: string; }>);
	}
	export class PermMiddleware extends BaseMiddleware {
		public scopeKey: string;

		public constructor(apiName: string, apiEnv: string);
	}
	export class TrackingMiddleware extends BaseMiddleware {
		public name: string;
		public version: string;
		public environment: string;
		public trackingKey: string;

		public constructor(name: string, version: string, environment: string, trackingKey: string);
	}

	export class BaseRouter {
		public handleResponse(res: any, response: number | { status?: number; message?: string; }): void;
		public wrapHandler(handler: (req: any, res: any) => any): (req: any, res: any) => Promise<void>;
		public all(path: string, handler: (req: any, res: any) => any): import("express").Router["all"];
		public get(path: string, handler: (req: any, res: any) => any): import("express").Router["get"];
		public post(path: string, handler: (req: any, res: any) => any): import("express").Router["post"];
		public put(path: string, handler: (req: any, res: any) => any): import("express").Router["put"];
		public delete(path: string, handler: (req: any, res: any) => any): import("express").Router["delete"];

		public router(): import("express").Router;
	}
	export class GenericRouter extends BaseRouter {
		public constructor(version: string, message: string, apiIdentifier: string, permNodes: Array<{ name: string; description: string; routes: Array<string>; }>);
	}
	export class WildcardRouter extends BaseRouter {}

	type Constants = {
		HTTPCodes: {
			OK: 200;
			BAD_REQUEST: 400;
			UNAUTHORIZED: 401;
			FORBIDDEN: 403;
			NOT_FOUND: 404;
			INTERNAL_SERVER_ERROR: 500;
		};
		DefaultResponses: {
			200: 'OK',
			400: 'Bad Request',
			401: 'Unauthorized',
			403: 'Forbidden',
			404: 'Not Found',
			500: 'Internal Server Error'
		};
	};
	export const Constants: Constants;
	type Utils = {
		buildFullyQualifiedScope<N extends string, E extends string, S extends string>(name: N, env: E, scope: S): S extends '' ? `${N}-${E}` : `${N}-${E}:${S}`;
		buildMissingScopeMessage(name: string, env: string, scopes: Array<string> | string): string;
		checkPermissions<W extends Array<string>, A extends { perms: { [P in UnpackArray<W> | "all"]?: boolean } } | undefined, R extends boolean>(account: A, wantedPermissions: W, requireAccount?: R): A extends undefined ? R extends true ? false : true : UnpackRecord<{ [P in UnpackArray<W>]: NonNullable<A>["perms"][P] }> extends true ? true : UnpackRecord<{ [P in UnpackArray<W>]: NonNullable<A>["perms"][P] }> extends false ? false : boolean;
		checkScopes(wantedScope: string, scopes: Array<string>): boolean;
		isTrue<T extends string | boolean>(value: string | boolean): T extends boolean ? T : boolean;
	};
	export const Utils: Utils;
	export const Logger: import("winston").Logger;
	export class Registrator {
		public agent: import("axios").AxiosInstance;
		public id: string;

		public constructor(host: string, aclToken?: string);

		public register<T>(name: string, tags: Array<any>, port: number, checks?: any): import("axios").AxiosPromise<T>;
		public unregister<T>(name: string): import("axios").AxiosPromise<T>;
	}
	class HttpError extends Error {
		public name: string;
		public status: number;

		public constructor(message: string, status: number);
	}
	type Errors = {
		HttpError: typeof HttpError
	}
	export const Errors: Errors;
	export class ShutdownHandler {
		public gsm: import("@moebius/http-graceful-shutdown").GracefulShutdownManager;
		public registrator: Registrator | undefined;
		public mongoose: typeof import("mongoose");
		public name: string;
		public errors: Array<string>;

		public constructor(server: ConstructorParameters<typeof import("@moebius/http-graceful-shutdown").GracefulShutdownManager>["0"], registrator: Registrator | undefined, mongoose: typeof import("mongoose"), name: string);

		public shutdown(): never;
		private _stopWebserver(cb: () => any): void;
		private _stopMongoose(cd: () => any): void;
		private _unregister(cb: () => any): void;
	}
}
