import deepMerge from 'deepmerge';
import development from './development';
import testing from './testing';
import production from './production';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const env = process.env.NODE_ENV;

const baseConfig = {
  port: 3001
};

let envConfig;

switch (env) {
  case 'development':
    envConfig = development;
    break;
  case 'testing':
    envConfig = testing;
    break;
  case 'production':
    envConfig = production;
    break;
  default:
    envConfig = development;
}

export default deepMerge(baseConfig, envConfig);
