// @flow

import { Component } from 'react';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractSuspendedOverlay}.
 */
type Props = {

    /**
     * The function to translate human-readable text.
     */
    t: Function
};

/**
 * Implements a React {@link Component} for suspended overlay. Shown when a
 * suspend is detected.
 */
export default class AbstractSuspendedOverlay extends Component<Props> {
    /**
     * Determines whether this overlay needs to be rendered (according to a
     * specific redux state). Called by {@link OverlayContainer}.
     *
     * @param {Object} state - The redux state.
     * @returns {boolean} - If this overlay needs to be rendered, {@code true};
     * {@code false}, otherwise.
     */
    static needsRender(state: Object) {
        return state['features/power-monitor'].suspendDetected;
    }
}
