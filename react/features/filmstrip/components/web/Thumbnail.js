// @flow

import React, { Component } from 'react';

import { createScreenSharingIssueEvent, sendAnalytics } from '../../../analytics';
import { AudioLevelIndicator } from '../../../audio-level-indicator';
import { Avatar } from '../../../base/avatar';
import JitsiMeetJS from '../../../base/lib-jitsi-meet/_';
import { MEDIA_TYPE, VideoTrack } from '../../../base/media';
import AudioTrack from '../../../base/media/components/web/AudioTrack';
import {
    getLocalParticipant,
    getParticipantById,
    getParticipantCount,
    pinParticipant
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import { isTestModeEnabled } from '../../../base/testing';
import {
    getLocalAudioTrack,
    getLocalVideoTrack,
    getTrackByMediaTypeAndParticipant,
    updateLastTrackVideoMediaEvent
} from '../../../base/tracks';
import { ConnectionIndicator } from '../../../connection-indicator';
import { DisplayName } from '../../../display-name';
import { StatusIndicators, RaisedHandIndicator, DominantSpeakerIndicator } from '../../../filmstrip';
import { PresenceLabel } from '../../../presence-status';
import { getCurrentLayout, LAYOUTS } from '../../../video-layout';
import { LocalVideoMenuTriggerButton, RemoteVideoMenuTriggerButton } from '../../../video-menu';
import {
    DISPLAY_MODE_TO_CLASS_NAME,
    DISPLAY_MODE_TO_STRING,
    DISPLAY_VIDEO,
    DISPLAY_VIDEO_WITH_NAME,
    VIDEO_TEST_EVENTS
} from '../../constants';
import { isVideoPlayable, computeDisplayMode } from '../../functions';
import logger from '../../logger';

const JitsiTrackEvents = JitsiMeetJS.events.track;

declare var interfaceConfig: Object;

/**
 * The type of the React {@code Component} state of {@link Thumbnail}.
 */
export type State = {|

    /**
     * The current audio level value for the Thumbnail.
     */
    audioLevel: number,

    /**
     * Indicates that the canplay event has been received.
     */
    canPlayEventReceived: boolean,

    /**
     * The current display mode of the thumbnail.
     */
    displayMode: number,

    /**
     * Indicates whether the thumbnail is hovered or not.
     */
    isHovered: boolean,

    /**
     * The current volume setting for the Thumbnail.
     */
    volume: ?number
|};

/**
 * The type of the React {@code Component} props of {@link Thumbnail}.
 */
export type Props = {|

    /**
     * The audio track related to the participant.
     */
    _audioTrack: ?Object,

    /**
     * Disable/enable the auto hide functionality for the connection indicator.
     */
    _connectionIndicatorAutoHideEnabled: boolean,

    /**
     * Disable/enable the connection indicator.
     */
    _connectionIndicatorDisabled: boolean,

    /**
     * The current layout of the filmstrip.
     */
    _currentLayout: string,

    /**
     * The default display name for the local participant.
     */
    _defaultLocalDisplayName: string,

    /**
     * Indicates whether the local video flip feature is disabled or not.
     */
    _disableLocalVideoFlip: boolean,

    /**
     * Indicates whether the profile functionality is disabled.
     */
    _disableProfile: boolean,

    /**
     * The display mode of the thumbnail.
     */
    _displayMode: number,

    /**
     * The height of the Thumbnail.
     */
    _height: number,

    /**
     * The aspect ratio of the Thumbnail in percents.
     */
    _heightToWidthPercent: number,

    /**
     * Indicates whether the thumbnail should be hidden or not.
     */
    _isHidden: boolean,

    /**
     * Indicates whether audio only mode is enabled.
     */
    _isAudioOnly: boolean,

    /**
     * Indicates whether the participant associated with the thumbnail is displayed on the large video.
     */
    _isCurrentlyOnLargeVideo: boolean,

    /**
     * Indicates whether the participant is screen sharing.
     */
    _isScreenSharing: boolean,

    /**
     * Indicates whether the video associated with the thumbnail is playable.
     */
    _isVideoPlayable: boolean,

    /**
     * Disable/enable the dominant speaker indicator.
     */
    _isDominantSpeakerDisabled: boolean,

    /**
     * Indicates whether testing mode is enabled.
     */
    _isTestModeEnabled: boolean,

    /**
     * The size of the icon of indicators.
     */
    _indicatorIconSize: number,

    /**
     * The current local video flip setting.
     */
    _localFlipX: boolean,

    /**
     * An object with information about the participant related to the thumbnaul.
     */
    _participant: Object,

    /**
     * The number of participants in the call.
     */
    _participantCount: number,

    /**
     * Indicates whether the "start silent" mode is enabled.
     */
    _startSilent: Boolean,

     /**
     * The video track that will be displayed in the thumbnail.
     */
    _videoTrack: ?Object,

    /**
     * The width of the thumbnail.
     */
    _width: number,

    /**
     * The redux dispatch function.
     */
    dispatch: Function,

    /**
     * The ID of the participant related to the thumbnail.
     */
    participantID: ?string
|};

/**
 * Click handler for the display name container.
 *
 * @param {SyntheticEvent} event - The click event.
 * @returns {void}
 */
function onClick(event) {
    // If the event is propagated to the thumbnail container the participant will be pinned. That's why the propagation
    // needs to be stopped.
    event.stopPropagation();
}

/**
 * Implements a thumbnail.
 *
 * @extends Component
 */
class Thumbnail extends Component<Props, State> {
    /**
     * Initializes a new Thumbnail instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        const state = {
            audioLevel: 0,
            canPlayEventReceived: false,
            isHovered: false,
            volume: 1, // override
            displayMode: DISPLAY_VIDEO
        };

        this.state = {
            ...state,
            displayMode: computeDisplayMode(Thumbnail.getDisplayModeInput(props, state))
        };

        this._updateAudioLevel = this._updateAudioLevel.bind(this);
        this._onCanPlay = this._onCanPlay.bind(this);
        this._onClick = this._onClick.bind(this);
        this._onVolumeChange = this._onVolumeChange.bind(this);
        this._onInitialVolumeSet = this._onInitialVolumeSet.bind(this);
        this._onMouseEnter = this._onMouseEnter.bind(this);
        this._onMouseLeave = this._onMouseLeave.bind(this);
        this._onTestingEvent = this._onTestingEvent.bind(this);
    }

    /**
     * Starts listening for audio level updates after the initial render.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        this._listenForAudioUpdates();
        this._onDisplayModeChanged();
    }

    /**
     * Stops listening for audio level updates on the old track and starts
     * listening instead on the new track.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidUpdate(prevProps: Props, prevState: State) {
        if (prevProps._audioTrack !== this.props._audioTrack) {
            this._stopListeningForAudioUpdates(prevProps._audioTrack);
            this._listenForAudioUpdates();
            this._updateAudioLevel(0);
        }

        if (prevState.displayMode !== this.state.displayMode) {
            this._onDisplayModeChanged();
        }
    }

    /**
     * Handles display mode changes.
     *
     * @returns {void}
     */
    _onDisplayModeChanged() {
        const input = Thumbnail.getDisplayModeInput(this.props, this.state);
        const displayModeString = DISPLAY_MODE_TO_STRING[this.state.displayMode];
        const id = this.props._participant?.id;

        this._maybeSendScreenSharingIssueEvents(input);
        logger.debug(`Displaying ${displayModeString} for ${id}, data: [${JSON.stringify(input)}]`);
    }

    /**
     * Sends screen sharing issue event if an issue is detected.
     *
     * @param {Object} input - The input used to compute the thumbnail display mode.
     * @returns {void}
     */
    _maybeSendScreenSharingIssueEvents(input) {
        const {
            _currentLayout,
            _isAudioOnly,
            _isScreenSharing
        } = this.props;
        const { displayMode } = this.state;
        const tileViewActive = _currentLayout === LAYOUTS.TILE_VIEW;

        if (![ DISPLAY_VIDEO, DISPLAY_VIDEO_WITH_NAME ].includes(displayMode)
            && tileViewActive
            && _isScreenSharing
            && !_isAudioOnly) {
            sendAnalytics(createScreenSharingIssueEvent({
                source: 'thumbnail',
                ...input
            }));
        }
    }

    /**
     * Implements React's {@link Component#getDerivedStateFromProps()}.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props: Props, prevState: State) {
        if (!props._videoTrack && prevState.canPlayEventReceived) {
            const newState = {
                ...prevState,
                canPlayEventReceived: false
            };

            return {
                ...newState,
                displayMode: computeDisplayMode(Thumbnail.getDisplayModeInput(props, newState))
            };
        }

        const newDisplayMode = computeDisplayMode(Thumbnail.getDisplayModeInput(props, prevState));

        if (newDisplayMode !== prevState.displayMode) {
            return {
                ...prevState,
                displayMode: newDisplayMode
            };
        }

        return null;
    }

    /**
     * Extracts information for props and state needed to compute the display mode.
     *
     * @param {Props} props - The component's props.
     * @param {State} state - The component's state.
     * @returns {Object}
     */
    static getDisplayModeInput(props: Props, state: State) {
        const {
            _currentLayout,
            _isAudioOnly,
            _isCurrentlyOnLargeVideo,
            _isScreenSharing,
            _isVideoPlayable,
            _participant,
            _videoTrack
        } = props;
        const tileViewActive = _currentLayout === LAYOUTS.TILE_VIEW;
        const { canPlayEventReceived, isHovered } = state;

        return {
            isCurrentlyOnLargeVideo: _isCurrentlyOnLargeVideo,
            isHovered,
            isAudioOnly: _isAudioOnly,
            tileViewActive,
            isVideoPlayable: _isVideoPlayable,
            connectionStatus: _participant?.connectionStatus,
            canPlayEventReceived,
            videoStream: Boolean(_videoTrack),
            isRemoteParticipant: !_participant?.isFakeParticipant && !_participant?.local,
            isScreenSharing: _isScreenSharing,
            videoStreamMuted: _videoTrack ? _videoTrack.muted : 'no stream'
        };
    }

    /**
     * Unsubscribe from audio level updates.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        this._stopListeningForAudioUpdates(this.props._audioTrack);
    }

    /**
     * Starts listening for audio level updates from the library.
     *
     * @private
     * @returns {void}
     */
    _listenForAudioUpdates() {
        const { _audioTrack } = this.props;

        if (_audioTrack) {
            const { jitsiTrack } = _audioTrack;

            jitsiTrack && jitsiTrack.on(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED, this._updateAudioLevel);
        }
    }

    /**
     * Stops listening to further updates from the passed track.
     *
     * @param {Object} audioTrack - The track.
     * @private
     * @returns {void}
     */
    _stopListeningForAudioUpdates(audioTrack) {
        if (audioTrack) {
            const { jitsiTrack } = audioTrack;

            jitsiTrack && jitsiTrack.off(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED, this._updateAudioLevel);
        }
    }

    _updateAudioLevel: (number) => void;

    /**
     * Updates the internal state of the last know audio level. The level should
     * be between 0 and 1, as the level will be used as a percentage out of 1.
     *
     * @param {number} audioLevel - The new audio level for the track.
     * @private
     * @returns {void}
     */
    _updateAudioLevel(audioLevel) {
        this.setState({
            audioLevel
        });
    }

    /**
     * Returns an object with the styles for thumbnail.
     *
     * @returns {Object} - The styles for the thumbnail.
     */
    _getStyles(): Object {
        const { _height, _heightToWidthPercent, _currentLayout, _isHidden, _width } = this.props;
        let styles: {
            thumbnail: Object,
            avatar: Object
        } = {
            thumbnail: {},
            avatar: {}
        };

        switch (_currentLayout) {
        case LAYOUTS.TILE_VIEW:
        case LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW: {
            const avatarSize = _height / 2;

            styles = {
                thumbnail: {
                    height: `${_height}px`,
                    minHeight: `${_height}px`,
                    minWidth: `${_width}px`,
                    width: `${_width}px`
                },
                avatar: {
                    height: `${avatarSize}px`,
                    width: `${avatarSize}px`
                }
            };
            break;
        }
        case LAYOUTS.VERTICAL_FILMSTRIP_VIEW: {
            styles = {
                thumbnail: {
                    paddingTop: `${_heightToWidthPercent}%`
                },
                avatar: {
                    height: '50%',
                    width: `${_heightToWidthPercent / 2}%`
                }
            };
            break;
        }
        }

        if (_isHidden) {
            styles.thumbnail.display = 'none';
        }

        return styles;
    }

    _onClick: () => void;

    /**
     * On click handler.
     *
     * @returns {void}
     */
    _onClick() {
        const { _participant, dispatch } = this.props;
        const { id, pinned } = _participant;

        dispatch(pinParticipant(pinned ? null : id));
    }

    _onMouseEnter: () => void;

    /**
     * Mouse enter handler.
     *
     * @returns {void}
     */
    _onMouseEnter() {
        this.setState({ isHovered: true });
    }

    _onMouseLeave: () => void;

    /**
     * Mouse leave handler.
     *
     * @returns {void}
     */
    _onMouseLeave() {
        this.setState({ isHovered: false });
    }

    /**
     * Renders a fake participant (youtube video) thumbnail.
     *
     * @param {string} id - The id of the participant.
     * @returns {ReactElement}
     */
    _renderFakeParticipant() {
        const { _participant } = this.props;
        const { id } = _participant;
        const styles = this._getStyles();
        const containerClassName = this._getContainerClassName();

        return (
            <span
                className = { containerClassName }
                id = 'sharedVideoContainer'
                onClick = { this._onClick }
                onMouseEnter = { this._onMouseEnter }
                onMouseLeave = { this._onMouseLeave }
                style = { styles.thumbnail }>
                <img
                    className = 'sharedVideoAvatar'
                    src = { `https://img.youtube.com/vi/${id}/0.jpg` } />
                <div className = 'displayNameContainer'>
                    <DisplayName
                        elementID = 'sharedVideoContainer_name'
                        participantID = { id } />
                </div>
            </span>
        );
    }

    /**
     * Renders the top indicators of the thumbnail.
     *
     * @returns {Component}
     */
    _renderTopIndicators() {
        const {
            _connectionIndicatorAutoHideEnabled,
            _connectionIndicatorDisabled,
            _currentLayout,
            _isDominantSpeakerDisabled,
            _indicatorIconSize: iconSize,
            _participant,
            _participantCount
        } = this.props;
        const { isHovered } = this.state;
        const showConnectionIndicator = isHovered || !_connectionIndicatorAutoHideEnabled;
        const { id, local = false, dominantSpeaker = false } = _participant;
        const showDominantSpeaker = !_isDominantSpeakerDisabled && dominantSpeaker;
        let statsPopoverPosition, tooltipPosition;

        switch (_currentLayout) {
        case LAYOUTS.TILE_VIEW:
            statsPopoverPosition = 'right-start';
            tooltipPosition = 'right';
            break;
        case LAYOUTS.VERTICAL_FILMSTRIP_VIEW:
            statsPopoverPosition = 'left-start';
            tooltipPosition = 'left';
            break;
        default:
            statsPopoverPosition = 'auto';
            tooltipPosition = 'top';
        }

        return (
            <div>
                { !_connectionIndicatorDisabled
                    && <ConnectionIndicator
                        alwaysVisible = { showConnectionIndicator }
                        enableStatsDisplay = { true }
                        iconSize = { iconSize }
                        isLocalVideo = { local }
                        participantId = { id }
                        statsPopoverPosition = { statsPopoverPosition } />
                }
                <RaisedHandIndicator
                    iconSize = { iconSize }
                    participantId = { id }
                    tooltipPosition = { tooltipPosition } />
                { showDominantSpeaker && _participantCount > 2
                    && <DominantSpeakerIndicator
                        iconSize = { iconSize }
                        tooltipPosition = { tooltipPosition } />
                }
            </div>);
    }

    /**
     * Renders the avatar.
     *
     * @param {Object} styles - The styles that will be applied to the avatar.
     * @returns {ReactElement}
     */
    _renderAvatar(styles) {
        const { _participant } = this.props;
        const { id } = _participant;

        return (
            <div
                className = 'avatar-container'
                style = { styles }>
                <Avatar
                    className = 'userAvatar'
                    participantId = { id } />
            </div>
        );
    }

    /**
     * Returns the container class name.
     *
     * @returns {string} - The class name that will be used for the container.
     */
    _getContainerClassName() {
        let className = 'videocontainer';
        const { displayMode } = this.state;
        const { _isAudioOnly, _isDominantSpeakerDisabled, _isHidden, _participant } = this.props;
        const isRemoteParticipant = !_participant?.local && !_participant?.isFakeParticipant;

        className += ` ${DISPLAY_MODE_TO_CLASS_NAME[displayMode]}`;

        if (_participant?.pinned) {
            className += ' videoContainerFocused';
        }

        if (!_isDominantSpeakerDisabled && _participant?.dominantSpeaker) {
            className += ' active-speaker';
        }

        if (_isHidden) {
            className += ' hidden';
        }

        if (isRemoteParticipant && _isAudioOnly) {
            className += ' audio-only';
        }

        return className;
    }

    /**
     * Renders the local participant's thumbnail.
     *
     * @returns {ReactElement}
     */
    _renderLocalParticipant() {
        const {
            _defaultLocalDisplayName,
            _disableLocalVideoFlip,
            _isScreenSharing,
            _localFlipX,
            _disableProfile,
            _participant,
            _videoTrack
        } = this.props;
        const { id } = _participant || {};
        const { audioLevel } = this.state;
        const styles = this._getStyles();
        const containerClassName = this._getContainerClassName();
        const videoTrackClassName
            = !_disableLocalVideoFlip && _videoTrack && !_isScreenSharing && _localFlipX ? 'flipVideoX' : '';


        return (
            <span
                className = { containerClassName }
                id = 'localVideoContainer'
                onClick = { this._onClick }
                onMouseEnter = { this._onMouseEnter }
                onMouseLeave = { this._onMouseLeave }
                style = { styles.thumbnail }>
                <div className = 'videocontainer__background' />
                <span id = 'localVideoWrapper'>
                    <VideoTrack
                        className = { videoTrackClassName }
                        id = 'localVideo_container'
                        videoTrack = { _videoTrack } />
                </span>
                <div className = 'videocontainer__toolbar'>
                    <StatusIndicators participantID = { id } />
                </div>
                <div className = 'videocontainer__toptoolbar'>
                    { this._renderTopIndicators() }
                </div>
                <div className = 'videocontainer__hoverOverlay' />
                <div
                    className = 'displayNameContainer'
                    onClick = { onClick }>
                    <DisplayName
                        allowEditing = { !_disableProfile }
                        displayNameSuffix = { _defaultLocalDisplayName }
                        elementID = 'localDisplayName'
                        participantID = { id } />
                </div>
                { this._renderAvatar(styles.avatar) }
                <span className = 'localvideomenu'>
                    <LocalVideoMenuTriggerButton />
                </span>
                <span className = 'audioindicator-container'>
                    <AudioLevelIndicator audioLevel = { audioLevel } />
                </span>
            </span>
        );
    }

    _onCanPlay: Object => void;

    /**
     * Canplay event listener.
     *
     * @param {SyntheticEvent} event - The event.
     * @returns {void}
     */
    _onCanPlay(event) {
        this.setState({ canPlayEventReceived: true });

        const {
            _isTestModeEnabled,
            _videoTrack
        } = this.props;

        if (_videoTrack && _isTestModeEnabled) {
            this._onTestingEvent(event);
        }
    }

    _onTestingEvent: Object => void;

    /**
     * Event handler for testing events.
     *
     * @param {SyntheticEvent} event - The event.
     * @returns {void}
     */
    _onTestingEvent(event) {
        const {
            _videoTrack,
            dispatch
        } = this.props;
        const jitsiVideoTrack = _videoTrack?.jitsiTrack;

        dispatch(updateLastTrackVideoMediaEvent(jitsiVideoTrack, event.type));
    }

    /**
     * Renders a remote participant's 'thumbnail.
     *
     * @returns {ReactElement}
     */
    _renderRemoteParticipant() {
        const {
            _audioTrack,
            _isTestModeEnabled,
            _participant,
            _startSilent,
            _videoTrack
        } = this.props;
        const { id } = _participant;
        const { audioLevel, canPlayEventReceived, volume } = this.state;
        const styles = this._getStyles();

        let containerClassName = this._getContainerClassName();
        let audioClassName = 'audio-track';

        // hide volume when in silent mode
        const onVolumeChange = _startSilent ? undefined : this._onVolumeChange;
        const jitsiAudioTrack = _audioTrack?.jitsiTrack;
        const audioTrackId = jitsiAudioTrack && jitsiAudioTrack.getId();
        const jitsiVideoTrack = _videoTrack?.jitsiTrack;
        const videoTrackId = jitsiVideoTrack && jitsiVideoTrack.getId();
        const videoEventListeners = {};

        if (_videoTrack && _isTestModeEnabled) {
            VIDEO_TEST_EVENTS.forEach(attribute => {
                videoEventListeners[attribute] = this._onTestingEvent;
            });
        }

        videoEventListeners.onCanPlay = this._onCanPlay;

        const videoElementStyle = canPlayEventReceived ? null : {
            display: 'none'
        };

        return (
            <span
                className = { containerClassName }
                id = { `participant_${id}` }
                onClick = { this._onClick }
                onMouseEnter = { this._onMouseEnter }
                onMouseLeave = { this._onMouseLeave }
                style = { styles.thumbnail }>
                {
                    _videoTrack && <VideoTrack
                        eventHandlers = { videoEventListeners }
                        id = { `remoteVideo_${videoTrackId || ''}` }
                        muted = { true }
                        style = { videoElementStyle }
                        videoTrack = { _videoTrack } />
                }
                {
                    _audioTrack && <div className = { audioClassName }>
                        <AudioTrack
                            audioTrack = { _audioTrack }
                            id = { `remoteAudio_${audioTrackId || ''}` }
                            muted = { _startSilent }
                            onInitialVolumeSet = { this._onInitialVolumeSet }
                            volume = { volume } />
                    </div>
                }
                <div className = 'videocontainer__background' />
                <div className = 'videocontainer__toptoolbar'>
                    { this._renderTopIndicators() }
                </div>
                <div className = 'videocontainer__toolbar'>
                    <StatusIndicators participantID = { id } />
                </div>
                <div className = 'videocontainer__hoverOverlay' />
                <div className = 'displayNameContainer'>
                    <DisplayName
                        elementID = { `participant_${id}_name` }
                        participantID = { id } />
                </div>
                { this._renderAvatar(styles.avatar) }
                <div className = 'presence-label-container'>
                    <PresenceLabel
                        className = 'presence-label'
                        participantID = { id } />
                </div>
                <span className = 'remotevideomenu'>
                    <RemoteVideoMenuTriggerButton
                        initialVolumeValue = { volume }
                        onVolumeChange = { onVolumeChange }
                        participantID = { id } />
                </span>
                <span className = 'audioindicator-container'>
                    <AudioLevelIndicator audioLevel = { audioLevel } />
                </span>
            </span>
        );
    }

    _onInitialVolumeSet: Object => void;

    /**
     * A handler for the initial volume value of the audio element.
     *
     * @param {number} volume - Properties of the audio element.
     * @returns {void}
     */
    _onInitialVolumeSet(volume) {
        if (this.state.volume !== volume) {
            this.setState({ volume });
        }
    }

    _onVolumeChange: number => void;

    /**
     * Handles volume changes.
     *
     * @param {number} value - The new value for the volume.
     * @returns {void}
     */
    _onVolumeChange(value) {
        this.setState({ volume: value });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _participant } = this.props;

        if (!_participant) {
            return null;
        }

        const { isFakeParticipant, local } = _participant;

        if (local) {
            return this._renderLocalParticipant();
        }

        if (isFakeParticipant) {
            return this._renderFakeParticipant();
        }

        return this._renderRemoteParticipant();
    }
}

