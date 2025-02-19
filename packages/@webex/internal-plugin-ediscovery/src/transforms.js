import {requestWithRetries} from './retry';

/**
 * This class is used to encrypt/decrypt various properties on ReportRequests, Activities and Spaces as they are sent/returned to/from the eDiscovery Service
 */
class Transforms {
  /**
   * This function is used to encrypt sensitive properties on the ReportRequest before it is sent to the eDiscovery Service createReport API
   * @param {Object} ctx - An object containing a webex instance and a transform
   * @param {Object} object - Generic object that you want to encrypt some property on based on the type
   * @returns {Promise} - Returns a transform promise
   */
  static encryptReportRequest(ctx, object) {
    if (!object || !object.body) {
      return Promise.resolve(object);
    }
    const reportRequest = object.body;

    return ctx.webex.internal.encryption.kms.createUnboundKeys({count: 1})
      .then((keys) => {
        if (keys && keys.length > 0 && keys[0]) {
          reportRequest.encryptionKeyUrl = keys[0].uri;

          return ctx.webex.internal.encryption.kms.createResource({userIds: [keys[0].userId], keys})
            .then(() => {
              const promises = [];

              if (reportRequest.name) {
                promises.push(
                  ctx.webex.internal.encryption.encryptText(keys[0], reportRequest.name)
                    .then((encryptedName) => {
                      reportRequest.name = encryptedName;
                    })
                );
              }

              if (reportRequest.description) {
                promises.push(
                  ctx.webex.internal.encryption.encryptText(keys[0], reportRequest.description)
                    .then((encryptedDescription) => {
                      reportRequest.description = encryptedDescription;
                    })
                );
              }

              if (reportRequest.spaceNames) {
                promises.push(
                  Promise.all(reportRequest.spaceNames.map((spaceName) => ctx.webex.internal.encryption.encryptText(keys[0], spaceName)))
                    .then((encryptedSpaceNames) => {
                      reportRequest.spaceNames = encryptedSpaceNames;
                    })
                );
              }

              if (reportRequest.keywords) {
                promises.push(
                  Promise.all(reportRequest.keywords.map((keyword) => ctx.webex.internal.encryption.encryptText(keys[0], keyword)))
                    .then((encryptedKeywords) => {
                      reportRequest.keywords = encryptedKeywords;
                    })
                );
              }

              if (reportRequest.emails) {
                // store unencrypted emails for ediscovery service to convert to user ids
                reportRequest.unencryptedEmails = reportRequest.emails;
                promises.push(
                  Promise.all(reportRequest.emails.map((email) => ctx.webex.internal.encryption.encryptText(keys[0], email)))
                    .then((encryptedEmails) => {
                      reportRequest.emails = encryptedEmails;
                    })
                );
              }

              return Promise.all(promises);
            });
        }

        return Promise.resolve(object);
      })
      .catch((reason) => {
        ctx.webex.logger.error(`Error while encrypting report request: ${reportRequest} : ${reason}`);

        return Promise.reject(reason);
      });
  }

