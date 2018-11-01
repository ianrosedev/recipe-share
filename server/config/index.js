import { merge } from 'lodash';
import development from './development';
import testing from './testing';
import production from './production';
import dotenv from 'dotenv';

// NODE_ENV setup
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Don't use `dotenv` in production
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const baseConfig = { port: 3001 };
let envConfig;

switch (process.env.NODE_ENV) {
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

export default merge(baseConfig, envConfig);
