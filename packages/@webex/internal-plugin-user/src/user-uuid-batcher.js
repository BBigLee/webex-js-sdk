/*!
 * Copyright (c) 2015-2020 Cisco Systems, Inc. See LICENSE file.
 */

import {Batcher, WebexPlugin} from '@webex/webex-core';

/**
 * @class
 */
const AbstractUserUUIDRequestBatcher = Batcher.extend({
  namespace: 'User',

  /**
   * @param {string} item
   * @returns {Promise<Object>}
   */
  prepareItem(item) {
    return Promise.resolve({email: item});
  },

  /**
   * @param {HttpResponseObject} res
   * @returns {Promise}
   */
  handleHttpSuccess(res) {
    return Promise.all(Object.keys(res.body).map((email) => {
      if (res.body[email] && res.body[email].id) {
        return this.handleItemSuccess(email, res.body[email]);
      }

      return this.handleItemFailure(email, res.body[email]);
    }));
  },

  handleItemFailure(email, response) {
    return this.getDeferredForResponse(email)
      .then((defer) => {
        defer.reject(response);
      });
  },

  /**
   * @param {string} email
   * @param {Object} response
   * @returns {Promise}
   */
  handleItemSuccess(email, response) {
    return this.getDeferredForResponse(email)
      .then((defer) => {
        defer.resolve(response);
      });
  },

  /**
   * @param {string} email
   * @returns {Promise<string>}
   */
  fingerprintRequest(email) {
    return Promise.resolve(email.email || email);
  },

  /**
   * @param {string} email
   * @returns {Promise<string>}
   */
  fingerprintResponse(email) {
    return Promise.resolve(email);
  }
});

/**
 * @class
 */
const FakeUserUUIDRequestBatcher = AbstractUserUUIDRequestBatcher.extend({
  /**
   * @param {Object} payload
   * @returns {Promise<HttpResponseObject>}
   */
  submitHttpRequest(payload) {
    return this.webex.request({
      method: 'POST',
      service: 'conversation',
      resource: '/users',
      body: payload
    });
  }
});

/**
 * @class
 */
const RealUserUUIDRequestBatcher = AbstractUserUUIDRequestBatcher.extend({
  /**
   * @param {Object} payload
   * @returns {Promise<HttpResponseObject>}
   */
  submitHttpRequest(payload) {
    return this.webex.request({
      method: 'POST',
      service: 'conversation',
      resource: '/users',
      body: payload,
      qs: {
        shouldCreateUsers: true
      }
    });
  }
});

/**
 * @class
 */
const UserUUIDBatcher = WebexPlugin.extend({
  children: {
    faker: FakeUserUUIDRequestBatcher,
    creator: RealUserUUIDRequestBatcher
  },

  /**
   * @param {Object} payload
   * @returns {Promise<Object>}
   */
  request(payload) {
    return payload.create ? this.creator.request(payload.email) : this.faker.request(payload.email);
  }
});

export default UserUUIDBatcher;
