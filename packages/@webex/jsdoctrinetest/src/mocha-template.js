/*!
 * Copyright (c) 2015-2020 Cisco Systems, Inc. See LICENSE file.
 */

import {stringLiteral} from '@babel/types';
import template from '@babel/template';

const makeDescribeBlock = template(`
  describe(DESCRIBED_THING, function() {
    IT_BLOCK
  });
`);

const makeItBlock = template(`
  it(DOES_A_THING, function() {
    STATEMENTS
  });
`);

/**
 * Wraps a test case in a Mocha it-block
 * @param {Object} a
 * @param {string} a.name
 * @param {Object} a.testCase
 * @returns {[type]}
 */
export default function generateSpec(a) {
  let itLine = a.name;

  if (a.type.toLowerCase().includes('function')) {
    itLine += '()';
  }

  const d = makeDescribeBlock({
    DESCRIBED_THING: stringLiteral(a.filename),
    IT_BLOCK: makeItBlock({
      DOES_A_THING: stringLiteral(itLine),
      STATEMENTS: a.testCase
    })
  });

  return d;
}
