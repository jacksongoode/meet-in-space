// @flow

import React, { Component } from 'react';

/**
 * The type of the React {@code Component} props of {@link AudioTrack}.
 */
type Props = {

    /**
     * The value of the id attribute of the audio element.
     */
    id: string,

    /**
     * The audio track.
     */
    audioTrack: ?Object,

    /**
     * Used to determine the value of the autoplay attribute of the underlying
     * audio element.
     */
    autoPlay: boolean,

    /**
     * Represents muted property of the underlying audio element.
     */
    muted: ?Boolean,

    /**
     * Represents volume property of the underlying audio element.
     */
    volume: ?number,

    /**
     * A function that will be executed when the reference to the underlying audio element changes in order to report
     * the initial volume value.
     */
    onInitialVolumeSet: Function
};

/**
 * The React/Web {@link Component} which is similar to and wraps around {@code HTMLAudioElement}.
 */
export default class AudioTrack extends Component<Props> {
    /**
     * Reference to the HTML audio element, stored until the file is ready.
     */
    _ref: ?HTMLAudioElement;

    /**
     * Default values for {@code AudioTrack} component's properties.
     *
     * @static
     */
    static defaultProps = {
        autoPlay: false,
        id: ''
    };

    /**
     * Creates new <code>Audio</code> element instance with given props.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._setRef = this._setRef.bind(this);
    }

    /**
     * Attaches the audio track to the audio element and plays it.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        this._attachTrack(this.props.audioTrack);
        this.initContext();

        if (this._ref) {
            const { autoPlay, muted, volume } = this.props;

            let stream = this._ref.mozCaptureStream
                        ? this._ref.mozCaptureStream()
                        : this._ref.captureStream()
    
            if (stream.active) {
                console.log('Chrome!');
                this._source = window.context.createMediaStreamSource(stream);
            } else { // in the case of Firefox, streams are duplicated?
                console.log('Firefox!');
                this._ref.volume = 0;
                this._source = window.context.createMediaElementSource(this._ref);
                this._ref.play();
            }

            // Get global audio tracks and create hidden users
            if (typeof window.audioTracks === 'undefined') {
                window.audioTracks = document.getElementsByClassName('audio-track');
            }

            // Index and length for the first time
            this._trackLen = window.audioTracks.length; 
            this._trackIdx = this.getIndex();
            
            // Set up initial spatialization
            this.setupSpatial();
            this.updateSpatial();

            if (autoPlay) {
                //     Ensure the audio gets play() called on it. This may be necessary in the
                //     case where the local video container was moved and re-attached, in which
                //     case the audio may not autoplay.
                this._ref.play();
            }

            if (typeof volume === 'number') {
                // this._ref.volume = volume;
                this._gainNode.gain.value = volume;
            }

            if (typeof muted === 'boolean') {
                this._ref.muted = muted;
            }
        }
    }

    /**
     * Remove any existing associations between the current audio track and the
     * component's audio element.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        this._detachTrack(this.props.audioTrack);
        this._source.disconnect(); // disconnect old audio stream (prevents lingering audio)
    }

    /**
     * This component's updating is blackboxed from React to prevent re-rendering of the audio
     * element, as we set all the properties manually.
     *
     * @inheritdoc
     * @returns {boolean} - False is always returned to blackbox this component
     * from React.
     */
    shouldComponentUpdate(nextProps: Props) {
        const currentJitsiTrack = this.props.audioTrack?.jitsiTrack;
        const nextJitsiTrack = nextProps.audioTrack?.jitsiTrack;
        const participantId = this.props.audioTrack.participantId;

        if (window.context.state === 'suspended') {
            console.warn('Context is suspended!');
            window.context.resume();
        }

        if (currentJitsiTrack !== nextJitsiTrack) {
            this._detachTrack(this.props.audioTrack);
            this._attachTrack(nextProps.audioTrack);
        }

        // Check if current track is hidden - if so, don't update!
        if (this._ref) {
            
            const currentVolume = this._gainNode.gain.value;
            const nextVolume = nextProps.volume;

            if (typeof nextVolume === 'number' && !isNaN(nextVolume) && currentVolume !== nextVolume) {
                this._gainNode.gain.value = nextVolume;
            }

            const currentMuted = this._ref.muted;
            const nextMuted = nextProps.muted;

            if (typeof nextMuted === 'boolean' && currentMuted !== nextVolume) {
                this._ref.muted = nextMuted;
            }

            // If toggle was hit, switch
            if (window.spatialAudio !== this._spatialAudio) {
                this.switchCondition();
                this._spatialAudio = window.spatialAudio;
            }

            if (window.spatialAudio) {
                // Check if user is in a new position in queue
                const currentIndex = this._trackIdx;
                const currentLength = this._trackLen;
    
                // Update index
                const nextIndex = this.getIndex();
                const nextLength = window.audioTracks.length;

                if (currentIndex !== nextIndex || currentLength !== nextLength) {
                    this._trackIdx = nextIndex;
                    this._trackLen = nextLength;
                    this.updateSpatial(); // send new location in queue and update
                }
            }
        }

        return false;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { autoPlay, id } = this.props;

        return (
            <audio
                autoPlay = { autoPlay }
                id = { id }
                ref = { this._setRef } />
        );
    }

    /**
     * Calls into the passed in track to associate the track with the component's audio element.
     *
     * @param {Object} track - The redux representation of the {@code JitsiLocalTrack}.
     * @private
     * @returns {void}
     */
    _attachTrack(track) {
        if (!track || !track.jitsiTrack) {
            return;
        }

        track.jitsiTrack.attach(this._ref);
    }