  /**
   * This function is used to decrypt encrypted properties on the ReportRequest that is returned from the eDiscovery Service getReport(s) API
   * @param {Object} ctx - An object containing a webex instance and a transform
   * @param {Object} object - Generic object that you want to decrypt some property on based on the type
   * @returns {Promise} - Returns a transform promise
   */
  static decryptReportRequest(ctx, object) {
    if (!object || !object.body || !object.body.reportRequest || !object.body.reportRequest.encryptionKeyUrl) {
      return Promise.resolve(object);
    }
    const {reportRequest} = object.body;

    let reportNamePromise;

    if (reportRequest.name) {
      reportNamePromise = ctx.webex.internal.encryption.decryptText(reportRequest.encryptionKeyUrl, reportRequest.name)
        .then((decryptedName) => {
          reportRequest.name = decryptedName;
        })
        .catch((reason) => {
          ctx.webex.logger.error(`Error decrypting report name for report ${object.body.id}: ${reason}`);
        });
    }

    let reportDescriptionPromise;

    if (reportRequest.description) {
      reportDescriptionPromise = ctx.webex.internal.encryption.decryptText(reportRequest.encryptionKeyUrl, reportRequest.description)
        .then((decryptedDescription) => {
          reportRequest.description = decryptedDescription;
        })
        .catch((reason) => {
          ctx.webex.logger.error(`Error decrypting description for report ${object.body.id}: ${reason}`);
        });
    }

    let spaceNamePromises = [];

    if (reportRequest.spaceNames) {
      spaceNamePromises = Promise.all(reportRequest.spaceNames.map((spaceName) => ctx.webex.internal.encryption.decryptText(reportRequest.encryptionKeyUrl, spaceName)))
        .then((decryptedSpaceNames) => {
          reportRequest.spaceNames = decryptedSpaceNames;
        })
        .catch((reason) => {
          ctx.webex.logger.error(`Error decrypting space name for report ${object.body.id}: ${reason}`);
        });
    }

    let keywordPromises = [];

    if (reportRequest.keywords) {
      keywordPromises = Promise.all(reportRequest.keywords.map((keyword) => ctx.webex.internal.encryption.decryptText(reportRequest.encryptionKeyUrl, keyword)))
        .then((decryptedKeywords) => {
          reportRequest.keywords = decryptedKeywords;
        })
        .catch((reason) => {
          ctx.webex.logger.error(`Error decrypting keywords for report ${object.body.id}: ${reason}`);
        });
    }

    let emailPromises = [];

    if (reportRequest.emails) {
      emailPromises = Promise.all(reportRequest.emails.map((email) => ctx.webex.internal.encryption.decryptText(reportRequest.encryptionKeyUrl, email)))
        .then((decryptedEmails) => {
          reportRequest.emails = decryptedEmails;
        })
        .catch((reason) => {
          ctx.webex.logger.error(`Error decrypting emails for report ${object.body.id}: ${reason}`);
        });
    }

    return Promise.all([reportNamePromise, reportDescriptionPromise].concat(spaceNamePromises, keywordPromises, emailPromises));
  }

