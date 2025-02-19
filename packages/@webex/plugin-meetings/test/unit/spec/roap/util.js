import 'jsdom-global/register';
import {assert} from '@webex/test-helper-chai';
import RoapUtil from '@webex/plugin-meetings/src/roap/util';
import PeerConnectionManager from '@webex/plugin-meetings/src/peer-connection-manager/index.js';
import sinon from 'sinon';

describe('RoapUtil', () => {
  describe('updatePeerConnection', () => {
    let meeting, session;

    beforeEach('stub PeerConnectionManager', () => {
      meeting = {
        mediaProperties: {
          peerConnection: {name: 'peer-connection'}
        },
        roap: {
          lastRoapOffer: 'lastRoapOffer'
        }
      };
      session = {OFFER: {sdps: ['sdp1', 'sdp2']}};

      PeerConnectionManager.updatePeerConnection = sinon.stub().returns(Promise.resolve());
    });

    it('should just call PeerConnection.updatePeerConnection', async () => {
      await RoapUtil.updatePeerConnection(meeting, session);
      assert.calledOnce(PeerConnectionManager.updatePeerConnection);
    });
  });
});
