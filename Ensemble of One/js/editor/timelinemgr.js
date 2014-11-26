(function () {
    WinJS.Namespace.define("Ensemble.Editor.TimelineMGR", {
        /// <summary>Manages the history state of the current project.</summary>

        tracks: [],
        _uniqueTrackID: 0,
        _displayScale: 10, //milliseconds per pixel

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
            $("#" + this._buildTrackHeaderId(trackId)).remove();
            $("#" + this._buildTrackDetailId(trackId)).remove();
            $("#" + this._buildTrackDOMId(trackId)).remove();
            for (var i = 0; i < this.tracks.length; i++) {
                if (this.tracks[i].id == trackId) this.tracks.splice(i, 1);
            }
            Ensemble.Session.projectTrackCount = this.tracks.length;
        },

        updateTrackSizing: function () {
            /// <summary>Updates the timeline tracks to match the recently resized view.</summary>
            var tracks = document.getElementsByClassName("editorTimelineTrack");
            var details = document.getElementsByClassName("editorTimelineDetail");
            var headers = document.getElementsByClassName("editorTimelineHeader");
            var trackHeight = Math.floor(Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timeline.clientHeight / Ensemble.Settings.getEditorTimelineRowsVisible()) + "px";
            for (var i = 0; i < tracks.length; i++) {
                tracks[i].style.height = trackHeight;
                details[i].style.height = trackHeight;
                headers[i].style.height = trackHeight;
            }
        },

        generateNewTrackId: function () {
            /// <summary>Generates a new, unique ID for a Track.</summary>
            /// <returns type="Number">A number to represent a Track ID.</returns>
            this._uniqueTrackID++;
            return this._uniqueTrackID - 1;
        },

        setRowsVisible: function (rowsVisible) {
            /// <summary>Sets the number of rows visible in the timeline.</summary>
            /// <param name="rowsVisible" type="Number">The number of rows to show in the timeline.</param>
            var valueToSet = "";
            switch (rowsVisible) {
                case 2:
                    valueToSet = "100%";
                    break;
                case 3:
                    valueToSet = "66.6%";
                    break;
                case 4:
                    valueToSet = "50%";
                    break;
                case 5:
                    valueToSet = "40%";
                    break;
                case 6:
                    valueToSet = "33.3%";
                    break;
            }

            Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timeline.style.backgroundSize = "100px " + valueToSet + ";"
        },

        toggleTrackDetails: function () {
            if ($(Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timelineDetails).hasClass("detailsExpanded")) {
                $(Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timelineDetails).removeClass("detailsExpanded")
                $(Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timelineHeaderDetailPlaceholder).removeClass("detailsExpanded");
                $(".trackEditButton").html("&#xE126;");
            }
            else {
                $(Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timelineDetails).addClass("detailsExpanded")
                $(Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timelineHeaderDetailPlaceholder).addClass("detailsExpanded");
                $(".trackEditButton").html("&#xE127;");
            }
        },

        unload: function () {
            /// <summary>Clears the timeline, unloads all the clips stored within it, and resets all values back to their defaults.</summary>
            Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timelineHeaders.innerHTML = "";
            Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timelineDetails.innerHTML = "";
            Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timelineTracks.innerHTML = "";
            this.tracks = [];
            this._uniqueTrackID = 0;
        },

        _buildTrackDisplay: function (track) {
            /// <param name="track" type="Ensemble.Editor.Track">The track to represent on the timeline.</param>
            var trackNumber = Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timelineHeaders.childNodes.length + 1;
            var trackHeight = Math.floor(Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timeline.clientHeight / Ensemble.Settings.getEditorTimelineRowsVisible()) + "px";

            var trackHeader = document.createElement("div");
            trackHeader.className = "editorTimelineHeader";

            var trackNumEl = document.createElement("div");
            trackNumEl.className = "trackNum";
            trackNumEl.innerText = trackNumber.toString(10);

            var trackEditButtonEl = document.createElement("div");
            trackEditButtonEl.className = "trackEditButton";
            trackEditButtonEl.innerHTML = "&#xE126;";
            //$(trackEditButtonEl).mousedown(Ensemble.Pages.MainMenu._projectListItemOnMouseDownListener);
            //$(trackEditButtonEl).mouseup(Ensemble.Pages.MainMenu._projectListItemOnMouseUpListener);
            $(trackEditButtonEl).click(Ensemble.Editor.TimelineMGR.toggleTrackDetails);

            trackHeader.appendChild(trackNumEl);
            trackHeader.appendChild(trackEditButtonEl);
            trackHeader.style.height = trackHeight;
            trackHeader.id = this._buildTrackHeaderId(track.id);

            var trackDetail = document.createElement("div");
            trackDetail.className = "editorTimelineDetail";
            trackDetail.id = this._buildTrackDetailId(track.id);
            trackDetail.style.height = trackHeight;

            var trackDetailName = document.createElement("div");
            trackDetailName.className = "timelineDetailRow timelineDetailName";
            trackDetailName.innerText = track.name;

            var trackDetailControls = document.createElement("div");
            trackDetailControls.className = "timelineDetailRow timelineDetailControls";

            var renameControl = document.createElement("div");
            renameControl.className = "timelineControl renameTrack";
            renameControl.innerHTML = "&#xE13E;";

            var volumeControl = document.createElement("div");
            volumeControl.className = "timelineControl volumeTrack";
            volumeControl.innerHTML = "&#xE15D;";

            var moveControl = document.createElement("div");
            moveControl.className = "timelineControl moveTrack";
            moveControl.innerHTML = "&#xE174;";

            var deleteControl = document.createElement("div");
            deleteControl.className = "timelineControl deleteTrack";
            deleteControl.innerHTML = "&#xE107;";

            trackDetailControls.appendChild(renameControl);
            trackDetailControls.appendChild(volumeControl);
            trackDetailControls.appendChild(moveControl);
            trackDetailControls.appendChild(deleteControl);

            trackDetail.appendChild(trackDetailName);
            trackDetail.appendChild(trackDetailControls);

            var trackElement = document.createElement("div");
            trackElement.className = "editorTimelineTrack";
            trackElement.style.height = trackHeight;
            trackElement.innerText = "Track content here.";
            trackElement.id = this._buildTrackDOMId(track.id);

            Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timelineHeaders.appendChild(trackHeader);
            Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timelineDetails.appendChild(trackDetail);
            Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timelineTracks.appendChild(trackElement);
        },

        _buildTrackDOMId: function (idval) {
            return "editorTimelineTrack" + idval;
        },
        
        _buildTrackHeaderId: function (idval) {
            return "editorTimelineHeader" + idval;
        },

        _buildTrackDetailId: function (idval) {
            return "editorTimelineDetail" + idval;
        }
    });
})();