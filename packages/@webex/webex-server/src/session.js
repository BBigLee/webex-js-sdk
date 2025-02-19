/*!
 *  Copyright (c) 2015-2020 Cisco Systems, Inc. See LICENSE file.
 */

import fs from 'fs';
import util from 'util';

import bodyParser from 'body-parser';
import express from 'express';
import validator from 'express-validator';
import session from 'express-session';
import {get} from 'lodash';

import WebexCore from './webex';
import MemoryStore from './memory-store';


/* eslint-disable camelcase */
/* eslint-disable no-console */
// express induces more callbacks than usual
/* eslint-disable max-nested-callbacks */

// eslint-disable-next-line
const router = express.Router();

export default router;

router.use(bodyParser.json());
router.use(validator());
router.use(session({
  resave: true,
  saveUninitialized: true,
  secret: 'keyboardcat',
  store: new MemoryStore()
}));

/**
 * Return the details for a given session
 * @type {Function}
 */
router.get('/session', (req, res) => {
  const {webex} = req.session;

  if (!webex) {
    res
      .status(404)
      .end();

    return;
  }

  res
    .status(200)
    .send({
      webex: webex.serialize()
    })
    .end();
});

/**
 * Initialize a webex instance, connect it to mercury, and set a session cookie.
 * @type {Function}
 */
router.put('/session', (req, res, next) => {
  req.checkBody('clientId').notEmpty();
  req.checkBody('clientSecret').notEmpty();
  req.checkBody('redirectUri').notEmpty();
  req.checkBody('scope').notEmpty();
  req.checkBody('user').notEmpty();
  req.checkBody('user.token').notEmpty();
  req.checkBody('user.token.access_token').notEmpty();
  req.checkBody('user.token.token_type').notEmpty();
  req.checkBody('user.token.expires_in').notEmpty();

  req.getValidationResult()
    .then((result) => {
      if (!result.isEmpty()) {
        console.info(result.array());
        res
          .status(400)
          .send(`${result.array()[0].param} is missing`);

        return;
      }
      const webex = new WebexCore({
        credentials: req.body.user.token,
        config: {
          credentials: {
            client_id: req.body.clientId,
            client_secret: req.body.clientSecret,
            redirect_uri: req.body.redirectUri,
            scope: req.body.scope
          }
        }
      });

      req.session.webex = webex;

      webex.internal.mercury.connect()
        .then(() => res
          .status(200)
          .send({webex})
          .end())
        .catch((err) => {
          console.error(err);
          next(err);
        });
    });
});

/**
 * Disconnect a webex instance and unregister its device
 */
router.delete('/session', (req, res, next) => {
  const {webex} = req.session;

  if (!webex) {
    res
      .status(404)
      .send({
        err: 'no webex instance found for session'
      })
      .end();

    return;
  }

  webex.internal.mercury.disconnect()
    .then(() => {
      req.session
        .destroy((err) => {
          if (err) {
            next(err);

            return;
          }

          res
            .status(204)
            .end();
        });
    })
    .catch((err) => {
      req.session
        .destroy((err2) => {
          if (err2) {
            next(err2);

            return;
          }
          next(err);
        });
    });
});

router.post('/session/invoke/internal/conversation/share', (req, res) => {
  console.info('invoke conversation share called');
  const {webex} = req.session;

  if (!webex) {
    console.info('invoke: No session found - did you forget to hit /session?');
    res
      .status(404)
      .send({
        message: 'No session found - did you forget to hit /session?'
      })
      .end();

    return;
  }

  const share = webex.internal.conversation.makeShare(req.body[0]);

  req.body[1].files.forEach((fileJson) => {
    const file = fs.readFileSync(fileJson.path); // eslint-disable-line no-sync

    file.name = fileJson.displayName;
    share.add(file);
  });

  console.info('invoke: invoking "conversation.share" with arguments\n', util.inspect(req.body));
  webex.internal.conversation.share(req.body[0], share)
    .then((result) => {
      res.status(200).send(result).end();
    })
    .catch((reason) => {
      console.log(reason);
      res.status(400).send({
        message: 'An error occured while processing your request',
        error: reason.toString(),
        upstreamStatusCode: reason.statusCode,
        upstreamResponse: reason.body
      }).end();
    });
});

/**
 * Invoke an sdk method.
 */
router.post(/^\/session\/invoke\/.*/, (req, res) => {
  console.info('invoke called');
  const {webex} = req.session;

  if (!webex) {
    console.info('invoke: No session found - did you forget to hit /session?');
    res
      .status(404)
      .send({
        message: 'No session found - did you forget to hit /session?'
      })
      .end();

    return;
  }

  const invokePath = req.url.substr(req.url.indexOf('invoke') + 7);
  const keypath = invokePath.split('/');

  const method = get(webex, keypath.join('.'));

  console.info(111, method, keypath);
  const methodName = keypath.pop();

  console.info(222, methodName);

  let context = get(webex, keypath.join('.'));

  if (!context) {
    context = webex;
  }

  console.info(333, context);

  const label = `webex.${keypath.join('.')}.${methodName}()`;

  console.info(`invoke: invoking "${label}" with arguments\n`, util.inspect(req.body));
  Reflect.apply(method, context, req.body)
    .then((result) => {
      console.info(`invoke: successfully invoked "${label}"`);
      res
        .status(200)
        .send(result)
        .end();
    })
    .catch((reason) => {
      console.error({req, err: reason}, `invoke: "${label}" failed with error`);
      res
        .status(502)
        .send({
          message: 'An error occured while processing your request',
          error: reason.toString(),
          upstreamStatusCode: reason.statusCode,
          upstreamResponse: reason.body
        })
        .end();
    });
});
