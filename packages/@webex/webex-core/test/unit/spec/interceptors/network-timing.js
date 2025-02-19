/*!
 * Copyright (c) 2015-2020 Cisco Systems, Inc. See LICENSE file.
 */

import {assert} from '@webex/test-helper-chai';
import {NetworkTimingInterceptor} from '@webex/webex-core';

describe('webex-core', () => {
  describe('Interceptors', () => {
    describe('NetworkTimingInterceptor', () => {
      let interceptor;

      beforeEach(() => {
        interceptor = NetworkTimingInterceptor.create();
      });

      describe('#onRequest()', () => {
        it('adds a $timings object to options if one is not already there', () => {
          const options = {};

          interceptor.onRequest(options);
          assert.property(options, '$timings');
        });

        it('adds a networkStart time to options.$timings', () => {
          const options = {};

          interceptor.onRequest(options);
          assert.property(options, '$timings');
          assert.property(options.$timings, 'networkStart');
        });
      });

      describe('#onResponse', () => {
        it('adds a networkEnd time to options.$timings', () => {
          const options = {
            $timings: {
              networkStart: Date.now() - 100
            }
          };

          interceptor.onResponse(options);
          assert.property(options, '$timings');
          assert.property(options.$timings, 'networkEnd');
        });
      });
    });
  });
});