  /**
   * This function is used to decrypt encrypted properties on the activities that are returned from the eDiscovery Service getContent API
   * @param {Object} ctx - An object containing a webex instance and a transform
   * @param {Object} object - Generic object that you want to decrypt some property on based on the type
   * @param {String} reportId - Id of the report for which content is being retrieved
   * @returns {Promise} - Returns a transform promise
   */
  static decryptReportContent(ctx, object, reportId) {
    if (!object || !object.body || !reportId) {
      return Promise.resolve();
    }
    const activity = object.body;

    const promises = [];

    return ctx.webex.internal.ediscovery.getContentContainerByContainerId(reportId, activity.targetId)
      .then((res) => {
        const container = res.body;

        if (!container) {
          const reason = `Container ${activity.targetId} not found - unable to decrypt activity ${activity.activityId}`;

          activity.error = reason;
          ctx.webex.logger.error(reason);

          return Promise.resolve(object);
        }

        // add warning properties to the activity - these will be recorded in the downloader
        if (container.warning) {
          activity.spaceWarning = container.warning; // Remove this property once all clients are using the content container model
          activity.containerWarning = container.warning;
        }

        // set space name and participants on activity
        if (container.containerName) {
          activity.spaceName = container.containerName; // Remove this property once all clients are using the content container model
          activity.containerName = container.containerName;
        }
        else if (container.isOneOnOne) {
          const displayNames = (container.participants || []).concat(container.formerParticipants || []).map((p) => p.displayName).join(' & ');

          // One to One spaces have no space name, use participant names as 'Subject' instead
          activity.spaceName = displayNames; // Remove this property once all clients are using the content container model
          activity.containerName = displayNames;
        }
        else {
          activity.spaceName = ''; // Remove this property once all clients are using the content container model
          activity.containerName = '';
        }

        // post and share activities have content which needs to be decrypted
        // as do meeting, recording activities, customApp extensions, and space information updates
        if (!['post', 'share'].includes(activity.verb) && !activity.meeting && !activity.recording && !(activity.extension && activity.extension.extensionType === 'customApp') &&
          !activity.spaceInfo?.name && !activity.spaceInfo?.description) {
          return Promise.resolve(object);
        }

        if (!activity.encryptionKeyUrl) {
          // If the encryptionKeyUrl is empty we assume the activity is unencrypted
          ctx.webex.logger.info(`Activity ${activity.activityId} cannot be decrypted due to a missing encryption key url`);

          return Promise.resolve(object);
        }

        if (!container.onBehalfOfUser) {
          const reason = `No user available with which to decrypt activity ${activity.activityId} in container ${activity.targetId}`;

          ctx.webex.logger.error(reason);
          activity.error = reason;

          return Promise.resolve(object);
        }

        // Decrypt activity message if present
        if (activity.objectDisplayName) {
          promises.push(requestWithRetries(ctx.webex.internal.encryption, ctx.webex.internal.encryption.decryptText,
            [activity.encryptionKeyUrl, activity.objectDisplayName, {onBehalfOf: container.onBehalfOfUser}])
            .then((decryptedMessage) => {
              activity.objectDisplayName = decryptedMessage;
            })
            .catch((reason) => {
              ctx.webex.logger.error(`Decrypt message error for activity ${activity.activityId} in container ${activity.targetId}: ${reason}`);
              // add error property to activity - this error will be recorded in the downloader and the activity omitted from the report
              activity.error = reason;

              return Promise.resolve(object);
            }));
        }

        // If the activity is a space information update, decrypt the name and description if present
        if (activity.spaceInfo?.name) {
          promises.push(requestWithRetries(ctx.webex.internal.encryption, ctx.webex.internal.encryption.decryptText,
            [activity.encryptionKeyUrl, activity.spaceInfo.name, {onBehalfOf: container.onBehalfOfUser}])
            .then((decryptedMessage) => {
              activity.spaceInfo.name = decryptedMessage;
            })
            .catch((reason) => {
              ctx.webex.logger.error(`Decrypt activity.spaceInfo.name error for activity ${activity.activityId} in container ${activity.targetId}: ${reason}`);
              activity.error = reason;

              return Promise.resolve(object);
            }));
        }
        if (activity.spaceInfo?.description) {
          promises.push(requestWithRetries(ctx.webex.internal.encryption, ctx.webex.internal.encryption.decryptText,
            [activity.encryptionKeyUrl, activity.spaceInfo.description, {onBehalfOf: container.onBehalfOfUser}])
            .then((decryptedMessage) => {
              activity.spaceInfo.description = decryptedMessage;
            })
            .catch((reason) => {
              ctx.webex.logger.error(`Decrypt activity.spaceInfo.description error for activity ${activity.activityId} in container ${activity.targetId}: ${reason}`);
              activity.error = reason;

              return Promise.resolve(object);
            }));
        }
        if (activity.spaceInfo?.previousName && activity.spaceInfo.previousEncryptionKeyUrl) {
          promises.push(requestWithRetries(ctx.webex.internal.encryption, ctx.webex.internal.encryption.decryptText,
            [activity.spaceInfo.previousEncryptionKeyUrl, activity.spaceInfo.previousName, {onBehalfOf: container.onBehalfOfUser}])
            .then((decryptedMessage) => {
              activity.spaceInfo.previousName = decryptedMessage;
            })
            .catch((reason) => {
              ctx.webex.logger.error(`Decrypt activity.spaceInfo.previousName error for activity ${activity.activityId} in container ${activity.targetId}: ${reason}`);
              activity.error = reason;

              return Promise.resolve(object);
            }));
        }

        // Decrypt content url and display name if extension is present
        if (activity.extension && activity.extension.objectType === 'extension' && activity.extension.extensionType === 'customApp') {
          promises.push(requestWithRetries(ctx.webex.internal.encryption, ctx.webex.internal.encryption.decryptText,
            [activity.encryptionKeyUrl, activity.extension.contentUrl, {onBehalfOf: container.onBehalfOfUser}])
            .then((decryptedContentUrl) => {
              activity.extension.contentUrl = decryptedContentUrl;
            })
            .catch((reason) => {
              ctx.webex.logger.error(`Decrypt activity.extension.contentUrl error for activity ${activity.activityId} in container ${activity.targetId}: ${reason}`);
              activity.error = reason;

              return Promise.resolve(object);
            }));

          promises.push(requestWithRetries(ctx.webex.internal.encryption, ctx.webex.internal.encryption.decryptText,
            [activity.encryptionKeyUrl, activity.extension.displayName, {onBehalfOf: container.onBehalfOfUser}])
            .then((decryptedDisplayName) => {
              activity.extension.displayName = decryptedDisplayName;
            })
            .catch((reason) => {
              ctx.webex.logger.error(`Decrypt activity.extension.displayName error for activity ${activity.activityId} in container ${activity.targetId}: ${reason}`);
              activity.error = reason;

              return Promise.resolve(object);
            }));

          //  Decrypt webUrl.
          if (activity.extension.webUrl) {
            promises.push(requestWithRetries(ctx.webex.internal.encryption, ctx.webex.internal.encryption.decryptText,
              [activity.encryptionKeyUrl, activity.extension.webUrl, {onBehalfOf: container.onBehalfOfUser}])
              .then((decryptedWebUrl) => {
                activity.extension.webUrl = decryptedWebUrl;
              })
              .catch((reason) => {
                ctx.webex.logger.error(`Decrypt activity.extension.webUrl error for activity ${activity.activityId} in container ${activity.targetId}: ${reason}`);
                activity.error = reason;

                return Promise.resolve(object);
              }));
          }
          if (activity.verb === 'update' && activity.extension.previous) {
            if (activity.extension.previous.contentUrl) {
              promises.push(requestWithRetries(ctx.webex.internal.encryption, ctx.webex.internal.encryption.decryptText,
                [activity.encryptionKeyUrl, activity.extension.previous.contentUrl, {onBehalfOf: container.onBehalfOfUser}])
                .then((decryptedPreviousContentUrl) => {
                  activity.extension.previous.contentUrl = decryptedPreviousContentUrl;
                })
                .catch((reason) => {
                  ctx.webex.logger.error(`Decrypt activity.extension.previous.contentUrl error for activity ${activity.activityId} in container ${activity.targetId}: ${reason}`);
                  activity.error = reason;

                  return Promise.resolve(object);
                }));
            }
            if (activity.extension.previous.displayName) {
              promises.push(requestWithRetries(ctx.webex.internal.encryption, ctx.webex.internal.encryption.decryptText,
                [activity.encryptionKeyUrl, activity.extension.previous.displayName, {onBehalfOf: container.onBehalfOfUser}])
                .then((decryptedPreviousDisplayName) => {
                  activity.extension.previous.displayName = decryptedPreviousDisplayName;
                })
                .catch((reason) => {
                  ctx.webex.logger.error(`Decrypt activity.extension.previous.displayName error for activity ${activity.activityId} in container ${activity.targetId}: ${reason}`);
                  activity.error = reason;

                  return Promise.resolve(object);
                }));
            }
          }
        }

        // Decrypt meeting title if present
        if (activity?.meeting?.title) {
          promises.push(requestWithRetries(ctx.webex.internal.encryption, ctx.webex.internal.encryption.decryptText,
            [activity.encryptionKeyUrl, activity.meeting.title, {onBehalfOf: container.onBehalfOfUser}])
            .then((decryptedMessage) => {
              activity.meeting.title = decryptedMessage;
            })
            .catch((reason) => {
              ctx.webex.logger.error(`Decrypt activity.meeting.title error for activity ${activity.activityId} in container ${activity.targetId}: ${reason}`);
              activity.error = reason;

              return Promise.resolve(object);
            }));
        }

        // Decrypt meeting recording topic if present
        if (activity?.recording?.topic) {
          promises.push(requestWithRetries(ctx.webex.internal.encryption, ctx.webex.internal.encryption.decryptText,
            [activity.encryptionKeyUrl, activity.recording.topic, {onBehalfOf: container.onBehalfOfUser}])
            .then((decryptedMessage) => {
              activity.recording.topic = decryptedMessage;
            })
            .catch((reason) => {
              ctx.webex.logger.error(`Decrypt activity.recording.topic error for activity ${activity.activityId} in container ${activity.targetId}: ${reason}`);
              activity.error = reason;

              return Promise.resolve(object);
            }));
        }

        // Decrypt shares (files, whiteboards, shared links)
        // Array.prototype.concat.apply ignores undefined
        let shares = Array.prototype.concat.apply([], activity.files);

        shares = Array.prototype.concat.apply(shares, activity.whiteboards);
        shares = Array.prototype.concat.apply(shares, activity.links);
        for (let i = 0; i < shares.length; i += 1) {
          const share = shares[i];

          // Decrypt the share's display name
          // Ignore display names for whiteboards which are unencrypted
          if (share.displayName && (!activity.whiteboards || !activity.whiteboards.includes(share))) {
            promises.push(requestWithRetries(ctx.webex.internal.encryption, ctx.webex.internal.encryption.decryptText,
              [activity.encryptionKeyUrl, share.displayName, {onBehalfOf: container.onBehalfOfUser}])
              .then((decryptedDisplayName) => {
                share.displayName = decryptedDisplayName;
              })
              .catch((reason) => {
                ctx.webex.logger.warn(`Decrypt DisplayName error for activity ${activity.activityId} in container ${activity.targetId} for share type: ${share.mimeType}, size: ${share.fileSize}, and url: ${share.url} due to error: ${reason}`);
                // add warning property to activity - this will present an indication that there was data loss on the downloader
                activity.warning = reason;
              }));
          }

          // Shared Links can have additional decryption fields
          if (share.microsoftSharedLinkInfo) {
            if (share.microsoftSharedLinkInfo.driveId) {
              promises.push(requestWithRetries(ctx.webex.internal.encryption, ctx.webex.internal.encryption.decryptText,
                [activity.encryptionKeyUrl, share.microsoftSharedLinkInfo.driveId, {onBehalfOf: container.onBehalfOfUser}])
                .then((decryptedDriveId) => {
                  share.microsoftSharedLinkInfo.driveId = decryptedDriveId;
                })
                .catch((reason) => {
                  ctx.webex.logger.error(`Decrypt share.microsoftSharedLinkInfo.driveId error for activity ${activity.activityId} in container ${activity.targetId} for share type: ${share.mimeType}, size: ${share.fileSize}, and url: ${share.url} due to error: ${reason}`);
                  // add error property to activity - this error will be recorded in the downloader and the activity omitted from the report
                  activity.error = reason;

                  return Promise.resolve(object);
                }));
            }

            if (share.microsoftSharedLinkInfo.itemId) {
              promises.push(requestWithRetries(ctx.webex.internal.encryption, ctx.webex.internal.encryption.decryptText,
                [activity.encryptionKeyUrl, share.microsoftSharedLinkInfo.itemId, {onBehalfOf: container.onBehalfOfUser}])
                .then((decryptedItemId) => {
                  share.microsoftSharedLinkInfo.itemId = decryptedItemId;
                })
                .catch((reason) => {
                  ctx.webex.logger.error(`Decrypt share.microsoftSharedLinkInfo.itemId error for activity ${activity.activityId} in container ${activity.targetId} for share type: ${share.mimeType}, size: ${share.fileSize}, and url: ${share.url} due to error: ${reason}`);
                  // add error property to activity - this error will be recorded in the downloader and the activity omitted from the report
                  activity.error = reason;

                  return Promise.resolve(object);
                }));
            }
          }

          // Decrypt the scr (Secure Content Reference) or sslr (Secure Shared Link Reference)
          // Unlike a scr the sslr contains only a loc. But decryptScr(...) is flexible and
          // leaves the tag, auth, IV, etc fields on the SCR object as undefined.
          if (share.scr || share.sslr) {
            promises.push(requestWithRetries(ctx.webex.internal.encryption, ctx.webex.internal.encryption.decryptScr,
              // A share will have an encryptionKeyUrl when it's activity uses a different encryptionKeyUrl. This can happen when old activities are edited
              // and key rotation is turn on.
              [share.encryptionKeyUrl || activity.encryptionKeyUrl, share.scr || share.sslr, {onBehalfOf: container.onBehalfOfUser}])
              .then((decryptedSCR) => {
                if (share.scr) {
                  share.scr = decryptedSCR;
                }
                else {
                  share.sslr = decryptedSCR.loc;
                }
              })
              .catch((reason) => {
                ctx.webex.logger.error(`Decrypt file scr or sslr error for activity ${activity.activityId} in container ${activity.targetId} for share type: ${share.mimeType}, size: ${share.fileSize}, and url: ${share.url} due to error: ${reason}`);
                // add error property to activity - this error will be recorded in the downloader and the activity omitted from the report
                activity.error = reason;

                return Promise.resolve(object);
              }));
          }
        }

        return Promise.all(promises);
      })
      .catch((reason) => {
        ctx.webex.logger.error(`Error retrieving content container for: ${activity.activityId} in container ${activity.targetId}: ${reason}`);
        // add error property to activity - this error will be recorded in the downloader and the activity omitted from the report
        activity.error = reason;

        return Promise.resolve(object);
      });
  }

