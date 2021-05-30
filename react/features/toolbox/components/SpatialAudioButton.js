// @flow

import { type Dispatch } from 'redux';

import {
    createToolbarEvent,
    sendAnalytics
} from '../../analytics';
import { SPATIAL_AUDIO_ENABLED, getFeatureFlag } from '../../base/flags';
import { translate } from '../../base/i18n';
import { IconOrbitAlt } from '../../base/icons';
import { connect } from '../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';
import { toggleSpatialAudio } from '../../video-layout/actions';

/**
 * The type of the React {@code Component} props of {@link SpatialAudioButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * Audio engine to use.
     */
    _spatialAudioEnabled: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>
};

/**
 * An implementation of a button to toggle spatial audio.
 */
class SpatialAudioButton<P: Props> extends AbstractButton<P, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.spatialAudio';
    icon = IconOrbitAlt;
    label = 'toolbar.switchToSpatial';
    toggledLabel = 'toolbar.switchToMono';
    tooltip = 'toolbar.spatialAudioToggle';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, _spatialAudioEnabled } = this.props;

        sendAnalytics(createToolbarEvent(
            'spatial.button',
            {
                'is_enabled': _spatialAudioEnabled
            }));

        dispatch(toggleSpatialAudio()); // probably need to dispatch here
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._spatialAudioEnabled;
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The properties explicitly passed to the component instance.
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps) {
    const enabled = getFeatureFlag(state, SPATIAL_AUDIO_ENABLED, true);
    const { visible = enabled } = ownProps;

    return {
        _spatialAudioEnabled: window.spatialAudio,
        visible
    };
}

export default translate(connect(_mapStateToProps)(SpatialAudioButton));
