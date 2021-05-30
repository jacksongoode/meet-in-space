// @flow

import type { Dispatch } from 'redux';

import {
    SCREEN_SHARE_REMOTE_PARTICIPANTS_UPDATED,
    SET_TILE_VIEW,
    TOGGLE_SPATIAL_AUDIO
} from './actionTypes';
import { shouldDisplayTileView } from './functions';
import { showNotification, NOTIFICATION_TIMEOUT } from '../notifications';

/**
 * Creates a (redux) action which signals that the list of known remote participants
 * with screen shares has changed.
 *
 * @param {string} participantIds - The remote participants which currently have active
 * screen share streams.
 * @returns {{
 *     type: SCREEN_SHARE_REMOTE_PARTICIPANTS_UPDATED,
 *     participantId: string
 * }}
 */
export function setRemoteParticipantsWithScreenShare(participantIds: Array<string>) {
    return {
        type: SCREEN_SHARE_REMOTE_PARTICIPANTS_UPDATED,
        participantIds
    };
}

/**
 * Creates a (redux) action which signals to set the UI layout to be tiled view
 * or not.
 *
 * @param {boolean} enabled - Whether or not tile view should be shown.
 * @returns {{
 *     type: SET_TILE_VIEW,
 *     enabled: ?boolean
 * }}
 */
export function setTileView(enabled: ?boolean) {
    return {
        type: SET_TILE_VIEW,
        enabled
    };
}

/**
 * Creates a (redux) action which signals either to exit tile view if currently
 * enabled or enter tile view if currently disabled.
 *
 * @returns {Function}
 */
export function toggleTileView() {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const tileViewActive = shouldDisplayTileView(getState());

        dispatch(setTileView(!tileViewActive));
    };
}

export function toggleSpatialAudio() {
    const spatialState = !window.spatialAudio;
    window.spatialAudio = spatialState;
    console.warn(`toggleSpatialAudio: ${window.spatialAudio}`)

    const notificationProps = {
        titleArguments: { state: spatialState ? 'enabled' : 'disabled' },
        titleKey: 'notify.spatialAudio'
    }
    APP.store.dispatch(showNotification(notificationProps, NOTIFICATION_TIMEOUT));

    return {
        type: TOGGLE_SPATIAL_AUDIO,
        spatialState
    };
}