    /**
     * Removes the association to the component's audio element from the passed
     * in redux representation of jitsi audio track.
     *
     * @param {Object} track -  The redux representation of the {@code JitsiLocalTrack}.
     * @private
     * @returns {void}
     */
    _detachTrack(track) {
        if (this._ref && track && track.jitsiTrack) {
            track.jitsiTrack.detach(this._ref);
        }
    }

    _setRef: (?HTMLAudioElement) => void;

    /**
     * Sets the reference to the HTML audio element.
     *
     * @param {HTMLAudioElement} audioElement - The HTML audio element instance.
     * @private
     * @returns {void}
     */
    _setRef(audioElement: ?HTMLAudioElement) {
        this._ref = audioElement;
        const { onInitialVolumeSet } = this.props;

        if (this._ref && this._gainNode && onInitialVolumeSet) {
            onInitialVolumeSet(this._gainNode.gain.value);
        }
    }

    /**
     * Set up required variables for WebAudio spatialization
     * Note: This doesn't set up location of sounds (done in update)
     * 
     * @returns {void}
     */
    setupSpatial = () => {
        // setup listener once, one per context
        if (typeof listener === 'undefined') {
            const listener = window.context.listener;

            if (listener.forwardX) {
                listener.forwardX.value = 0;
                listener.forwardY.value = 0;
                listener.forwardZ.value = -1;
                listener.upX.value = 0;
                listener.upY.value = 1;
                listener.upZ.value = 0;
            } else {
                listener.setOrientation(0, 0, -1, 0, 1, 0);
            }

            if (listener.positionX) {
                listener.positionX.value = 0; // horizontal
                listener.positionY.value = 0; // vertical
                listener.positionZ.value = 1; // depth
            } else {
                listener.setPosition(0, 0, 1);
            }
        }

        // create and link nodes
        this._gainNode = window.context.createGain();
        this._pannerNode = window.context.createPanner();

        // setup source location
        this._pannerNode.panningModel = 'HRTF';
        this._pannerNode.distanceModel = 'inverse';
        this._pannerNode.refDistance = 1;
        this._pannerNode.maxDistance = 10000;
        this._pannerNode.rolloffFactor = 1;
        this._pannerNode.coneInnerAngle = 360;
        this._pannerNode.coneOuterAngle = 0;
        this._pannerNode.coneOuterGain = 0;
        this._pannerNode.scale = 1;

        if (this._pannerNode.orientationX) {
            this._pannerNode.orientationX.value = 1; // horizontal (should not matter without a cone)
            this._pannerNode.orientationY.value = 0; // vertical
            this._pannerNode.orientationZ.value = 0; // depth
        } else {
            this._pannerNode.setOrientation(1, 0, 0);
        }

        // finally, connect graph
        this._source.connect(this._pannerNode);
        this._pannerNode.connect(this._gainNode);
        this._gainNode.connect(window.context.destination);
        this._spatialAudio = window.spatialAudio;
    }

    /**
     * Update location of audio stream
     *
     * @returns {void}
     */
    updateSpatial = () => {
        // change location of source when its an update
        console.log('Updating panner!');

        let [xPos, yPos] = this.calcLocation();

        // set x, y position
        if (this._pannerNode.positionX) {
            this._pannerNode.positionX.value = xPos * this._pannerNode.scale;
            this._pannerNode.positionY.value = yPos * this._pannerNode.scale;
        } else {
            this._pannerNode.setPosition((xPos * this._pannerNode.scale), 0, 0);
            this._pannerNode.setPosition((yPos * this._pannerNode.scale), 0, 0);
        }
    }

    /**
     * Initializes Web Audio context
     *
     * @returns {void}
     */
    initContext = () => {
        if (window.context) {
            console.log('AudioContext exists');
        } else {
            window.context = new (window.AudioContext || window.webkitAudioContext);
            console.warn('AudioContext does not exist');
        }

        // Sets both global and local states initially
        if (typeof(window.spatialAudio) === 'undefined') {
            console.warn('No spatial audio initialized')
            window.spatialAudio = false;
        }
    }

    /**
     * Get index of audio stream
     *
     * @returns {number}
     */
    getIndex = () => {
        let i = 0;
        // const tempAudioTracks = document.querySelectorAll('div.audio-track');

        if (window.audioTracks.length > 1) {
            try {
                for (let item of audioTracks) {
                    if (item.firstChild.id === this._ref.id) {
                        return i;
                    } i++;
                }
                console.warn('Index not found!', item.firstChild.id);
            } catch (err) {
                // console.error(err);
                console.warn('Error!')
                return 0;
            }
        } else {
            return 0;
        }
    }

    /**
     * Calculate the location of a participant's audio stream
     *
     * @returns {[number, number]}
     */
    calcLocation = () => {
        let place = this._trackIdx + 1; // get current position of track in queue
        let angle = 2 / (Number(this._trackLen) + 1); // get angle for current set of participants
        let pos = (place * angle) - 1; // make a left to right panning (-1 to 1)

        let xPos = Math.sin(Math.PI * (pos/2)).toFixed(2);
        let yPos = Math.cos(Math.PI * (pos/2)).toFixed(2);
        
        console.log('Location of track '+place+' = '+xPos+', '+yPos);

        return [xPos, yPos];
    }

    /**
     * Switches mono/spatial reproduction by dis/connecting nodes
     *
     * @returns {void}
     */
    switchCondition = () => {
        this._source.disconnect();

        if (this._spatialAudio) {
            this._pannerNode.disconnect()
            this._source.connect(this._gainNode);
        } else {
            this._source.connect(this._pannerNode);
            this._pannerNode.connect(this._gainNode);
        }
    }
}
