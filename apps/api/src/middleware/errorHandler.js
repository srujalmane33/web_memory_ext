import { config } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  const statusCode = err.status || err.statusCode || 500;
  const errorCode = err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'ERROR');

  const errorResponse = {
    error: {
      code: errorCode,
      message: err.message || 'An unexpected error occurred.',
    },
  };

  if (config.nodeEnv === 'development' && statusCode === 500) {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
}
