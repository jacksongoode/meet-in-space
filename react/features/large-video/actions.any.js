// @flow

import type { Dispatch } from 'redux';

import {
    createSelectParticipantFailedEvent,
    sendAnalytics
} from '../analytics';
import { _handleParticipantError } from '../base/conference';
import { MEDIA_TYPE } from '../base/media';
import { getParticipants } from '../base/participants';
import { reportError } from '../base/util';
import { shouldDisplayTileView } from '../video-layout';

import {
    SELECT_LARGE_VIDEO_PARTICIPANT,
    UPDATE_KNOWN_LARGE_VIDEO_RESOLUTION
} from './actionTypes';

/**
 * Signals conference to select a participant.
 *
 * @returns {Function}
 */
export function selectParticipant() {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const state = getState();
        const { conference } = state['features/base/conference'];

        if (conference) {
            const ids = shouldDisplayTileView(state)
                ? getParticipants(state).map(participant => participant.id)
                : [ state['features/large-video'].participantId ];

            try {
                conference.selectParticipants(ids);
            } catch (err) {
                _handleParticipantError(err);

                sendAnalytics(createSelectParticipantFailedEvent(err));

                reportError(
                    err, `Failed to select participants ${ids.toString()}`);
            }
        }
    };
}

/**
 * Action to select the participant to be displayed in LargeVideo based on the
 * participant id provided. If a participant id is not provided, the LargeVideo
 * participant will be selected based on a variety of factors: If there is a
 * dominant or pinned speaker, or if there are remote tracks, etc.
 *
 * @param {string} participant - The participant id of the user that needs to be
 * displayed on the large video.
 * @returns {Function}
 */
export function selectParticipantInLargeVideo(participant: ?string) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const state = getState();
        const participantId = participant ?? _electParticipantInLargeVideo(state);
        const largeVideo = state['features/large-video'];
        const remoteScreenShares = state['features/video-layout'].remoteScreenShares;
        let latestScreenshareParticipantId;

        if (remoteScreenShares && remoteScreenShares.length) {
            latestScreenshareParticipantId = remoteScreenShares[remoteScreenShares.length - 1];
        }

        // When trying to auto pin screenshare, always select the endpoint even though it happens to be
        // the large video participant in redux (for the reasons listed above in the large video selection
        // logic above). The auto pin screenshare logic kicks in after the track is added
        // (which updates the large video participant and selects all endpoints because of the auto tile
        // view mode). If the screenshare endpoint is not among the forwarded endpoints from the bridge,
        // it needs to be selected again at this point.
        if (participantId !== largeVideo.participantId || participantId === latestScreenshareParticipantId) {
            dispatch({
                type: SELECT_LARGE_VIDEO_PARTICIPANT,
                participantId
            });

            dispatch(selectParticipant());
        }
    };
}

/**
 * Updates the currently seen resolution of the video displayed on large video.
 *
 * @param {number} resolution - The current resolution (height) of the video.
 * @returns {{
 *     type: UPDATE_KNOWN_LARGE_VIDEO_RESOLUTION,
 *     resolution: number
 * }}
 */
export function updateKnownLargeVideoResolution(resolution: number) {
    return {
        type: UPDATE_KNOWN_LARGE_VIDEO_RESOLUTION,
        resolution
    };
}

/**
 * Returns the most recent existing remote video track.
 *
 * @param {Track[]} tracks - All current tracks.
 * @private
 * @returns {(Track|undefined)}
 */
function _electLastVisibleRemoteVideo(tracks) {
    // First we try to get most recent remote video track.
    for (let i = tracks.length - 1; i >= 0; --i) {
        const track = tracks[i];

        if (!track.local && track.mediaType === MEDIA_TYPE.VIDEO) {
            return track;
        }
    }
}

/**
 * Returns the identifier of the participant who is to be on the stage and
 * should be displayed in {@code LargeVideo}.
 *
 * @param {Object} state - The Redux state from which the participant to be
 * displayed in {@code LargeVideo} is to be elected.
 * @private
 * @returns {(string|undefined)}
 */
function _electParticipantInLargeVideo(state) {
    // 1. If a participant is pinned, they will be shown in the LargeVideo
    // (regardless of whether they are local or remote).
    const participants = state['features/base/participants'];
    let participant = participants.find(p => p.pinned);

    if (participant) {
        return participant.id;
    }

    // 2. Next, pick the most recent remote screenshare that was added to the conference.
    const remoteScreenShares = state['features/video-layout'].remoteScreenShares;

    if (remoteScreenShares?.length) {
        return remoteScreenShares[remoteScreenShares.length - 1];
    }

    // 3. Next, pick the dominant speaker (other than self).
    participant = participants.find(p => p.dominantSpeaker && !p.local);
    if (participant) {
        return participant.id;
    }

    // 4. Next, pick the most recent participant with video.
    const tracks = state['features/base/tracks'];
    const videoTrack = _electLastVisibleRemoteVideo(tracks);

    if (videoTrack) {
        return videoTrack.participantId;
    }

    // 5. As a last resort, select the participant that joined last (other than poltergist or other bot type
    // participants).
    for (let i = participants.length; i > 0 && !participant; i--) {
        const p = participants[i - 1];

        !p.botType && (participant = p);
    }
    if (participant) {
        return participant.id;
    }

    return participants.find(p => p.local)?.id;
}
