(function () {
    WinJS.Namespace.define("Ensemble.Editor.TimelineMGR", {
        /// <summary>Manages the history state of the current project.</summary>

        _tracks: [],

        createTrack: function () {
            /// <summary>Creates a new track in the timeline.</summary>
            var newTrack = new Ensemble.Editor.Track();
            this._tracks.push(newTrack);
            window.setTimeout(function () {
                Ensemble.Editor.TimelineMGR._buildTrackDisplay(newTrack);
            }, 0);
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