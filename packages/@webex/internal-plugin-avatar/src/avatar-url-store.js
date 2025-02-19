/*!
 * Copyright (c) 2015-2020 Cisco Systems, Inc. See LICENSE file.
 */

/* eslint-disable complexity */

import {patterns} from '@webex/common';
import {safeSetTimeout} from '@webex/common-timers';

/**
 * <uuid+size, {uuid, size, url}> map
 */
const urlByUuid = new WeakMap();

/**
 * @class AvatarUrlStore
 */
export default class AvatarUrlStore {
  /**
   * @constructs {AvatarUrlStore}
   */
  constructor() {
    urlByUuid.set(this, new Map());
  }

  /**
   * Get the URL associated with the given uuid and size.
   *
   * @param {object} item
   * @param {string} item.uuid A user uuid
   * @param {integer}item.size the requested size
   * @returns {Promise<object>} Resolves to the avatar item {uuid, url, size, cacheControl}
   *                           or Rejects on bad param, not in store
   *
   * @memberOf AvatarUrlStore
   */
  get(item) {
    if (!item) {
      return Promise.reject(new Error('`item` is required'));
    }
    if (!item.uuid) {
      return Promise.reject(new Error('`item.uuid` is required'));
    }
    if (!item.size) {
      return Promise.reject(new Error('`item.size` is required'));
    }
    if (!patterns.uuid.test(item.uuid)) {
      return Promise.reject(new Error('`item.uuid` does not appear to be a uuid'));
    }
    const ret = urlByUuid.get(this).get(`${item.uuid} - ${item.size}`);

    if (ret) {
      return Promise.resolve(ret);
    }

    return Promise.reject(new Error(`No URL found by specified id: ${JSON.stringify(item)}`));
  }

  /**
   * Adds the given item to the store
   * @param {Object} item
   * @param {integer} item.cacheControl
   * @param {integer} item.hasDefaultAvatar
   * @param {integer} item.size
   * @param {string} item.url
   * @param {string} item.uuid
   * @returns {Promise<object>} Resolves to the added avatar item or rejects on bad params
   */
  add(item) {
    if (!item) {
      return Promise.reject(new Error('`item` is required'));
    }
    if (!item.uuid) {
      return Promise.reject(new Error('`item.uuid` is required'));
    }
    if (!item.size) {
      return Promise.reject(new Error('`item.size` is required'));
    }
    if (!patterns.uuid.test(item.uuid)) {
      return Promise.reject(new Error('`item.uuid` does not appear to be a uuid'));
    }
    if (!item.url) {
      return Promise.reject(new Error('`item.url` is required'));
    }
    if (!item.cacheControl) {
      return Promise.reject(new Error('`item.cacheControl` is required'));
    }

    safeSetTimeout(this.remove.bind(this, item), item.cacheControl * 1000);
    urlByUuid.get(this).set(`${item.uuid} - ${item.size}`, item);

    return Promise.resolve(item);
  }

  /**
   * Remove the URL associated with the uuid and size
   * Remove urls of all sizes if size is not given
   *
   * @param {object} item
   * @param {string} item.uuid The user unique id
   * @param {integer} item.size The size of the avatar to remove
   * @returns {Promise<true>}
   */
  remove(item) {
    const sizes = item.size && [item.size] || [40, 50, 80, 110, 135, 192, 640, 1600];

    sizes.forEach((one) => urlByUuid.get(this).delete(`${item.uuid} - ${one}`));

    return Promise.resolve(true);
  }
}
