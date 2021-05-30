// @flow

import React, { Component } from 'react';

// We need to reference these files directly to avoid loading things that are not available
// in this environment (e.g. JitsiMeetJS or interfaceConfig)
import StatelessAvatar from '../base/avatar/components/web/StatelessAvatar';
import { getAvatarColor, getInitials } from '../base/avatar/functions';

import Toolbar from './Toolbar';

const { api } = window.alwaysOnTop;

/**
 * The timeout in ms for hiding the toolbar.
 */
const TOOLBAR_TIMEOUT = 4000;

/**
 * The type of the React {@code Component} state of {@link AlwaysOnTop}.
 */
type State = {
    avatarURL: string,
    displayName: string,
    formattedDisplayName: string,
    isVideoDisplayed: boolean,
    userID: string,
    visible: boolean
};

/**
 * Represents the always on top page.
 *
 * @class AlwaysOnTop
 * @extends Component
 */
export default class AlwaysOnTop extends Component<*, State> {
    _hovered: boolean;

    /**
     * Initializes a new {@code AlwaysOnTop} instance.
     *
     * @param {*} props - The read-only properties with which the new instance
     * is to be initialized.
     */
    constructor(props: *) {
        super(props);

        this.state = {
            avatarURL: '',
            displayName: '',
            formattedDisplayName: '',
            isVideoDisplayed: true,
            userID: '',
            visible: true
        };

        // Bind event handlers so they are only bound once per instance.
        this._avatarChangedListener = this._avatarChangedListener.bind(this);
        this._displayNameChangedListener
            = this._displayNameChangedListener.bind(this);
        this._largeVideoChangedListener
            = this._largeVideoChangedListener.bind(this);
        this._mouseMove = this._mouseMove.bind(this);
        this._onMouseOut = this._onMouseOut.bind(this);
        this._onMouseOver = this._onMouseOver.bind(this);
    }

    _avatarChangedListener: () => void;

    /**
     * Handles avatar changed api events.
     *
     * @returns {void}
     */
    _avatarChangedListener({ avatarURL, id }) {
        if (api._getOnStageParticipant() === id
                && avatarURL !== this.state.avatarURL) {
            this.setState({ avatarURL });
        }
    }

    _displayNameChangedListener: () => void;

    /**
     * Handles display name changed api events.
     *
     * @returns {void}
     */
    _displayNameChangedListener({ displayname, formattedDisplayName, id }) {
        if (api._getOnStageParticipant() === id
                && (formattedDisplayName !== this.state.formattedDisplayName
                    || displayname !== this.state.displayName)) {
            // I think the API has a typo using lowercase n for the displayname
            this.setState({
                displayName: displayname,
                formattedDisplayName
            });
        }
    }

    /**
     * Hides the toolbar after a timeout.
     *
     * @returns {void}
     */
    _hideToolbarAfterTimeout() {
        setTimeout(
            () => {
                if (this._hovered) {
                    this._hideToolbarAfterTimeout();
                } else {
                    this.setState({ visible: false });
                }
            },
            TOOLBAR_TIMEOUT);
    }

    _largeVideoChangedListener: () => void;

    /**
     * Handles large video changed api events.
     *
     * @returns {void}
     */
    _largeVideoChangedListener() {
        const userID = api._getOnStageParticipant();
        const avatarURL = api.getAvatarURL(userID);
        const displayName = api.getDisplayName(userID);
        const formattedDisplayName = api._getFormattedDisplayName(userID);
        const isVideoDisplayed = Boolean(api._getLargeVideo());

        this.setState({
            avatarURL,
            displayName,
            formattedDisplayName,
            isVideoDisplayed,
            userID
        });
    }

    _mouseMove: () => void;

    /**
     * Handles mouse move events.
     *
     * @returns {void}
     */
    _mouseMove() {
        this.state.visible || this.setState({ visible: true });
    }

    _onMouseOut: () => void;

    /**
     * Toolbar mouse out handler.
     *
     * @returns {void}
     */
    _onMouseOut() {
        this._hovered = false;
    }

    _onMouseOver: () => void;

    /**
     * Toolbar mouse over handler.
     *
     * @returns {void}
     */
    _onMouseOver() {
        this._hovered = true;
    }

    /**
     * Renders display name and avatar for the on stage participant.
     *
     * @returns {ReactElement}
     */
    _renderVideoNotAvailableScreen() {
        const { avatarURL, displayName, formattedDisplayName, isVideoDisplayed, userID } = this.state;

        if (isVideoDisplayed) {
            return null;
        }

        return (
            <div id = 'videoNotAvailableScreen'>
                <div id = 'avatarContainer'>
                    <StatelessAvatar
                        color = { getAvatarColor(userID) }
                        id = 'avatar'
                        initials = { getInitials(displayName) }
                        url = { avatarURL } />)
                </div>
                <div
                    className = 'displayname'
                    id = 'displayname'>
                    { formattedDisplayName }
                </div>
            </div>
        );
    }

    /**
     * Sets mouse move listener and initial toolbar timeout.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        api.on('avatarChanged', this._avatarChangedListener);
        api.on('displayNameChange', this._displayNameChangedListener);
        api.on('largeVideoChanged', this._largeVideoChangedListener);

        this._largeVideoChangedListener();

        window.addEventListener('mousemove', this._mouseMove);

        this._hideToolbarAfterTimeout();
    }

    /**
     * Sets a timeout to hide the toolbar when the toolbar is shown.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidUpdate(prevProps: *, prevState: State) {
        if (!prevState.visible && this.state.visible) {
            this._hideToolbarAfterTimeout();
        }
    }

    /**
     * Removes all listeners.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        api.removeListener('avatarChanged', this._avatarChangedListener);
        api.removeListener(
            'displayNameChange',
            this._displayNameChangedListener);
        api.removeListener(
            'largeVideoChanged',
            this._largeVideoChangedListener);

        window.removeEventListener('mousemove', this._mouseMove);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div id = 'alwaysOnTop'>
                <Toolbar
                    className = { this.state.visible ? 'fadeIn' : 'fadeOut' }
                    onMouseOut = { this._onMouseOut }
                    onMouseOver = { this._onMouseOver } />
                { this._renderVideoNotAvailableScreen() }
            </div>
        );
    }
}
