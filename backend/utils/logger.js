/**
 * Simple logger utility for backend application
 * Provides consistent logging with environment awareness
 */

/* eslint-disable no-console */
const logger = {
  info: (...args) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(...args);
    }
  },

  error: (...args) => {
    console.error(...args);
  },

  warn: (...args) => {
    console.warn(...args);
  },

  debug: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG]', ...args);
    }
  },
};
/* eslint-enable no-console */

module.exports = logger;
