/*!
 * Copyright (c) 2015-2020 Cisco Systems, Inc. See LICENSE file.
 */


/**
 * Helper for getting a url to localhost
 * @param {string} resource
 * @param {Object} options
 * @param {boolean} options.full if true, will always include protocol and host
 * @returns {string}
 */
module.exports = function makeLocalUrl(resource, options) {
  if (typeof window === 'undefined' || options && options.full) {
    return `http://localhost:${process.env.FIXTURE_PORT}${resource}`;
  }

  return `/fixtures${resource}`;
};
