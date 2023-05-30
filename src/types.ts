export type Config = {
  host: string;
  port: number;
  dburl: string;
  env: string;
  jwt: {
    algorithm: 'RS256';
    privCertFile: string;
    pubCertFile: string;
  };
  masterToken: {
    enabled: boolean;
    token: string;
  };
  registration: {
    enabled: boolean;
    host: string;
    token: string;
  };
};

export type Package = {
  name: string;
  version: string;
  description: string;
  main: string;
  serviceName: 'accounts';
  scripts: Record<string, string>;
  author: string;
  contributors: Array<string>;
  license: 'MIT';
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  jest: {
    moduleFileExtensions: Array<string>;
    rootDir: string;
    testRegex: string;
    transform: Record<string, string>;
    collectCoverageFrom: Array<string>;
    coverageDirectory: string;
    testEnvironment: 'node';
  };
};

export type Account = {
  id: string;
  tokens: Array<string>;
  perms: Record<string, boolean>;
};

export type ErrorResponse = {
  status: number;
  message: string;
};
