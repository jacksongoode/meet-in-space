// @flow

import { LIVE_STREAMING_ENABLED, getFeatureFlag } from '../../../../base/flags';
import { translate } from '../../../../base/i18n';
import { connect } from '../../../../base/redux';
import AbstractLiveStreamButton, { _mapStateToProps as _abstractMapStateToProps } from '../AbstractLiveStreamButton';

/**
 * Maps (parts of) the redux state to the associated props for this component.
 *
 * @param {Object} state - The redux state.
 * @param {Object} ownProps - The properties explicitly passed to the component
 * instance.
 * @private
 * @returns {Props}
 */
export function mapStateToProps(state: Object, ownProps: Object) {
    const enabled = getFeatureFlag(state, LIVE_STREAMING_ENABLED, true);
    const abstractProps = _abstractMapStateToProps(state, ownProps);

    return {
        ...abstractProps,
        visible: enabled && abstractProps.visible
    };
}

export default translate(connect(mapStateToProps)(AbstractLiveStreamButton));
