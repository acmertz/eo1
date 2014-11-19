(function () {
    WinJS.Namespace.define("Ensemble.Editor.TimelineMGR", {
        /// <summary>Manages the history state of the current project.</summary>

        tracks: [],
        _uniqueTrackID: 0,

        createTrack: function (clipsToAdd, idToUse) {
            /// <summary>Creates a new track in the timeline.</summary>
            /// <param name="clipsToAdd" type="Array">Optional. An array of Ensemble.EnsembleFile objects with which to prepopulate the track.</param>
            /// <param name="idToUse" type="Number">Optional. An ID to give the newly-created track, for use in project loading.</param>

            var newTrack = new Ensemble.Editor.Track(idToUse);
            this.tracks.push(newTrack);
            Ensemble.Session.projectTrackCount = this.tracks.length;
            Ensemble.Editor.TimelineMGR._buildTrackDisplay(newTrack);
            return newTrack.id;
        },

        removeTrack: function (trackId) {
            /// <summary>Removes the track with the given ID, unloading any clips it may contain.</summary>
            /// <param name="trackId", type="Number">An ID representing the track to be removed.</param>
            $("#" + this._buildTrackDOMId(trackId)).remove();
            for (var i = 0; i < this.tracks.length; i++) {
                if (this.tracks[i].id == trackId) this.tracks.splice(i, 1);
            }
            Ensemble.Session.projectTrackCount = this.tracks.length;
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

        unload: function () {
            /// <summary>Clears the timeline, unloads all the clips stored within it, and resets all values back to their defaults.</summary>
            Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timeline.innerHTML = "";
            this.tracks = [];
            this._uniqueTrackID = 0;
        },

        _buildTrackDisplay: function (track) {
            /// <param name="track" type="Ensemble.Editor.Track">The track to represent on the timeline.</param>

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

            trackElement.id = this._buildTrackDOMId(track.id);

            Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timeline.appendChild(trackElement);
        },

        _buildTrackDOMId: function (idval) {
            return "editorTimelineTrack" + idval;
        }
    });
})();