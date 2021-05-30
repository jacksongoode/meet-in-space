// @flow

import { TOOLBAR_BUTTONS } from './constants';

export * from './functions.any';

/**
 * Removes all analytics related options from the given configuration, in case of a libre build.
 *
 * @param {*} config - The configuration which needs to be cleaned up.
 * @returns {void}
 */
export function _cleanupConfig(config: Object) { // eslint-disable-line no-unused-vars
}

/**
 * Returns the dial out url.
 *
 * @param {Object} state - The state of the app.
 * @returns {string}
 */
export function getDialOutStatusUrl(state: Object): string {
    return state['features/base/config'].guestDialOutStatusUrl;
}

/**
 * Returns the dial out status url.
 *
 * @param {Object} state - The state of the app.
 * @returns {string}
 */
export function getDialOutUrl(state: Object): string {
    return state['features/base/config'].guestDialOutUrl;
}

/**
 * Returns the list of enabled toolbar buttons.
 *
 * @param {Object} state - The redux state.
 * @returns {Array<string>} - The list of enabled toolbar buttons.
 */
export function getToolbarButtons(state: Object): Array<string> {
    const { toolbarButtons } = state['features/base/config'];

    return Array.isArray(toolbarButtons) ? toolbarButtons : TOOLBAR_BUTTONS;
}
