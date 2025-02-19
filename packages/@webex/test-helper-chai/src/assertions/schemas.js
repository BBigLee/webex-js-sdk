/*!
 * Copyright (c) 2015-2020 Cisco Systems, Inc. See LICENSE file.
 */

/* eslint-disable no-invalid-this */
/* eslint-disable func-names */

const shouldToAssert = require('./should-to-assert');

/**
 * @param {Object} chai
 * @returns {undefined}
 */
module.exports = function schemas(chai) {
  const {Assertion, assert} = chai;

  /* eslint no-unused-expressions: [0] */

  Assertion.addProperty('AccessToken', function () {
    assert.properties(this._obj, [
      'access_token',
      'token_type',
      'expires',
      'expires_in',
      'refresh_token',
      'refresh_token_expires',
      'refresh_token_expires_in'
    ]);
  });

  Assertion.addProperty('Activity', function () {
    assert.properties(this._obj, [
      'url',
      'id',
      'object',
      'actor'
    ]);

    assert.equal(this._obj.objectType, 'activity');
  });

  Assertion.addProperty('FileItem', function () {
    assert.property(this._obj, 'displayName', 'The file has a display name');
    assert.property(this._obj, 'scr', 'The file has an scr');
    assert.property(this._obj.scr, 'loc', 'The file\'s scr has an loc');
  });

  Assertion.addProperty('ThumbnailItem', function () {
    assert.property(this._obj, 'scr', 'The thumbnail has an scr');
    assert.property(this._obj.scr, 'loc', 'The thumbnail\'s scr has an loc');
    assert.property(this._obj, 'height', 'The thumbnail has a width');
    assert.property(this._obj, 'width', 'The thumbnail has a width');
  });

  Assertion.addProperty('Conversation', function () {
    assert.equal(this._obj.objectType, 'conversation');
    assert.property(this._obj, 'id');
    assert.property(this._obj, 'url');
  });

  Assertion.addProperty('MachineAccount', function () {
    assert.isDefined(this._obj, 'orgId');
    assert.property(this._obj, 'orgId');
    assert.isDefined(this._obj, 'name');
    assert.property(this._obj, 'name');
    assert.isDefined(this._obj, 'password');
    assert.property(this._obj, 'password');
    assert.isDefined(this._obj, 'email');
    assert.property(this._obj, 'email');
    assert.isDefined(this._obj, 'description');
    assert.property(this._obj, 'description');
  });

  Assertion.addProperty('InternalTeam', function () {
    assert.equal(this._obj.objectType, 'team');
    assert.property(this._obj, 'id');
    assert.property(this._obj, 'url');
    assert.property(this._obj, 'generalConversationUuid');

    assert.property(this._obj, 'encryptedDisplayName');
    assert.property(this._obj, 'displayName');
    assert.notEqual(this._obj.displayName, this._obj.encryptedDisplayName);

    if (this._obj.summary) {
      assert.property(this._obj, 'encryptedSummary');
      assert.notEqual(this._obj.summary, this._obj.encryptedSummary);
    }
  });

  Assertion.addProperty('OneOnOneConversation', function () {
    assert.isConversation(this._obj);
    assert.include(this._obj.tags, 'ONE_ON_ONE');
  });

  Assertion.addProperty('GroupConversation', function () {
    assert.isConversation(this._obj);
    assert.notInclude(this._obj.tags, 'ONE_ON_ONE');
  });

  Assertion.addProperty('InternalTeamConversation', function () {
    assert.isConversation(this._obj);
    assert.property(this._obj, 'team');

    assert.ok(this._obj.tags.includes('OPEN') || this._obj.tags.includes('TEAM'), 'Conversation must have `OPEN` or `TEAM` tag');

    assert.property(this._obj, 'encryptedDisplayName');
    assert.property(this._obj, 'displayName');
    assert.notEqual(this._obj.displayName, this._obj.encryptedDisplayName);
  });

  Assertion.addProperty('NewEncryptedConversation', function () {
    assert.property(this._obj, 'kmsMessage');
    assert.isObject(this._obj.kmsMessage);
    assert.equal(this._obj.kmsMessage.status, 201);
    assert.property(this._obj, 'defaultActivityEncryptionKeyUrl');
    assert.property(this._obj, 'kmsResourceObjectUrl');
  });

  Assertion.addProperty('NewEncryptedInternalTeam', function () {
    assert.property(this._obj, 'kmsMessage');
    assert.isObject(this._obj.kmsMessage);
    assert.equal(this._obj.kmsMessage.status, 201);
    assert.property(this._obj, 'defaultActivityEncryptionKeyUrl');
    // This should be identical to NewEncryptedConversation, but it seems there
    // was an api change at some point
    // assert.property(this._obj, 'kmsResourceObjectUrl');
  });

  Assertion.addProperty('EncryptedActivity', function () {
    assert.property(this._obj, 'encryptionKeyUrl');
  });

  Assertion.addProperty('Membership', function () {
    assert.properties(this._obj, [
      'id',
      'roomId',
      'personId',
      'personEmail',
      'isModerator',
      'isMonitor',
      'created'
    ]);

    assert.isHydraID(this._obj.id);
    assert.isHydraID(this._obj.roomId);
    assert.isHydraID(this._obj.personId);
    assert.isEmail(this._obj.personEmail);
    assert.isISODate(this._obj.created);
  });

  Assertion.addProperty('Message', function () {
    assert.properties(this._obj, [
      'id',
      'personId',
      'personEmail',
      'roomId',
      'created'
    ]);

    assert.isString(this._obj.id);
    assert.isHydraID(this._obj.personId);
    assert.isEmail(this._obj.personEmail);
    assert.isISODate(this._obj.created);
    assert.isHydraID(this._obj.roomId);

    if (this._obj.files) {
      assert.isArray(this._obj.files);
      assert.isAbove(this._obj.files.length, 0);
      this._obj.files.forEach((file) => {
        assert.isMessageFile(file);
      });
    }

    if (this._obj.text) {
      assert.isString(this._obj.text);
      assert.isAbove(this._obj.text.length, 0);
    }
  });

  Assertion.addProperty('MessageFile', function () {
    assert.isString(this._obj);
  });

  Assertion.addProperty('Person', function () {
    assert.properties(this._obj, [
      'id',
      'emails',
      'created'
    ]);

    assert.isHydraID(this._obj.id);
    assert.isArray(this._obj.emails);
    this._obj.emails.forEach((email) => {
      assert.isEmail(email);
    });
    assert.isISODate(this._obj.created);

    if (this._obj.familyName) {
      assert.isString(this._obj.familyName);
    }

    if (this._obj.givenName) {
      assert.isString(this._obj.givenName);
    }
  });

  Assertion.addProperty('Room', function () {
    assert.properties(this._obj, [
      'id',
      'title',
      'created'
    ]);

    assert.isHydraID(this._obj.id);
    assert.isString(this._obj.title);
    assert.isISODate(this._obj.created);
  });

  Assertion.addProperty('Team', function () {
    assert.properties(this._obj, [
      'id',
      'name',
      'created'
    ]);

    assert.isHydraID(this._obj.id);
    assert.isString(this._obj.name);
    assert.isISODate(this._obj.created);
  });

  Assertion.addProperty('TeamMembership', function () {
    assert.properties(this._obj, [
      'id',
      'teamId',
      'personId',
      'personEmail',
      'isModerator',
      'created'
    ]);

    assert.isHydraID(this._obj.id);
    assert.isHydraID(this._obj.teamId);
    assert.isHydraID(this._obj.personId);
    assert.isEmail(this._obj.personEmail);

    assert.isISODate(this._obj.created);
  });

  Assertion.addProperty('TeamRoom', function () {
    assert.isRoom(this._obj);
    assert.property(this._obj, 'teamId');
  });

  Assertion.addProperty('Webhook', function () {
    assert.properties(this._obj, [
      'id',
      'resource',
      'event',
      'filter',
      'targetUrl',
      'name'
    ]);

    assert.isHydraID(this._obj.id);
    assert.isString(this._obj.resource);
    assert.isString(this._obj.event);
    assert.isString(this._obj.filter);
    assert.isString(this._obj.targetUrl);
    assert.isString(this._obj.name);

    // waiting on completion of COLLAB-159
    // assert.isISODate(this._obj.created);
  });

  shouldToAssert(chai, [
    'AccessToken',
    'Activity',
    'Conversation',
    'InternalTeam',
    'FileItem',
    'ThumbnailItem',
    'OneOnOneConversation',
    'GroupConversation',
    'InternalTeamConversation',
    'NewEncryptedConversation',
    'NewEncryptedInternalTeam',
    'EncryptedActivity',
    'MachineAccount',
    'Membership',
    'Message',
    'MessageFile',
    'Person',
    'Room',
    'Team',
    'TeamMembership',
    'TeamRoom',
    'Webhook'
  ]);
};
