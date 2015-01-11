(function () {
    WinJS.Namespace.define("Ensemble.Editor.PlaybackMGR", {
        /// <summary>Manages the history state of the current project.</summary>

        canPlay: false,
        currentTime: 0,
        _index: [],

        init: function () {

        },

        unload: function () {

        },

        reset: function () {
            /// <summary>Resets the PlaybackMGR to its default state.</summary>
            this.canPlay = false;
            this.currentTime = 0,
            this._index = [];
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
            buttonPlayPause: function(event) {
            },

            buttonSkipBack: function(event) {
            },

            buttonSkipForward: function(event) {
            },

            buttonFullScreen: function(event) {
            }
        }
    });
})();