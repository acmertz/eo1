(function () {
    WinJS.Namespace.define("Ensemble.Editor.TimelineMGR", {
        /// <summary>Manages the history state of the current project.</summary>

        tracks: [],
        _uniqueTrackID: 0,

        createTrack: function (clipsToAdd) {
            /// <summary>Creates a new track in the timeline.</summary>
            /// <param name="clipsToAdd" type="Array">Optional. An array of Ensemble.EnsembleFile objects with which to prepopulate the track.</param>

            var newTrack = new Ensemble.Editor.Track();
            this.tracks.push(newTrack);
            Ensemble.Session.projectTrackCount = this.tracks.length;
            Ensemble.Editor.TimelineMGR._buildTrackDisplay(newTrack);
        },

        updateTrackSizing: function () {
            /// <summary>Updates the timeline tracks to match the recently resized view.</summary>
            var tracks = document.getElementsByClassName("editorTimelineTrack");
            var trackHeight = Math.floor(Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timeline.clientHeight / Ensemble.Settings.getEditorTimelineRowsVisible()) + "px";
            for (var i = 0; i < tracks.length; i++) {
                tracks[i].style.height = trackHeight;
                tracks[i].style.lineHeight = trackHeight;
            }
        },

        generateNewTrackId: function () {
            /// <summary>Generates a new, unique ID for a Track.</summary>
            /// <returns type="Number">A number to represent a Track ID.</returns>
            this._uniqueTrackID++;
            return this._uniqueTrackID - 1;
        },

        _buildTrackDisplay: function (track) {
            console.log("Created track. Building display....");
            var trackElement = document.createElement("div");
            trackElement.className = "editorTimelineTrack";

            var trackHeight = Math.floor(Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timeline.clientHeight / Ensemble.Settings.getEditorTimelineRowsVisible()) + "px";

            trackElement.style.height = trackHeight;
            trackElement.style.lineHeight = trackHeight;

            var headerElement = document.createElement("div");
            headerElement.className = "trackHeader";
            headerElement.innerText = "h";

            var contentElement = document.createElement("div");
            contentElement.className = "trackContent";
            contentElement.innerText = "content";

            trackElement.appendChild(headerElement);
            trackElement.appendChild(contentElement);

            Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timeline.appendChild(trackElement);
        }
    });
})();