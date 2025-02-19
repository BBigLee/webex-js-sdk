/*!
 * Copyright (c) 2015-2020 Cisco Systems, Inc. See LICENSE file.
 */

const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const {Buffer} = require('safe-buffer');

/**
 * Creates a jwt user token
 * @param {object} options
 * @param {String} options.displayName *required*
 * @param {Number} options.expiresInSeconds
 * @param {String} options.issuer Guest Issuer ID
 * @param {String} options.userId *no spaces*
 * @returns {Promise<object>}
 */
module.exports = function createUser({
  displayName,
  expiresInSeconds,
  issuer,
  userId
}) {
  const payload = {
    name: displayName
  };
  const options = {
    expiresIn: expiresInSeconds || 90 * 60,
    issuer: issuer || process.env.WEBEX_APPID_ORGID,
    subject: userId || uuid.v4()
  };
  const secret = Buffer.from(process.env.WEBEX_APPID_SECRET, 'base64');

  try {
    const jwtToken = jwt.sign(payload, secret, options);

    return Promise.resolve({
      jwt: jwtToken,
      secret: process.env.WEBEX_APPID_SECRET
    });
  }
  catch (e) {
    return Promise.reject(e);
  }
};
