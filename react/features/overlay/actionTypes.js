// @flow

/**
 * The type of the Redux action which signals that the prompt for media
 * permission is visible or not.
 *
 * {
 *     type: MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED,
 *     isVisible: {boolean},
 *     browser: {string}
 * }
 * @public
 */
export const MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED
    = 'MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED';

/**
 * The type of the Redux action which signals that the overlay for slow gUM is visible or not.
 *
 * {
 *     type: TOGGLE_SLOW_GUM_OVERLAY,
 *     isVisible: {boolean},
 * }
 * @public
 */
export const TOGGLE_SLOW_GUM_OVERLAY = 'TOGGLE_SLOW_GUM_OVERLAY';

/**
 * Adjust the state of the fatal error which shows/hides the reload screen. See
 * action methods's description for more info about each of the fields.
 *
 * {
 *     type: SET_FATAL_ERROR,
 *     fatalError: ?Object
 * }
 * @public
 */
export const SET_FATAL_ERROR = 'SET_FATAL_ERROR';
