import extraConfigWhitelist from './extraConfigWhitelist';

/**
 * The config keys to whitelist, the keys that can be overridden.
 * Currently we can only whitelist the first part of the properties, like
 * 'p2p.enabled' we whitelist all p2p options.
 * The whitelist is used only for config.js.
 *
 * @type Array
 */
export default [
    '_desktopSharingSourceDevice',
    '_peerConnStatusOutOfLastNTimeout',
    '_peerConnStatusRtcMuteTimeout',
    'abTesting',
    'analytics.disabled',
    'audioLevelsInterval',
    'audioQuality',
    'apiLogLevels',
    'avgRtpStatsN',
    'backgroundAlpha',

    /**
     * The display name of the CallKit call representing the conference/meeting
     * associated with this config.js including while the call is ongoing in the
     * UI presented by CallKit and in the system-wide call history. The property
     * is meant for use cases in which the room name is not desirable as a
     * display name for CallKit purposes and the desired display name is not
     * provided in the form of a JWT callee. As the value is associated with a
     * conference/meeting, the value makes sense not as a deployment-wide
     * configuration, only as a runtime configuration override/overwrite
     * provided by, for example, Jitsi Meet SDK for iOS.
     *
     * @type string
     */
    'callDisplayName',
    'callFlowsEnabled',

    /**
     * The handle
     * ({@link https://developer.apple.com/documentation/callkit/cxhandle}) of
     * the CallKit call representing the conference/meeting associated with this
     * config.js. The property is meant for use cases in which the room URL is
     * not desirable as the handle for CallKit purposes. As the value is
     * associated with a conference/meeting, the value makes sense not as a
     * deployment-wide configuration, only as a runtime configuration
     * override/overwrite provided by, for example, Jitsi Meet SDK for iOS.
     *
     * @type string
     */
    'callHandle',
    'callStatsConfIDNamespace',
    'callStatsID',
    'callStatsSecret',

    /**
     * The UUID of the CallKit call representing the conference/meeting
     * associated with this config.js. The property is meant for use cases in
     * which Jitsi Meet is to work with a CallKit call created outside of Jitsi
     * Meet and to be adopted by Jitsi Meet such as, for example, an incoming
     * and/or outgoing CallKit call created by Jitsi Meet SDK for iOS
     * clients/consumers prior to giving control to Jitsi Meet. As the value is
     * associated with a conference/meeting, the value makes sense not as a
     * deployment-wide configuration, only as a runtime configuration
     * override/overwrite provided by, for example, Jitsi Meet SDK for iOS.
     *
     * @type string
     */
    'callUUID',

    'channelLastN',
    'constraints',
    'brandingRoomAlias',
    'debug',
    'debugAudioLevels',
    'defaultLanguage',
    'desktopSharingFrameRate',
    'desktopSharingSources',
    'disable1On1Mode',
    'disableAEC',
    'disableAGC',
    'disableAP',
    'disableAudioLevels',
    'disableDeepLinking',
    'disableInitialGUM',
    'disableH264',
    'disableHPF',
    'disableInviteFunctions',
    'disableJoinLeaveSounds',
    'disableLocalVideoFlip',
    'disableNS',
    'disableProfile',
    'disableRemoteControl',
    'disableRemoteMute',
    'disableResponsiveTiles',
    'disableRtx',
    'disableShortcuts',
    'disableSimulcast',
    'disableThirdPartyRequests',
    'disableTileView',
    'displayJids',
    'doNotStoreRoom',
    'doNotFlipLocalVideo',
    'dropbox',
    'e2eping',
    'enableDisplayNameInStats',
    'enableEmailInStats',
    'enableIceRestart',
    'enableInsecureRoomNameWarning',
    'enableLayerSuspension',
    'enableLipSync',
    'enableOpusRed',
    'enableRemb',
    'enableScreenshotCapture',
    'enableTalkWhileMuted',
    'enableNoAudioDetection',
    'enableNoisyMicDetection',
    'enableTcc',
    'enableAutomaticUrlCopy',
    'etherpad_base',
    'failICE',
    'feedbackPercentage',
    'fileRecordingsEnabled',
    'firefox_fake_device',
    'forceJVB121Ratio',
    'forceTurnRelay',
    'gatherStats',
    'googleApiApplicationClientID',
    'hideConferenceSubject',
    'hideParticipantsStats',
    'hideConferenceTimer',
    'hiddenDomain',
    'hideLobbyButton',
    'hosts',
    'iAmRecorder',
    'iAmSipGateway',
    'iceTransportPolicy',
    'ignoreStartMuted',
    'liveStreamingEnabled',
    'localRecording',
    'maxFullResolutionParticipants',
    'notifications',
    'openBridgeChannel',
    'openSharedDocumentOnJoin',
    'opusMaxAverageBitrate',
    'p2p',
    'pcStatsInterval',
    'preferH264',
    'prejoinPageEnabled',
    'requireDisplayName',
    'remoteVideoMenu',
    'roomPasswordNumberOfDigits',
    'resolution',
    'startAudioMuted',
    'startAudioOnly',
    'startLastN',
    'startScreenSharing',
    'startSilent',
    'startVideoMuted',
    'startWithAudioMuted',
    'startWithVideoMuted',
    'stereo',
    'subject',
    'testing',
    'toolbarButtons',
    'useHostPageLocalStorage',
    'useTurnUdp',
    'videoQuality.persist',
    'webrtcIceTcpDisable',
    'webrtcIceUdpDisable'
].concat(extraConfigWhitelist);
