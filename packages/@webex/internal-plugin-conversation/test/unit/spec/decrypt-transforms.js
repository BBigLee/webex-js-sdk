/*!
 * Copyright (c) 2015-2020 Cisco Systems, Inc. See LICENSE file.
 */

import sinon from 'sinon';
import {assert, expect} from '@webex/test-helper-chai';
import {transforms} from '@webex/internal-plugin-conversation/src/decryption-transforms';

describe('plugin-conversation', () => {
  describe('decryption transforms', () => {
    describe('decryptObject()', () => {
      it('calls the correct method if a recording microappInstance is passed to it', () => {
        const transform = transforms.find((t) => t.name === 'decryptObject');
        const transformStub = sinon.stub();

        const ctx = {
          transform: transformStub
        };
        const key = null;
        const activity = {
          objectType: 'microappInstance'
        };

        transform.fn(ctx, key, activity);

        assert.equal(transformStub.lastCall.args[0], 'decryptMicroappinstance');
      });
    });

    describe('decryptComment()', () => {
      it('calls the correct method if an array prop is passed to it', () => {
        const transform = transforms.find((t) => t.name === 'decryptComment');
        const transformStub = sinon.stub();

        const ctx = {
          transform: transformStub
        };
        const key = null;
        const activity = {
          objectType: 'comment',
          cards: ['eyJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiZGlyIn0..QQeWYBBB8H7MCnWm.6C-feMX3zp70t4VZNNrsFQRMpWSpByJFYXPOfTUeTXi6SNXvw0s2jVfHbLSBCyiOJCQxMtzNAbnWsqL0LC3HdEWbLee2DYVMLHLpLTleUKErgoIy3xvO6vbDcv3USaF4qq64m5fn2P5vJxNy96mtfghW8cDsWs22kUsA7uHkICrUICdMC2F6isuHTy9e-HTOl6L2tI5DNZHs2niD_-eq_om30NRlBN05AU33Biu6iVmBhH-AVLJfzvl6S5V7o8e61ppniuHJzGA-PVACTK2-9lYS1-MFxKaCPNH_5Dx5MAwvWPC1WYuD5yGA24G8eraMueUW0k0vwSEKt3OC7WDTo9vYLnRJYlFx4pIGakF5j0VyVQdriznZ87XFygmGToF_HhQTo3oSYjZZW_19V7IVTNZBn4NZHXSm6U1VHuSVVoHyEoslFEdl0PV75jJapHvLKtvb7aWDGFHcAsjROzcjv96FqhdqyNw4fMZ1My7K3lUNwcVhIZvHe5KcpwF9wwWeE605iNQpEfPZGFkbRLeaKuqzx7VmAw8Yk1M9DM6tiC42dF0qdiyHpyqO6ZO2far1DmqOB5OrtraXeNubUHSqxb6T5rq-XSQsI2hhWDP_Gcs5LHkkRAHs4Jq3INWBn8RHHE1ttZUEF5oP1pYA5wLncs9065gwe1kIUO4Ibp04sbGYx5E5ZgvdOJfpP4EgF4bTvk3poA8kOdB8R_v0tnx2yQIWT8ZEs21Di_vpa72ZSDE-Cb8bpJxzJkPan1Udp94Ch17rMTUnRTw12wl0HyOr1Bdub00X5fbjqRFmlLSsGbuT3jqrXwoz5SwsBon1mSz4aoXVgxWdlCiamFKKgRk8t2jF_wYyp9GQmS2S2z0LDPcOcXlU6oLTxFATGu8SchKUBp4-uoLprvp1Y52rtIzr5GXhx8DY2Uwtm7ydijsBoj2sPCs7WoAUBPRYXi8uZx6spvrVhSlQgpy491yHcAaVSWTgx0YgKP2hjfUGJ5wTL0p95FzpWNntfdylBtzqXPkh6nmKTtZMVh-sMHYP-_nrCL0Iy8DGNdVa1MKGMc5CApvB9WYxewtc5TIPAQGWo_rAvJto_yOfdIrU-WxPZlRep5PA3Q4z736LYpDvzh5dL921yEe9WwBUcvUCBwPeW-u88PwNV9j4wc50T6q79oCVZ-hZ0BDGrmPRnFZEO7LoUHHobSolqIesTevDShyyqwQ1pb4dExXIIrSxsurZONJf4t1DSGWERLQYW7DQDmL_APjMAsaffFRKk18mqq8aeotap9Un_4IixoPs-gx0nC32V_Vd7a-DmpslKmA7ZQ7el_qaf4N9h_lm1w56XNrWeQsQl6t_p1x3gWpT4ZwEucwWYunsD396IGViT8Etvp29jsTDsvbIZjf1Ne00-tc9Lk95SksixN9t0OUiPxi9anZMiEd0YwDM50XTYWoqojPWvfrkllqfmeAAi-lAREJGGr2N5u3xKX5MTwfO37BQID1bvRlJX2tia-oNq71uZZyc2-Nbsn1zQJltssh74jO5waLAMM6w97-4Em80UMwrL_6STbakQajHusPTIe5FGmXPJX9X4lpjcbUws0SxfQiVpsyy5osn6zZ0E7KVAi16lFkC3D9AgK16JPHAWJeLCebVBxj8GVCJrS4j_R6rF1JkOBxWhmsQIVDuqqetQLqUqaJdeW0q8N2l8zseVCZAv9pVFeFxY_zO6-XWThwkEXJ2a9NcMeOrVF204sET0hh3z9jL8VWP-npjkZ-IfUcnDqyly_zydPrCtIEFr32s1D-16zg21sQ3c1N9USuxtuAy3k2RnMwEiBlAuyiS537bT1xOjYhJEW-6FtckdYTq7Ow9-4LWM-3FIeoQzDY2GEglWYe49X0WLxCRqPFSrNQn3z-b6dt7ypGZUeCgoybz6lzGhOeieOYHJXBGL8EcAm1Z2BqYKRpS-wnwO_M5O3VI8904fxubwLGsaH1rlAqfbo-asiVrkH3SMx-2aKCy-UnDPbbOfRllDXROHacN5yniN8RHXEZ_YX5nDfKHNgeCVgdUWhgMMEhh4l_vu-xn_AsIbbYt9ckBbyk7CgWFG4MVDjXDvtLlxT8QdF_pB7zk5dUdXeFJBAOAF_acavsRg6PJGJii2vT_tipFLE3cFDAxxpwohiaErVF8QeWzsAKrTiMANDrklC3VS1G3MOpV76Cdsjz15DAsXc1yLSw9hI5xzTBxlieKx6e6vMvsPCACiKN0KV8f7TJrRjVqBvwdXbj1p68a32LB_JW18WXo2aFj05D0xuPqcPs7AXydp7F7lQ-8458rCRgrXqnsuQmtkE__gWoNMVtdI-dwVIrjt3cVEUoITHXWq8cQAyxcSQVYZXrtK413JLxZXhCptFscAWom95RKJmF3yO40m2narRkXqXXpbYHJwrBF2zz_eZqTDudVtKuRALfZHdG7KN0_qRSdOCxLMi8AcHZAEIuCRdOjXLuVLB8dJ3E0dXFRk5we8nQJ_oQwgKpMKDfMj5-eWau8VzOZxZNzKf-QVqtXnBxt_2cMv1rzgwZ3c8zjbUrTbamkCOQvsxgogBe36ySbsY1R1wQUfXSeJOgkLqbteDlrMthf5QEstJGm3BYJHFBFEYW-nSzEbiea0CEMNwWzOjAUvetdg5lKBXwT_dIiVa_ZRxofe6-v7fbXiZ15TE73GYlldtyYcY9js32rKHCN47BoBKYATM-njnymmN8Vts0znsRM53WAHr-27tJYQC46YMyPCJoajIFYmlcX8og9hRhvgR_WUWt1QcTyG1DUCpUiferYYC5j5ifU9Gv35JIFpCfOFti-H4eSyPY8N_EIC3Yf-dbCPK9qSJUu0Sfo7PzCybcC3HgbucQI8k3rK_l_9758hYoZR2fZh3gMlOSmNqVhO0a7-YwSv_bxpKvHOIyiIlAVFIsrGLvdal4tJbLq8kGwyYS8X60qK_l-8G4uJ8F7LBkUO6zn-6kxTi10woXqwPGyo5MBYyMKH7HGG67jKRuADJRqSis8RHolHt7LEhlimh6fIqPxBKmorq__TF4IYTGKgnyl41NM_r_XjC6QSLMgTBszXYPDI6CnUZrAl5GI09WCEOC4bKp98I2Qa3ssS2AlBIwwP6Z7oRsUg0om2FUr9kW4HSsv0kNMTbGa7fqlgbCRn1bGttU7W8EVwmBlCJw9v5RklkHbj9qpaNA4iyTCRxfHWyjIQkOA6jUfOaNIRZLHywaUEG-1yZ4bNFdTLjEQ_gvzQgg.jM6UaCTq9P_i4tKbkxrLrg']
        };

        transform.fn(ctx, key, activity);
        expect(transformStub.lastCall.args[0]).to.equal('decryptPropCardItem');
      });
    });

    describe('decryptMicroappinstance()', () => {
      it('decrypts the model prop inside of decryptMicroappinstance()', () => {
        const transform = transforms.find((t) => t.name === 'decryptMicroappinstance');
        const transformStub = sinon.stub();

        const ctx = {
          transform: transformStub
        };
        const key = null;
        const microappInstance = {
          model: 'Longencryptedstring'
        };

        transform.fn(ctx, key, microappInstance);

        assert.equal(transformStub.lastCall.args[0], 'decryptPropModel');
      });
    });

    describe('previous', () => {
      it('calls the correct method if a previous object is passed in', () => {
        const transform = transforms.find((t) => t.name === 'decryptObject');
        const transformStub = sinon.stub();

        const ctx = {
          transform: transformStub
        };
        const key = null;
        const activity = {
          objectType: 'conversation',
          previous: {}
        };

        transform.fn(ctx, key, activity);

        assert.equal(transformStub.lastCall.args[0], 'decryptConversation');
      });

      it('decrypts the activity object with a previous conversation', () => {
        const transform = transforms.find((t) => t.name === 'decryptActivity');
        const transformStub = sinon.spy();

        const ctx = {
          transform: transformStub
        };
        const key = null;
        const activity = {
          objectType: 'activity',
          verb: 'update',
          encryptionKeyUrl: 'keyUrl1',
          object: {
            objectType: 'conversation',
            previous: {
              displayName: 'test123',
              encryptionKeyUrl: 'keyUrl1'
            }
          }
        };

        return transform.fn(ctx, key, activity)
          .then(() => {
            assert.equal(transformStub.callCount, 1);
            assert.equal(transformStub.getCall(0).args[0], 'decryptObject');
          });
      });

      it('decrypts the activity object with a previousValue in the conversation', () => {
        const transform = transforms.find((t) => t.name === 'decryptActivity');
        const transformStub = sinon.spy();

        const ctx = {
          transform: transformStub
        };
        const key = null;
        const activity = {
          objectType: 'activity',
          verb: 'update',
          encryptionKeyUrl: 'keyUrl1',
          object: {
            objectType: 'conversation',
            previousValue: {
              displayName: 'test123',
              encryptionKeyUrl: 'keyUrl1'
            }
          }
        };

        return transform.fn(ctx, key, activity)
          .then(() => {
            assert.equal(transformStub.callCount, 1);
            assert.equal(transformStub.getCall(0).args[0], 'decryptObject');
          });
      });
    });

    describe('threads', () => {
      it('decrypts childActivities if a thread object is passed in', () => {
        const transform = transforms.find((t) => t.name === 'decryptThread');
        const transformStub = sinon.stub();

        const ctx = {
          transform: transformStub
        };

        const threadObject = {
          childType: 'reply',
          actorId: '123',
          childActivities: [{
            objectType: 'activity'
          }]
        };

        transform.fn(ctx, threadObject);

        assert.equal(transformStub.lastCall.args[0], 'decryptObject');
      });
    });

    describe('reactions', () => {
      it('calls the correct method if a reaction2Summary object is passed in', () => {
        const transform = transforms.find((t) => t.name === 'decryptObject');
        const transformStub = sinon.stub();

        const ctx = {
          transform: transformStub
        };
        const key = null;
        const activity = {
          objectType: 'reaction2Summary'
        };

        transform.fn(ctx, key, activity);

        assert.equal(transformStub.lastCall.args[0], 'decryptReaction2summary');
      });

      it('decrypts the activity object and its children and its reactions', () => {
        const transform = transforms.find((t) => t.name === 'decryptActivity');
        const transformStub = sinon.spy();

        const ctx = {
          transform: transformStub
        };
        const key = null;
        const activity = {
          objectType: 'activity',
          verb: 'post',
          encryptionKeyUrl: 'keyUrl1',
          object: {
            objectType: 'comment'
          },
          children: [
            {
              verb: 'add',
              objectType: 'activity',
              encryptionKeyUrl: 'keyUrl1',
              object: {
                objectType: 'reaction2Summary',
                reactions: [
                  {displayName: 'reaction1'},
                  {displayName: 'reaction2'}
                ]
              }
            },
            {
              verb: 'add',
              objectType: 'activity',
              encryptionKeyUrl: 'keyUrl1',
              object: {
                objectType: 'reaction2Summary',
                reactions: [
                  {displayName: 'reaction1'},
                  {displayName: 'reaction2'}
                ]
              }
            }

          ]

        };

        return transform.fn(ctx, key, activity)
          .then(() => {
            assert.equal(transformStub.callCount, 3); // once for the parents object and then once for each child
            assert.equal(transformStub.getCall(0).args[0], 'decryptObject');
            assert.equal(transformStub.getCall(1).args[0], 'decryptObject');
            assert.equal(transformStub.getCall(2).args[0], 'decryptObject');
          });
      });

      it('decrypts the reaction2Summary object and the reactions', () => {
        const transform = transforms.find((t) => t.name === 'decryptReaction2summary');
        const transformStub = sinon.spy();

        const ctx = {
          transform: transformStub
        };
        const key = null;
        const activity = {
          objectType: 'reaction2Summary',
          reactions: [
            {displayName: 'reaction1'},
            {displayName: 'reaction2'}
          ]

        };

        return transform.fn(ctx, key, activity)
          .then(() => {
            assert.equal(transformStub.callCount, 2);
            assert.equal(transformStub.getCall(0).args[0], 'decryptPropDisplayName');
            assert.equal(transformStub.getCall(1).args[0], 'decryptPropDisplayName');
          });
      });

      it('calls the correct method if a reaction2SelfSummary object is passed in', () => {
        const transform = transforms.find((t) => t.name === 'decryptObject');
        const transformStub = sinon.stub();

        const ctx = {
          transform: transformStub
        };
        const key = null;
        const activity = {
          objectType: 'reaction2SelfSummary'
        };

        transform.fn(ctx, key, activity);

        assert.equal(transformStub.lastCall.args[0], 'decryptReaction2selfsummary');
      });

      it('calls the correct method if a reaction2 object is passed in', () => {
        const transform = transforms.find((t) => t.name === 'decryptObject');
        const transformStub = sinon.stub();

        const ctx = {
          transform: transformStub
        };
        const key = null;
        const activity = {
          objectType: 'reaction2'
        };

        transform.fn(ctx, key, activity);

        assert.equal(transformStub.lastCall.args[0], 'decryptReaction2');
      });
    });

    describe('link activity', () => {
      it('calls the correct method if a content object is passed in', () => {
        const transform = transforms.find((t) => t.name === 'decryptObject');
        const transformStub = sinon.stub();

        const ctx = {
          transform: transformStub
        };
        const key = null;
        const activity = {
          objectType: 'content'
        };

        transform.fn(ctx, key, activity);

        assert.equal(transformStub.lastCall.args[0], 'decryptContent');
      });

      it('calls the correct method if a link content category is passed in', () => {
        const transform = transforms.find((t) => t.name === 'decryptContent');
        const transformStub = sinon.stub();

        const ctx = {
          transform: transformStub
        };
        const key = null;
        const activity = {
          objectType: 'content',
          contentCategory: 'links'
        };

        transform.fn(ctx, key, activity);

        assert.equal(transformStub.lastCall.args[0], 'decryptContentLinks');
      });

      it('decrypts the link and the comment', () => {
        const transform = transforms.find((t) => t.name === 'decryptContentLinks');
        const transformStub = sinon.spy();

        const ctx = {
          transform: transformStub
        };
        const key = null;
        const activity = {
          objectType: 'content',
          contentCategory: 'links',
          links: {
            items: [
              {item1: 'item1'}
            ]
          }
        };

        return transform.fn(ctx, key, activity)
          .then(() => {
            assert.equal(transformStub.callCount, 2);
            assert.equal(transformStub.getCall(0).args[0], 'decryptObject');
            assert.equal(transformStub.getCall(1).args[0], 'decryptComment');
          });
      });

      it('decrypts a link object', () => {
        const transform = transforms.find((t) => t.name === 'decryptLink');
        const transformStub = sinon.spy();

        const ctx = {
          transform: transformStub
        };
        const key = null;
        const activity = {
          objectType: 'content',
          contentCategory: 'links',
          links: {
            items: [
              {item1: 'item1'}
            ]
          }
        };

        return transform.fn(ctx, key, activity)
          .then(() => {
            assert.equal(transformStub.callCount, 2);
            assert.equal(transformStub.getCall(0).args[0], 'decryptPropSslr');
            assert.equal(transformStub.getCall(1).args[0], 'decryptPropDisplayName');
          });
      });

      it('decrypts an sslr', () => {
        const transform = transforms.find((t) => t.name === 'decryptPropSslr');

        const ORIG_SSLR = 'ORIG_SSLR';
        const DECRYPTED_SSLR = 'DECRYPTED_SSLR';
        const transformStub = sinon.spy(() => Promise.resolve(DECRYPTED_SSLR));

        const ctx = {
          webex: {
            internal: {
              encryption: {
                decryptScr: transformStub
              }
            }
          }
        };
        const key = null;
        const activity = {
          objectType: 'content',
          contentCategory: 'links',
          links: {
            items: [
              {item1: 'item1'}
            ]
          },
          sslr: ORIG_SSLR
        };

        return transform.fn(ctx, key, activity)
          .then(() => {
            assert.equal(transformStub.callCount, 1);
            assert.equal(transformStub.getCall(0).args[1], ORIG_SSLR);
            assert.equal(activity.sslr, DECRYPTED_SSLR);
          });
      });

      describe('meeting containers', () => {
        it('decrypts a meeting container activity with only display name', () => {
          const transform = transforms.find((t) => t.name === 'decryptMeetingcontainer');
          const transformStub = sinon.spy();
          const ctx = {
            transform: transformStub
          };
          const key = null;
          const meetingContainer = {
            id: 'd5416be0-aeb9-11ec-bac4-ad7fbcfb8ba2',
            objectType: 'meetingContainer',
            displayName: 'eyJraWQiOiJrbXM6XC9cL2ttcy1jaXNjby53YngyLmNvbVwva2V5c1wvYjhjOTg1MTYtNmY0OS00Zjk2LThhMmEtZGIxOTc2ZTAwYTk5IiwiZW5jIjoiQTI1NkdDTSIsImFsZyI6ImRpciJ9..H-Ef6wjRGeolqSTJ.xZUwyy5VnKPGdsWDCg0T1A.3Vrx_z7Z0Z2NlnNr3vf43A'
          };

          return transform.fn(ctx, key, meetingContainer)
            .then(() => {
              assert.equal(transformStub.callCount, 1); // once for the parents object and then once for each child
              assert.equal(transformStub.getCall(0).args[0], 'decryptPropDisplayName');
            });
        });

        it('decrypts a meeting container activity with display name and extension with recording', () => {
          const transform = transforms.find((t) => t.name === 'decryptMeetingcontainer');
          const transformStub = sinon.spy();
          const ctx = {
            transform: transformStub
          };
          const key = null;
          const meetingContainer = {
            id: 'd5416be0-aeb9-11ec-bac4-ad7fbcfb8ba2',
            objectType: 'meetingContainer',
            displayName: 'eyJraWQiOiJrbXM6XC9cL2ttcy1jaXNjby53YngyLmNvbVwva2V5c1wvYjhjOTg1MTYtNmY0OS00Zjk2LThhMmEtZGIxOTc2ZTAwYTk5IiwiZW5jIjoiQTI1NkdDTSIsImFsZyI6ImRpciJ9..H-Ef6wjRGeolqSTJ.xZUwyy5VnKPGdsWDCg0T1A.3Vrx_z7Z0Z2NlnNr3vf43A',
            extensions: {
              items: [
                {
                  data: {
                    id: '6a055bbe96aa103a9afd005056818248',
                    objectType: 'recording',
                    topic: 'eyJraWQiOiJrbXM6XC9cL2ttcy1jaXNjby53YngyLmNvbVwva2V5c1wvOTAwYjUwZmMtYzg0Yi00YTM4LTk0MGQtYWJjM2IyNjJiMWUyIiwiZW5jIjoiQTI1NkdDTSIsImFsZyI6ImRpciJ9..5LXICENQ0AvplBc4.yUlXzF86eyP9sZR75l6spOtAaEwYWIzRx2N-kWZQLVB2JwudN2U.-DWv7fce_Ac2K_l5QryDCQ'
                  },
                  encryptionKeyUrl: 'kms://kms-cisco.wbx2.com/keys/900b50fc-c84b-4a38-940d-abc3b262b1e2'
                }
              ]
            }
          };

          return transform.fn(ctx, key, meetingContainer)
            .then(() => {
              assert.equal(transformStub.callCount, 2); // once for the parents object and then once for each child
              assert.equal(transformStub.getCall(0).args[0], 'decryptPropDisplayName');
              assert.equal(transformStub.getCall(1).args[0], 'decryptPropTopic');
            });
        });
      });
    });
  });
});
