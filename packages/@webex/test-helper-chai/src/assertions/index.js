/*!
 * Copyright (c) 2015-2020 Cisco Systems, Inc. See LICENSE file.
 */

/* eslint-disable no-invalid-this */

const checkError = require('check-error');
const file = require('@webex/test-helper-file');

const schemas = require('./schemas');
const primitives = require('./primitives');

/**
 * @param {Object} chai
 * @returns {undefined}
 */
module.exports = function registerAssertions(chai) {
  const {Assertion} = chai;

  // The follow assertion is adapted from chai-as-promised as that library is no
  // longer compatible with IE 11
  Assertion.addMethod('rejectedWith', function expectedRejection(errorLike, errMsgMatcher, msg) {
    const {assert} = chai;
    const {flag} = chai.util;

    if (msg) {
      flag(this, 'message', msg);
    }

    const promise = this.then ? this : this._obj;

    return promise
      .then(
        (actual) => {
          assert(
            false,
            'expected #{this} to be rejected but it was fulfilled with #{act}',
            null,
            errorLike && errorLike.toString(),
            actual
          );

          return actual;
        },
        // complexity is result of basic ternaries
        // eslint-disable-next-line complexity
        function onReject(reason) {
          if (errorLike) {
            if (errorLike instanceof Error) {
              if (!checkError.compatibleInstance(reason, errorLike)) {
                this.assert(
                  false,
                  'expected #{this} to be rejected with #{exp} but was rejected with #{act}',
                  null,
                  errorLike.toString(),
                  reason.toString()
                );
              }
            }

            if (!checkError.compatibleConstructor(reason, errorLike)) {
              this.assert(
                false,
                'expected #{this} to be rejected with #{exp} but was rejected with #{act}',
                null,
                errorLike instanceof Error ? errorLike.toString() : errorLike && checkError.getConstructorName(errorLike),
                reason instanceof Error ? reason.toString() : reason && checkError.getConstructorName(reason)
              );
            }
          }

          if (reason && errMsgMatcher) {
            let placeholder = 'including';

            if (errMsgMatcher instanceof RegExp) {
              placeholder = 'matching';
            }

            if (!checkError.compatibleMessage(reason, errMsgMatcher)) {
              this.assert(
                false,
                `expected #{this} to be be rejected with error ${placeholder} #{exp} but got #{act}`,
                null,
                errMsgMatcher,
                checkError.getMessage(reason)
              );
            }
          }

          return reason;
        }
      );
  });

  chai.assert.isRejected = function isRejected(promise, errorLike, errMsgMatcher, msg) {
    if (typeof errorLike === 'string' || errorLike instanceof RegExp) {
      errMsgMatcher = errorLike;
      errorLike = null;
    }

    return new Assertion(promise, msg, chai.assert.isRejected, true).to.be.rejectedWith(errorLike, errMsgMatcher);
  };

  /* eslint no-unused-expressions: [0] */

  Assertion.addMethod('statusCode', function expectStatusCode(statusCode) {
    this.assert(
      (this._obj.statusCode || this._obj) === statusCode,
      `expected #{this} to have an HTTP Status Code of ${statusCode}`,
      `expected #{this} to not have an HTTP Status Code of ${statusCode}`
    );
  });

  chai.assert.statusCode = function assertStatusCode(obj, statusCode, msg) {
    new Assertion(obj, msg).to.have.statusCode(statusCode);
  };

  Assertion.addProperty('blobLike', function blobLike() {
    this.assert(
      file.isBlobLike(this._obj),
      'expected #{this} to be a Buffer (nodejs) or Blob (browser)',
      'expected #{this} not to be a Buffer (nodejs) or Blob (browser)'
    );
  });

  Assertion.addProperty('bufferLike', function bufferLike() {
    this.assert(
      file.isBufferLike(this._obj),
      'expected #{this} to be a Buffer (nodejs) or ArrayBuffer (browser)',
      'expected #{this} not to be a Buffer (nodejs) or ArrayBuffer (browser)'
    );
  });

  chai.assert.isBlobLike = function isBlobLike(obj, msg) {
    new Assertion(obj, msg).to.be.blobLike;
  };

  chai.assert.isNotBlobLike = function isNotBlobLike(obj, msg) {
    new Assertion(obj, msg).not.to.be.blobLike;
  };

  chai.assert.isBufferLike = function isBufferLike(obj, msg) {
    new Assertion(obj, msg).to.be.bufferLike;
  };

  chai.assert.isNotBufferLike = function isNotBufferLike(obj, msg) {
    new Assertion(obj, msg).not.to.be.bufferLike;
  };

  primitives(chai);
  schemas(chai);
};
