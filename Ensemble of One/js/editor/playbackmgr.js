(function () {
    WinJS.Namespace.define("Ensemble.Editor.PlaybackMGR", {
        /// <summary>Manages the history state of the current project.</summary>

        canPlay: false,
        playing: false,
        currentTime: 0,
        _index: [],
        _timer: null,

        init: function () {
            this._refreshUI();
            this._timer = new Worker("/js/editor/timer.js");
            this._timer.addEventListener("message", this._listeners.timerUpdate);
        },

        unload: function () {
            this._cleanUI();
            this._timer.terminate();
        },

        reset: function () {
            /// <summary>Resets the PlaybackMGR to its default state.</summary>
            this.canPlay = false;
            this.currentTime = 0,
            this._index = [];
        },

        primeTimer: function () {
            /// <summary>Primes the timing system for playback.</summary>
            this._timer.postMessage({
                type: "setBreakpoints",
                contents: Ensemble.Editor.TimelineMGR._timeIndex
            });
        },

        play: function () {
            /// <summary>Begins playback from the current position in the project.</summary>
            this.playing = true;
            this._timer.postMessage({ type: "startTimer" });
            Ensemble.Editor.Renderer.start();
            this.ui.buttonPlayPause.innerHTML = "&#xE103;";
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

        ui: {
            buttonPlayPause: null,
            buttonSkipBack: null,
            buttonSkipForward: null,
            buttonFullScreen: null
        },

        _refreshUI: function () {
            this.ui.buttonPlayPause = document.getElementById("editorPlaypauseButton");
            this.ui.buttonSkipBack = document.getElementById("editorSkipBackButton");
            this.ui.buttonSkipForward = document.getElementById("editorSkipForwardButton");
            this.ui.buttonFullScreen = document.getElementById("editorFullscreenButton");

            this.ui.buttonPlayPause.addEventListener("click", this._listeners.buttonPlayPause);
            this.ui.buttonSkipBack.addEventListener("click", this._listeners.buttonSkipBack);
            this.ui.buttonSkipForward.addEventListener("click", this._listeners.buttonSkipForward);
            this.ui.buttonFullScreen.addEventListener("click", this._listeners.buttonFullScreen);
        },

        _cleanUI: function () {
            this.ui.buttonPlayPause.removeEventListener("click", this._listeners.buttonPlayPause);
            this.ui.buttonSkipBack.removeEventListener("click", this._listeners.buttonSkipBack);
            this.ui.buttonSkipForward.removeEventListener("click", this._listeners.buttonSkipForward);
            this.ui.buttonFullScreen.removeEventListener("click", this._listeners.buttonFullScreen);

            this.ui.buttonPlayPause = null;
            this.ui.buttonSkipBack = null;
            this.ui.buttonSkipForward = null;
            this.ui.buttonFullScreen = null;
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

            buttonSkipBack: function (event) {
            },

            buttonSkipForward: function (event) {
            },

            buttonFullScreen: function (event) {
            },

            timerUpdate: function (message) {
                switch (message.data.type) {
                    case "time":
                        break;
                    case "endOfPlayback":
                        Ensemble.Editor.PlaybackMGR.pause();
                        break;
                    case "newIndexPosition":
                        for (let i = 0; i < Ensemble.Editor.TimelineMGR._clipIndex[message.data.contents].starting.length; i++) {
                            Ensemble.Editor.TimelineMGR._clipIndex[message.data.contents].starting[i].play();
                        }
                        for (let i = 0; i < Ensemble.Editor.TimelineMGR._clipIndex[message.data.contents].stopping.length; i++) {
                            Ensemble.Editor.TimelineMGR._clipIndex[message.data.contents].stopping[i].pause();
                        }
                        Ensemble.Editor.TimelineMGR._clipIndexPosition = message.data.contents;
                        break;
                }
            }
        }
    });
})();