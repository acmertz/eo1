(function () {
    WinJS.Namespace.define("Ensemble.Editor.PlaybackMGR", {
        /// <summary>Manages the history state of the current project.</summary>

        init: function () {
            this._refreshUI();
        },

        unload: function () {
            this._cleanUI();
        },

        play: function () {
            /// <summary>Begins playback from the current position in the project.</summary>
            /// <param name="callback" type="Function">Optional. The callback to execute after playback has begun.</param>
        },

        pause: function () {
            /// <summary>Pauses playback at the current position in the project.</summary>
        },

        seek: function (time) {
            /// <summary>Seeks playback to the given time.</summary>
            /// <param name="time" type="Number">The time in milliseconds.</param>
        },

        getCurrentTime: function () {
            /// <summary>Returns the current playback time.</summary>
            /// <returns type="Number">The current playback time, in milliseconds.</returns>
            // TODO
            return 0;
        },

        ui: {
        },

        _refreshUI: function () {
        },

        _cleanUI: function () {
        },

        _listeners: {
        }
    });
})();