// @flow

import { CONFERENCE_JOINED, CONFERENCE_LEFT, SET_PASSWORD } from '../base/conference';
import { ReducerRegistry } from '../base/redux';

import {
    KNOCKING_PARTICIPANT_ARRIVED_OR_UPDATED,
    KNOCKING_PARTICIPANT_LEFT,
    SET_KNOCKING_STATE,
    SET_LOBBY_MODE_ENABLED,
    SET_PASSWORD_JOIN_FAILED
} from './actionTypes';

const DEFAULT_STATE = {
    knocking: false,
    knockingParticipants: [],
    lobbyEnabled: false,
    passwordJoinFailed: false
};

/**
 * Reduces redux actions which affect the display of notifications.
 *
 * @param {Object} state - The current redux state.
 * @param {Object} action - The redux action to reduce.
 * @returns {Object} The next redux state which is the result of reducing the
 * specified {@code action}.
 */
ReducerRegistry.register('features/lobby', (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case CONFERENCE_JOINED:
    case CONFERENCE_LEFT:
        return {
            ...state,
            knocking: false,
            passwordJoinFailed: false
        };
    case KNOCKING_PARTICIPANT_ARRIVED_OR_UPDATED:
        return _knockingParticipantArrivedOrUpdated(action.participant, state);
    case KNOCKING_PARTICIPANT_LEFT:
        return {
            ...state,
            knockingParticipants: state.knockingParticipants.filter(p => p.id !== action.id)
        };
    case SET_KNOCKING_STATE:
        return {
            ...state,
            knocking: action.knocking,
            passwordJoinFailed: false
        };
    case SET_LOBBY_MODE_ENABLED:
        return {
            ...state,
            lobbyEnabled: action.enabled
        };
    case SET_PASSWORD:
        return {
            ...state,
            passwordJoinFailed: false
        };
    case SET_PASSWORD_JOIN_FAILED:
        return {
            ...state,
            passwordJoinFailed: action.failed
        };
    }

    return state;
});

/**
 * Stores or updates a knocking participant.
 *
 * @param {Object} participant - The arrived or updated knocking participant.
 * @param {Object} state - The current Redux state of the feature.
 * @returns {Object}
 */
function _knockingParticipantArrivedOrUpdated(participant, state) {
    let existingParticipant = state.knockingParticipants.find(p => p.id === participant.id);

    existingParticipant = {
        ...existingParticipant,
        ...participant
    };

    return {
        ...state,
        knockingParticipants: [
            ...state.knockingParticipants.filter(p => p.id !== participant.id),
            existingParticipant
        ]
    };
}