/**
 * Maps (parts of) the redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps): Object {
    const { participantID } = ownProps;

    // Only the local participant won't have id for the time when the conference is not yet joined.
    const participant = participantID ? getParticipantById(state, participantID) : getLocalParticipant(state);
    const { id } = participant;
    const isLocal = participant?.local ?? true;
    const tracks = state['features/base/tracks'];
    const _videoTrack = isLocal
        ? getLocalVideoTrack(tracks) : getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.VIDEO, participantID);
    const _audioTrack = isLocal
        ? getLocalAudioTrack(tracks) : getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.AUDIO, participantID);
    const _currentLayout = getCurrentLayout(state);
    let size = {};
    const {
        startSilent,
        disableLocalVideoFlip,
        disableProfile,
        iAmRecorder,
        iAmSipGateway
    } = state['features/base/config'];
    const { NORMAL = 8 } = interfaceConfig.INDICATOR_FONT_SIZES || {};
    const { localFlipX } = state['features/base/settings'];


    switch (_currentLayout) {
    case LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW: {
        const {
            horizontalViewDimensions = {
                local: {},
                remote: {}
            }
        } = state['features/filmstrip'];
        const { local, remote } = horizontalViewDimensions;
        const { width, height } = isLocal ? local : remote;

        size = {
            _width: width,
            _height: height
        };

        break;
    }
    case LAYOUTS.VERTICAL_FILMSTRIP_VIEW:
        size = {
            _heightToWidthPercent: isLocal
                ? 100 / interfaceConfig.LOCAL_THUMBNAIL_RATIO
                : 100 / interfaceConfig.REMOTE_THUMBNAIL_RATIO
        };
        break;
    case LAYOUTS.TILE_VIEW: {
        const { width, height } = state['features/filmstrip'].tileViewDimensions.thumbnailSize;

        size = {
            _width: width,
            _height: height
        };
        break;
    }
    }

    return {
        _audioTrack,
        _connectionIndicatorAutoHideEnabled: interfaceConfig.CONNECTION_INDICATOR_AUTO_HIDE_ENABLED,
        _connectionIndicatorDisabled: interfaceConfig.CONNECTION_INDICATOR_DISABLED,
        _currentLayout,
        _defaultLocalDisplayName: interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME,
        _disableLocalVideoFlip: Boolean(disableLocalVideoFlip),
        _disableProfile: disableProfile,
        _isHidden: isLocal && iAmRecorder && !iAmSipGateway,
        _isAudioOnly: Boolean(state['features/base/audio-only'].enabled),
        _isCurrentlyOnLargeVideo: state['features/large-video']?.participantId === id,
        _isDominantSpeakerDisabled: interfaceConfig.DISABLE_DOMINANT_SPEAKER_INDICATOR,
        _isScreenSharing: _videoTrack?.videoType === 'desktop',
        _isTestModeEnabled: isTestModeEnabled(state),
        _isVideoPlayable: isVideoPlayable(state, id),
        _indicatorIconSize: NORMAL,
        _localFlipX: Boolean(localFlipX),
        _participant: participant,
        _participantCount: getParticipantCount(state),
        _startSilent: Boolean(startSilent),
        _videoTrack,
        ...size
    };
}

export default connect(_mapStateToProps)(Thumbnail);
