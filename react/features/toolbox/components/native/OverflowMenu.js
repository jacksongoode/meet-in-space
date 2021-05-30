// @flow

import React, { PureComponent } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Collapsible from 'react-native-collapsible';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { BottomSheet, hideDialog, isDialogOpen } from '../../../base/dialog';
import { IconDragHandle } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { StyleType } from '../../../base/styles';
import { SharedDocumentButton } from '../../../etherpad';
import { InviteButton } from '../../../invite';
import { AudioRouteButton } from '../../../mobile/audio-mode';
import { LiveStreamButton, RecordButton } from '../../../recording';
import SecurityDialogButton from '../../../security/components/security-dialog/SecurityDialogButton';
import { SharedVideoButton } from '../../../shared-video/components';
import { ClosedCaptionButton } from '../../../subtitles';
import { TileViewButton } from '../../../video-layout';
import { getMovableButtons } from '../../functions.native';
import HelpButton from '../HelpButton';
import MuteEveryoneButton from '../MuteEveryoneButton';
import MuteEveryonesVideoButton from '../MuteEveryonesVideoButton';

import AudioOnlyButton from './AudioOnlyButton';
import MoreOptionsButton from './MoreOptionsButton';
import RaiseHandButton from './RaiseHandButton';
import ScreenSharingButton from './ScreenSharingButton.js';
import ToggleCameraButton from './ToggleCameraButton';
import styles from './styles';

import SpatialAudioButton from '../SpatialAudioButton';


/**
 * The type of the React {@code Component} props of {@link OverflowMenu}.
 */
type Props = {

    /**
     * The color-schemed stylesheet of the dialog feature.
     */
    _bottomSheetStyles: StyleType,

    /**
     * True if the overflow menu is currently visible, false otherwise.
     */
    _isOpen: boolean,

    /**
     * Whether the recoding button should be enabled or not.
     */
    _recordingEnabled: boolean,

    /**
     * The width of the screen.
     */
    _width: number,

    /**
     * Used for hiding the dialog when the selection was completed.
     */
    dispatch: Function
};

type State = {

    /**
     * True if the bottom scheet is scrolled to the top.
     */
    scrolledToTop: boolean,

    /**
     * True if the 'more' button set needas to be rendered.
     */
    showMore: boolean
}

/**
 * The exported React {@code Component}. We need it to execute
 * {@link hideDialog}.
 *
 * XXX It does not break our coding style rule to not utilize globals for state,
 * because it is merely another name for {@code export}'s {@code default}.
 */
let OverflowMenu_; // eslint-disable-line prefer-const

/**
 * Implements a React {@code Component} with some extra actions in addition to
 * those in the toolbar.
 */
class OverflowMenu extends PureComponent<Props, State> {
    /**
     * Initializes a new {@code OverflowMenu} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            scrolledToTop: true,
            showMore: false
        };

        // Bind event handlers so they are only bound once per instance.
        this._onCancel = this._onCancel.bind(this);
        this._onSwipe = this._onSwipe.bind(this);
        this._onToggleMenu = this._onToggleMenu.bind(this);
        this._renderMenuExpandToggle = this._renderMenuExpandToggle.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _bottomSheetStyles, _width } = this.props;
        const { showMore } = this.state;
        const toolbarButtons = getMovableButtons(_width);

        const buttonProps = {
            afterClick: this._onCancel,
            showLabel: true,
            styles: _bottomSheetStyles.buttons
        };

        const moreOptionsButtonProps = {
            ...buttonProps,
            afterClick: this._onToggleMenu,
            visible: !showMore
        };

        return (
            <BottomSheet
                onCancel = { this._onCancel }
                onSwipe = { this._onSwipe }
                renderHeader = { this._renderMenuExpandToggle }>
                <AudioRouteButton { ...buttonProps } />
                {!toolbarButtons.has('invite') && <InviteButton { ...buttonProps } />}
                <AudioOnlyButton { ...buttonProps } />
                {!toolbarButtons.has('raisehand') && <RaiseHandButton { ...buttonProps } />}
                <SecurityDialogButton { ...buttonProps } />
                <ScreenSharingButton { ...buttonProps } />
                {!toolbarButtons.has('spatial') && <SpatialAudioButton { ...buttonProps } />}
                <MoreOptionsButton { ...moreOptionsButtonProps } />
                <Collapsible collapsed = { !showMore }>
                    {!toolbarButtons.has('togglecamera') && <ToggleCameraButton { ...buttonProps } />}
                    {!toolbarButtons.has('tileview') && <TileViewButton { ...buttonProps } />}
                    <RecordButton { ...buttonProps } />
                    <LiveStreamButton { ...buttonProps } />
                    <SharedVideoButton { ...buttonProps } />
                    <ClosedCaptionButton { ...buttonProps } />
                    <SharedDocumentButton { ...buttonProps } />
                    <MuteEveryoneButton { ...buttonProps } />
                    <MuteEveryonesVideoButton { ...buttonProps } />
                    <HelpButton { ...buttonProps } />
                </Collapsible>
            </BottomSheet>
        );
    }

    _renderMenuExpandToggle: () => React$Element<any>;

    /**
     * Function to render the menu toggle in the bottom sheet header area.
     *
     * @returns {React$Element}
     */
    _renderMenuExpandToggle() {
        return (
            <View
                style = { [
                    this.props._bottomSheetStyles.sheet,
                    styles.expandMenuContainer
                ] }>
                <TouchableOpacity onPress = { this._onToggleMenu }>
                    { /* $FlowFixMe */ }
                    <IconDragHandle
                        fill = { this.props._bottomSheetStyles.buttons.iconStyle.color } />
                </TouchableOpacity>
            </View>
        );
    }

    _onCancel: () => boolean;

    /**
     * Hides this {@code OverflowMenu}.
     *
     * @private
     * @returns {boolean}
     */
    _onCancel() {
        if (this.props._isOpen) {
            this.props.dispatch(hideDialog(OverflowMenu_));

            return true;
        }

        return false;
    }

    _onSwipe: string => void;

    /**
     * Callback to be invoked when swipe gesture is detected on the menu. Returns true
     * if the swipe gesture is handled by the menu, false otherwise.
     *
     * @param {string} direction - Direction of 'up' or 'down'.
     * @returns {boolean}
     */
    _onSwipe(direction) {
        const { showMore } = this.state;

        switch (direction) {
        case 'up':
            !showMore && this.setState({
                showMore: true
            });

            return !showMore;
        case 'down':
            showMore && this.setState({
                showMore: false
            });

            return showMore;
        }
    }

    _onToggleMenu: () => void;

    /**
     * Callback to be invoked when the expand menu button is pressed.
     *
     * @returns {void}
     */
    _onToggleMenu() {
        this.setState({
            showMore: !this.state.showMore
        });
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    return {
        _bottomSheetStyles: ColorSchemeRegistry.get(state, 'BottomSheet'),
        _isOpen: isDialogOpen(state, OverflowMenu_),
        _width: state['features/base/responsive-ui'].clientWidth
    };
}

OverflowMenu_ = connect(_mapStateToProps)(OverflowMenu);

export default OverflowMenu_;
