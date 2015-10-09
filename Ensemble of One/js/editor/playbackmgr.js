(function () {
    WinJS.Namespace.define("Ensemble.Editor.PlaybackMGR", {
        /// <summary>Manages the history state of the current project.</summary>

        canPlay: false,
        playing: false,
        lastTime: 0,
        lastTimeFriendly: "00:00:00.000",
        _clipSeekCount: 0,
        _seekDestination: 0,
        _renderNextTimeUpdate: false,
        _timer: null,

        init: function () {
            this._refreshUI();
            this._timer = new Worker("/js/editor/timer.js");
            this._timer.addEventListener("message", this._listeners.timerUpdate);
        },

        unload: function () {
            this._cleanUI();
            this._timer.terminate();
            this.canPlay = false;
            this.lastTime = 0;
            this.lastTimeFriendly = "00:00:00.000";
        },

        primeTimer: function () {
            /// <summary>Primes the timing system for playback.</summary>
            this._timer.postMessage({
                type: "setBreakpoints",
                contents: Ensemble.Editor.TimelineMGR._timeIndex
            });
        },

        play: function (callback) {
            /// <summary>Begins playback from the current position in the project.</summary>
            /// <param name="callback" type="Function">Optional. The callback to execute after playback has begun.</param>
            let playbackList = Ensemble.Editor.TimelineMGR._clipIndex[Ensemble.Editor.TimelineMGR._clipIndexPosition].playbackList,
                clipCount = playbackList.length;

            this.playing = true;
            this._timer.postMessage({ type: "startTimer" });

            for (let i = 0; i < clipCount; i++) {
                playbackList[i].play();
            }

            Ensemble.Editor.Renderer.start();
            this.ui.buttonPlayPause.innerHTML = "&#xE103;";
            if (callback != null) callback();
        },

        pause: function () {
            /// <summary>Pauses playback at the current position in the project.</summary>
            this._timer.postMessage({ type: "stopTimer" });
            for (let i = 0; i < Ensemble.Editor.TimelineMGR.tracks.length; i++) {
                for (let k = 0; k < Ensemble.Editor.TimelineMGR.tracks[i].clips.length; k++) {
                    Ensemble.Editor.TimelineMGR.tracks[i].clips[k].pause();
                }
            }
            this.playing = false;
            Ensemble.Editor.Renderer.stop();
            this.ui.buttonPlayPause.innerHTML = "&#xE102;";
        },

        seek: function (time) {
            /// <summary>Seeks playback to the given time.</summary>
            /// <param name="time" type="Number">The time in milliseconds.</param>
            this._clipSeekCount = 0;
            this._seekDestination = Math.round(time);
            if (this._seekDestination > Ensemble.Session.projectDuration) this._seekDestination = Ensemble.Session.projectDuration;
            else if (0 > this._seekDestination) this._seekDestination = 0;
            for (let i = 0; i < Ensemble.Editor.TimelineMGR.tracks.length; i++) {
                for (let k = 0; k < Ensemble.Editor.TimelineMGR.tracks[i].clips.length; k++) {
                    Ensemble.Editor.TimelineMGR.tracks[i].clips[k].seek(this._seekDestination);
                }
            }
        },

        sync: function () {
            /// <summary>Synchronizes all clips to the current project clock and renders a single frame after the operation completes.</summary>
            Ensemble.Editor.PlaybackMGR.seek(this.lastTime);
        },

        ui: {
            buttonPlayPause: null,
            timerDisplay: null
        },

        _refreshUI: function () {
            this.ui.buttonPlayPause = document.getElementsByClassName("eo1-btn--editor-playpause")[0];
            this.ui.timerDisplay = document.getElementsByClassName("editor-time-display")[0];

            this.ui.buttonPlayPause.addEventListener("click", this._listeners.buttonPlayPause);
        },

        _cleanUI: function () {
            this.ui.buttonPlayPause.removeEventListener("click", this._listeners.buttonPlayPause);

            this.ui.buttonPlayPause = null;
            this.ui.timerDisplay = null;
        },

        _listeners: {
            buttonPlayPause: function (event) {
                if (Ensemble.Editor.PlaybackMGR.playing) {
                    console.info("Pausing playback.");
                    Ensemble.Editor.PlaybackMGR.pause();
                }
                else {
                    console.info("Beginning playback.");
                    Ensemble.Editor.PlaybackMGR.play();
                }
            },

            timerUpdate: function (message) {
                switch (message.data.type) {
                    case "time":
                        Ensemble.Editor.PlaybackMGR.lastTime = message.data.contents.ms;
                        Ensemble.Editor.PlaybackMGR.lastTimeFriendly = message.data.contents.friendly;
                        if (Ensemble.Editor.PlaybackMGR._renderNextTimeUpdate) {
                            Ensemble.Editor.PlaybackMGR._renderNextTimeUpdate = false;
                            Ensemble.Editor.Renderer.requestFrame();
                        }
                        break;
                    case "endOfPlayback":
                        Ensemble.Editor.PlaybackMGR.pause();
                        break;
                    case "newIndexPosition":
                        Ensemble.Editor.TimelineMGR._clipIndexPosition = message.data.contents;
                        if (Ensemble.Editor.PlaybackMGR.playing) {
                            for (let i = 0; i < Ensemble.Editor.TimelineMGR._clipIndex[message.data.contents].starting.length; i++) {
                                Ensemble.Editor.TimelineMGR._clipIndex[message.data.contents].starting[i].play();
                            }
                            for (let i = 0; i < Ensemble.Editor.TimelineMGR._clipIndex[message.data.contents].stopping.length; i++) {
                                Ensemble.Editor.TimelineMGR._clipIndex[message.data.contents].stopping[i].pause();
                            }
                            break;
                        }
                        else {
                            //Ensemble.Editor.Renderer.renderSingleFrame();
                        }
                }
            },

            clipSeeked: function (event) {
                /// <summary>Fires when a clip finishes seeking. After all clips in the project have finished seeking, render a single frame.</summary>
                Ensemble.Editor.PlaybackMGR._clipSeekCount++;
                if (Ensemble.Editor.PlaybackMGR._clipSeekCount == Ensemble.Session.projectClipCount) {
                    console.log("Finished seeking.");
                    Ensemble.Editor.PlaybackMGR._renderNextTimeUpdate = true;
                    Ensemble.Editor.PlaybackMGR._timer.postMessage({ type: "seeked", contents: Ensemble.Editor.PlaybackMGR._seekDestination });
                }
            }
        }
    });
})();