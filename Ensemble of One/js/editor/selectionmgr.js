(function () {
    WinJS.Namespace.define("Ensemble.Editor.SelectionMGR", {
        /// <summary>Manages selected/hovering clips and tracks.</summary>
        selected: [],
        hovering: [],

        activeTrack: -1,

        init: function () {
            this._refreshUI();
            this.autosetActiveTrack();
        },

        unload: function () {
            this._cleanUI();
            this.selected = [];
            this.hovering = [];
            this.activeTrack = -1;
        },

        setActiveTrack: function (trackId) {
            /// <summary>Clears the active track, and then sets it to the track with the given ID.</summary>
            /// <param name="trackId" type="Number">The ID of the track that should be activated.</param>
            this.clearActiveTrack();
            this.activeTrack = trackId;
            let trackElements = document.querySelectorAll(".timeline-track--" + trackId),
                itemCount = trackElements.length;
            for (let i = 0; i < itemCount; i++) {
                WinJS.Utilities.addClass(trackElements[i], "timeline-track--active");
            }
        },

        clearActiveTrack: function () {
            /// <summary>Clears the active track.</summary>
            let trackElements = document.querySelectorAll(".timeline-track--active"),
                itemCount = trackElements.length;
            for (let i = 0; i < itemCount; i++) {
                WinJS.Utilities.removeClass(trackElements[i], "timeline-track--active");
            }
            this.activeTrack = -1;
        },

        autosetActiveTrack: function () {
            /// <summary>Checks to make sure there exists an active track; if not, automatically sets the first track as active.</summary>
            if (this.activeTrack == -1) {
                let firstTrackId = document.querySelector(".track-content").dataset.trackId;
                this.setActiveTrack(firstTrackId);
            }
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