  /**
   * This function is used to decrypt encrypted properties on the containers that are returned from the eDiscovery Service getContentContainer API
   * @param {Object} ctx - An object containing a webex instance and a transform
   * @param {Object} object - Generic object that you want to decrypt some property on based on the type
   * @returns {Promise} - Returns a transform promise
   */
  static decryptReportContentContainer(ctx, object) {
    if (!object || !object.body) {
      return Promise.resolve();
    }
    const container = object.body;

    if (!container.containerName) {
      return Promise.resolve(object);
    }

    if (!container.encryptionKeyUrl) {
      // If the encryptionKeyUrl is empty we assume the container name is unencrypted
      ctx.webex.logger.info(`${container.containerType} container ${container.containerId} cannot be decrypted due to a missing encryption key url`);

      return Promise.resolve(object);
    }

    if (!container.onBehalfOfUser) {
      const reason = `No user available with which to decrypt ${container.containerType} container ${container.containerId}`;

      ctx.webex.logger.error(reason);
      container.error = reason;

      return Promise.resolve(object);
    }

    // decrypt description if present with a descriptionEncryptionKeyUrl
    if (container.description && container.descriptionEncryptionKeyUrl) {
      requestWithRetries(ctx.webex.internal.encryption, ctx.webex.internal.encryption.decryptText,
        [container.descriptionEncryptionKeyUrl, container.description, {onBehalfOf: container.onBehalfOfUser}])
        .then((decryptedContainerDescription) => {
          container.description = decryptedContainerDescription;
        })
        .catch((reason) => {
          ctx.webex.logger.error(`Decrypt container description error for ${container.containerType} container ${container.containerId}: ${reason}`);
          // add warn property to container info - this warning will be recorded in the downloader
          container.warning = reason;
          // don't return, attempt to decrypt the name first
        });
    }

    return requestWithRetries(ctx.webex.internal.encryption, ctx.webex.internal.encryption.decryptText,
      [container.encryptionKeyUrl, container.containerName, {onBehalfOf: container.onBehalfOfUser}])
      .then((decryptedContainerName) => {
        container.containerName = decryptedContainerName;
      })
      .catch((reason) => {
        ctx.webex.logger.error(`Decrypt container name error for ${container.containerType} container ${container.containerId}: ${reason}`);
        // add warn property to container info - this warning will be recorded in the downloader
        container.warning = reason;

        return Promise.resolve(object);
      });
  }
}

export default Transforms;
