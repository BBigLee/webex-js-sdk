/*!
 * Copyright (c) 2015-2020 Cisco Systems, Inc. See LICENSE file.
 */

import {pick} from 'lodash';
import {inBrowser, oneFlight} from '@webex/common';
import {safeSetTimeout} from '@webex/common-timers';

import WebexHttpError from '../webex-http-error';
import WebexPlugin from '../webex-plugin';

import {sortScope} from './scope';
import grantErrors, {OAuthError} from './grant-errors';

/* eslint-disable camelcase */

/**
 * Parse response from CI and converts to structured error when appropriate
 * @param {WebexHttpError} res
 * @private
 * @returns {GrantError}
 */
function processGrantError(res) {
  if (res.statusCode !== 400) {
    return Promise.reject(res);
  }

  const ErrorConstructor = grantErrors.select(res.body.error);

  if (ErrorConstructor === OAuthError && res instanceof WebexHttpError) {
    return Promise.reject(res);
  }
  if (!ErrorConstructor) {
    return Promise.reject(res);
  }

  return Promise.reject(new ErrorConstructor(res._res || res));
}

/**
 * @class
 */
const Token = WebexPlugin.extend({
  derived: {
    /**
     * Indicates if this token can be used in an auth header. `true` iff
     * {@link Token#access_token} is defined and {@link Token#isExpired} is
     * false.
     * @instance
     * @memberof Token
     * @readonly
     * @type {boolean}
     */
    canAuthorize: {
      deps: ['access_token', 'isExpired'],
      fn() {
        return !!this.access_token && !this.isExpired;
      }
    },

    /**
     * Indicates that this token can be downscoped. `true` iff
     * {@link config.credentials.client_id} is defined and if
     * {@link Token#canAuthorize} is true
     *
     * Note: since {@link config} is not evented, we can't listen for changes to
     * {@link config.credentials.client_id}. As such,
     * {@link config.credentials.client_id} must always be set before
     * instantiating a {@link Token}
     * @instance
     * @memberof Token
     * @readonly
     * @type {boolean}
     */
    canDownscope: {
      deps: ['canAuthorize'],
      fn() {
        return this.canAuthorize && !!this.config.client_id;
      }
    },

    /**
     * Indicates if this token can be refreshed. `true` iff
     * {@link Token@refresh_token} is defined and
     * {@link config.credentials.refreshCallback()} is defined
     *
     * Note: since {@link config} is not evented, we can't listen for changes to
     * {@link config.credentials.refreshCallback()}. As such,
     * {@link config.credentials.refreshCallback()} must always be set before
     * instantiating a {@link Token}
     * @instance
     * @memberof Token
     * @readonly
     * @type {boolean}
     */
    canRefresh: {
      deps: ['refresh_token'],
      fn() {
        if (inBrowser) {
          return !!this.refresh_token && !!this.config.refreshCallback;
        }

        return !!this.refresh_token && !!this.config.client_secret;
      }
    },

    /**
     * Indicates if this `Token` is expired. `true` iff {@link Token#expires} is
     * defined and is less than {@link Date.now()}.
     * @instance
     * @memberof Token
     * @readonly
     * @type {boolean}
     */
    isExpired: {
      deps: ['expires', '_isExpired'],
      fn() {
        // in order to avoid setting `cache:false`, we'll use a private property
        // and a timer rather than comparing to `Date.now()`;
        return !!this.expires && this._isExpired;
      }
    },

    /**
     * Cache for toString()
     * @instance
     * @memberof Token
     * @private
     * @readonly
     * @type {string}
     */
    _string: {
      deps: ['access_token', 'token_type'],
      fn() {
        if (!this.access_token || !this.token_type) {
          return '';
        }

        return `${this.token_type} ${this.access_token}`;
      }
    }
  },

  namespace: 'Credentials',

  props: {
    /**
     * Used for indexing in the credentials userTokens collection
     * @instance
     * @memberof Token
     * @private
     * @type {string}
     */
    scope: 'string',
    /**
     * @instance
     * @memberof Token
     * @type {string}
     */
    access_token: 'string',
    /**
     * @instance
     * @memberof Token
     * @type {number}
     */
    expires: 'number',
    /**
     * @instance
     * @memberof Token
     * @type {number}
     */
    expires_in: 'number',
    /**
     * @instance
     * @memberof Token
     * @type {string}
     */
    refresh_token: 'string',
    /**
     * @instance
     * @memberof Token
     * @type {number}
     */
    refresh_token_expires: 'number',
    /**
     * @instance
     * @memberof Token
     * @type {number}
     */
    refresh_token_expires_in: 'number',
    /**
     * @default "Bearer"
     * @instance
     * @memberof Token
     * @type {string}
     */
    token_type: {
      default: 'Bearer',
      type: 'string'
    }
  },

  session: {
    /**
     * Used by {@link Token#isExpired} to avoid doing a Date comparison.
     * @instance
     * @memberof Token
     * @private
     * @type {boolean}
     */
    _isExpired: {
      default: false,
      type: 'boolean'
    },
    /**
     * Handle to the previous token that we'll revoke when we refresh this
     * token. The idea is to keep allow two valid tokens when a refresh occurs;
     * we don't want revoke a token that's in the middle of being used, so when
     * we do a token refresh, we won't revoke the token being refreshed, but
     * we'll revoke the previous one.
     * @instance
     * @memberof Token
     * @private
     * @type {Object}
     */
    previousToken: {
      type: 'state'
    }
  },

  @oneFlight({
    keyFactory(scope) {
      return scope;
    }
  })
  /**
   * Uses this token to request a new Token with a subset of this Token's scopes
   * @instance
   * @memberof Token
   * @param {string} scope
   * @returns {Promise<Token>}
   */
  downscope(scope) {
    this.logger.info(`token: downscoping token to ${scope}`);

    if (this.isExpired) {
      this.logger.info('token: request received to downscope expired access_token');

      return Promise.reject(new Error('cannot downscope expired access token'));
    }

    if (!this.canDownscope) {
      if (this.config.client_id) {
        this.logger.info('token: request received to downscope invalid access_token');
      }
      else {
        this.logger.trace('token: cannot downscope without client_id');
      }

      return Promise.reject(new Error('cannot downscope access token'));
    }

    // Since we're going to use scope as the index in our token collection, it's
    // important scopes are always deterministically specified.
    if (scope) {
      scope = sortScope(scope);
    }

    // Ideally, we could depend on the service to communicate this error, but
    // all we get is "invalid scope", which, to the lay person, implies
    // something wrong with *one* of the scopes, not the whole thing.
    if (scope === sortScope(this.config.scope)) {
      return Promise.reject(new Error('token: scope reduction requires a reduced scope'));
    }

    return this.webex.request({
      method: 'POST',
      uri: this.config.tokenUrl,
      addAuthHeader: false,
      form: {
        grant_type: 'urn:cisco:oauth:grant-type:scope-reduction',
        token: this.access_token,
        scope,
        client_id: this.config.client_id,
        self_contained_token: true
      }
    })
      .then((res) => {
        this.logger.info(`token: downscoped token to ${scope}`);

        return new Token(Object.assign(res.body, {scope}), {parent: this.parent});
      });
  },

  /**
   * Initializer
   * @instance
   * @memberof Token
   * @param {Object} [attrs={}]
   * @param {Object} [options={}]
   * @see {@link WebexPlugin#initialize()}
   * @returns {Token}
   */
  initialize(attrs = {}, options = {}) {
    Reflect.apply(WebexPlugin.prototype.initialize, this, [attrs, options]);

    if (typeof attrs === 'string') {
      this.access_token = attrs;
    }

    if (!this.access_token) {
      throw new Error('`access_token` is required');
    }

    // We don't want the derived property `isExpired` to need {cache:false}, so
    // we'll set up a timer the runs when this token should expire.
    if (this.expires) {
      if (this.expires < Date.now()) {
        this._isExpired = true;
      }
      else {
        safeSetTimeout(() => {
          this._isExpired = true;
        }, this.expires - Date.now());
      }
    }
  },

  @oneFlight
  /**
   * Refreshes this Token. Relies on
   * {@link config.credentials.refreshCallback()}
   * @instance
   * @memberof Token
   * @returns {Promise<Token>}
   */
  refresh() {
    if (!this.canRefresh) {
      throw new Error('Not enough information available to refresh this access token');
    }

    let promise;

    if (inBrowser) {
      if (!this.config.refreshCallback) {
        throw new Error('Cannot refresh access token without refreshCallback');
      }

      promise = Promise.resolve(this.config.refreshCallback(this.webex, this));
    }

    return (promise || this.webex.request({
      method: 'POST',
      uri: this.config.tokenUrl,
      form: {
        grant_type: 'refresh_token',
        redirect_uri: this.config.redirect_uri,
        refresh_token: this.refresh_token
      },
      auth: {
        user: this.config.client_id,
        pass: this.config.client_secret,
        sendImmediately: true
      },
      shouldRefreshAccessToken: false
    })
      .then((res) => res.body))
      .then((obj) => {
        if (!obj) {
          throw new Error('token: refreshCallback() did not produce an object');
        }
        // If the authentication server did not send back a refresh token, copy
        // the current refresh token and related values to the response (note:
        // at time of implementation, CI never sends a new refresh token)
        if (!obj.refresh_token) {
          Object.assign(obj, pick(this, 'refresh_token', 'refresh_token_expires', 'refresh_token_expires_in'));
        }

        // If the new token is the same as the previous token, then we may have
        // found a bug in CI; log the details and reject the Promise
        if (this.access_token === obj.access_token) {
          this.logger.error('token: new token matches current token');
          // log the tokens if it is not production
          if (process.env.NODE_ENV !== 'production') {
            this.logger.error('token: current token:', this.access_token);
            this.logger.error('token: new token:', obj.access_token);
          }

          return Promise.reject(new Error('new token matches current token'));
        }

        if (this.previousToken) {
          this.previousToken.revoke();
          this.unset('previousToken');
        }

        obj.previousToken = this;
        obj.scope = this.scope;

        return new Token(obj, {parent: this.parent});
      })
      .catch(processGrantError);
  },

  @oneFlight
  /**
   * Revokes this token and unsets its local properties
   * @instance
   * @memberof Token
   * @returns {Promise}
   */
  revoke() {
    if (this.isExpired) {
      this.logger.info('token: already expired, not making making revocation request');

      return Promise.resolve();
    }

    if (!this.canAuthorize) {
      this.logger.info('token: no longer valid, not making revocation request');

      return Promise.resolve();
    }

    // FIXME we need to use the user token revocation endpoint to revoke a token
    // without a client_secret, but it doesn't current support using a token to
    // revoke itself
    // Note: I'm not making a canRevoke property because there should be changes
    // coming to the user token revocation endpoint that allow us to do this
    // correctly.
    if (!this.config.client_secret) {
      this.logger.info('token: no client secret available, not making revocation request');

      return Promise.resolve();
    }

    this.logger.info('token: revoking access token');

    return this.webex.request({
      method: 'POST',
      uri: this.config.revokeUrl,
      form: {
        token: this.access_token,
        token_type_hint: 'access_token'
      },
      auth: {
        user: this.config.client_id,
        pass: this.config.client_secret,
        sendImmediately: true
      },
      shouldRefreshAccessToken: false
    })
      .then(() => {
        this.unset([
          'access_token',
          'expires',
          'expires_in',
          'token_type'
        ]);
        this.logger.info('token: access token revoked');
      })
      .catch(processGrantError);
  },

  set(...args) {
    // eslint-disable-next-line prefer-const
    let [attrs, options] = this._filterSetParameters(...args);

    if (!attrs.token_type && attrs.access_token && attrs.access_token.includes(' ')) {
      const [token_type, access_token] = attrs.access_token.split(' ');

      attrs = Object.assign({}, attrs, {access_token, token_type});
    }
    const now = Date.now();

    if (!attrs.expires && attrs.expires_in) {
      attrs.expires = now + attrs.expires_in * 1000;
    }

    if (!attrs.refresh_token_expires && attrs.refresh_token_expires_in) {
      attrs.refresh_token_expires = now + attrs.refresh_token_expires_in * 1000;
    }

    if (attrs.scope) {
      attrs.scope = sortScope(attrs.scope);
    }

    return Reflect.apply(WebexPlugin.prototype.set, this, [attrs, options]);
  },

  /**
   * Renders the token object as an HTTP Header Value
   * @instance
   * @memberof Token
   * @returns {string}
   * @see {@link Object#toString()}
   */
  toString() {
    if (!this._string) {
      throw new Error('cannot stringify Token');
    }

    return this._string;
  },

  /**
   * Uses a non-producation api to return information about this token. This
   * method is primarily for tests and will throw if NODE_ENV === production
   * @instance
   * @memberof Token
   * @private
   * @returns {Promise}
   */
  validate() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Token#validate() must not be used in production');
    }

    return this.webex.request({
      method: 'POST',
      service: 'conversation',
      resource: 'users/validateAuthToken',
      body: {
        token: this.access_token
      }
    })
      .catch((reason) => {
        if ('statusCode' in reason) {
          return Promise.reject(reason);
        }
        this.logger.info('REMINDER: If you\'re investigating a network error here, it\'s normal');

        // If we got an error that isn't a WebexHttpError, assume the problem is
        // that we don't have the wdm plugin loaded and service/resource isn't
        // a valid means of identifying a request.
        const convApi = process.env.CONVERSATION_SERVICE || process.env.CONVERSATION_SERVICE_URL || 'https://conv-a.wbx2.com/conversation/api/v1';

        return this.webex.request({
          method: 'POST',
          uri: `${convApi}/users/validateAuthToken`,
          body: {
            token: this.access_token
          },
          headers: {
            authorization: `Bearer ${this.access_token}`
          }
        });
      })
      .then((res) => res.body);
  }
});

export default Token;
