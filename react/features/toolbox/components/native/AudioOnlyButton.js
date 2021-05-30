// @flow

import { toggleAudioOnly } from '../../../base/audio-only';
import { AUDIO_ONLY_BUTTON_ENABLED, getFeatureFlag } from '../../../base/flags';
import { translate } from '../../../base/i18n';
import { IconAudioOnly, IconAudioOnlyOff } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';

/**
 * The type of the React {@code Component} props of {@link AudioOnlyButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * Whether the current conference is in audio only mode or not.
     */
    _audioOnly: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * An implementation of a button for toggling the audio-only mode.
 */
class AudioOnlyButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.audioOnly';
    icon = IconAudioOnly;
    label = 'toolbar.audioOnlyOn';
    toggledIcon = IconAudioOnlyOff;
    toggledLabel = 'toolbar.audioOnlyOff';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(toggleAudioOnly());
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._audioOnly;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code AudioOnlyButton} component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The properties explicitly passed to the component instance.
 * @private
 * @returns {{
 *     _audioOnly: boolean
 * }}
 */
function _mapStateToProps(state, ownProps): Object {
    const { enabled: audioOnly } = state['features/base/audio-only'];
    const enabledInFeatureFlags = getFeatureFlag(state, AUDIO_ONLY_BUTTON_ENABLED, true);
    const { visible = enabledInFeatureFlags } = ownProps;

    return {
        _audioOnly: Boolean(audioOnly),
        visible
    };
}

export default translate(connect(_mapStateToProps)(AudioOnlyButton));
