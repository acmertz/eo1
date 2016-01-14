(function () {
    WinJS.Namespace.define("Ensemble.Editor.TimelineMGR", {
        /// <summary>Manages the history state of the current project.</summary>

        tracks: [],
        mediaComposition: new Windows.Media.Editing.MediaComposition(),
        uniqueTrackID: 0,
        uniqueClipID: 0,

        init: function () {
            /// <summary>Links all UI references.</summary>
            this._refreshUI();

            let trackCount = this.tracks.length;
            for (let i = 0; i < trackCount; i++) {
                let generatedMarkup = this.generateNewTrackMarkup(this.tracks[i].id, this.tracks[i].name);
                Ensemble.Editor.TimelineMGR.ui.trackControls.insertBefore(generatedMarkup.control, Ensemble.Editor.TimelineMGR.ui.trackControls.lastElementChild);
                Ensemble.Editor.TimelineMGR.ui.trackContainer.insertBefore(generatedMarkup.content, Ensemble.Editor.TimelineMGR.ui.trackContainer.lastElementChild);
            }
        },
        
        unload: function () {
            /// <summary>Clears the timeline, unloads all the clips stored within it, and resets all values back to their defaults.</summary>
            this.tracks = [];
            let allTracks = Array.from(document.querySelectorAll(".track-content")).concat(Array.from(document.querySelectorAll(".track-control"))),
                itemCount = allTracks.length;

            for (let i = 0; i < itemCount; i++) {
                let tempTrack = allTracks[i];
                tempTrack.parentElement.removeChild(tempTrack);
            }
            
            this._cleanUI();
        },

        createTrack: function (idToUse) {
            /// <summary>Creates a new track in the timeline.</summary>
            /// <param name="idToUse" type="Number">Optional. An ID to give the newly-created track. If no ID is specified, a new one is uniquely generated.</param>
            /// <returns type="Number">The unique ID of the track.</returns>

            let newTrackId = idToUse;
            if (idToUse == null) newTrackId = this.generateNewTrackId();

            let generatedMap = this.generateNewTrackMap(newTrackId),
                generatedMarkup = Ensemble.Editor.TimelineMGR.generateNewTrackMarkup(newTrackId, generatedMap.name);

            this.tracks.push(generatedMap);
            this.mediaComposition.overlayLayers.append(new Windows.Media.Editing.MediaOverlayLayer());

            let anim1 = WinJS.UI.Animation.createAddToListAnimation(generatedMarkup.control, Ensemble.Editor.TimelineMGR.ui.trackControls.lastElementChild),
                anim2 = WinJS.UI.Animation.createAddToListAnimation(generatedMarkup.content, Ensemble.Editor.TimelineMGR.ui.trackContainer.lastElementChild);

            Ensemble.Editor.TimelineMGR.ui.trackControls.insertBefore(generatedMarkup.control, Ensemble.Editor.TimelineMGR.ui.trackControls.lastElementChild);
            Ensemble.Editor.TimelineMGR.ui.trackContainer.insertBefore(generatedMarkup.content, Ensemble.Editor.TimelineMGR.ui.trackContainer.lastElementChild);

            anim1.execute();
            anim2.execute();

            return newTrackId;
        },

        addTrackAtIndex: function (track, index) {
            /// <summary>Adds the given track to the given position in the list of tracks, assuming that any and all contained clips are fully loaded and ready for playback.</summary>
            /// <param name="track" type="Ensemble.Editor.Track">The Track to add.</param>
            /// <param name="index" type="Number">The position where the track should be added.</param>
        },

        removeTrack: function (trackId) {
            /// <summary>Removes the track with the given ID, unloading any clips it may contain.</summary>
            /// <param name="trackId" type="Number">An ID representing the track to be removed.</param>
            /// <returns type="Object">An object containing the track that was removed, as well as its original position in the array of tracks.</returns>

            let trackCount = this.tracks.length,
                removedMap = null,
                removedOverlayLayer = null;

            for (let i = 0; i < trackCount; i++) {
                if (this.tracks[i].id == trackId) {
                    removedMap = this.tracks[i];
                    removedOverlayLayer = this.mediaComposition.overlayLayers.getAt(i);
                    this.mediaComposition.overlayLayers.removeAt(i);
                    break;
                }
            }

            let trackControl = document.querySelector(".track-control.timeline-track--" + trackId),
                trackContent = document.querySelector(".track-content.timeline-track--" + trackId);

            trackControl.setAttribute("deleting");
            trackContent.setAttribute("deleting");

            let affectedControls = document.querySelectorAll(".track-control:not([deleting]), .timeline-new-track-control"),
                affectedContents = document.querySelectorAll(".track-content:not([deleting]), .timeline-drop-container"),
                controlsAnimation = WinJS.UI.Animation.createDeleteFromListAnimation(trackControl, affectedControls),
                contentsAnimation = WinJS.UI.Animation.createDeleteFromListAnimation(trackContent, affectedContents);

            trackControl.style.position = "absolute";
            trackControl.style.opacity = "0";
            trackContent.style.position = "absolute";
            trackContent.style.opacity = "0";

            controlsAnimation.execute().done(function () { trackControl.parentElement.removeChild(trackControl) });
            contentsAnimation.execute().done(function () { trackContent.parentElement.removeChild(trackContent) });
            

            return removedMap;
        },

        moveClip: function (clipId, trackId, time) {
            /// <summary>Moves the clip with the given ID to the specified track and time.</summary>
            /// <param name="clipId" type="Number">The ID of the clip to move.</param>
            /// <param name="trackId" type="Number">The ID of the destination track.</param>
            /// <param name="time" type="Number">The destination time, in milliseconds.</param>
        },

        positionClip: function (clipId, xcoord, ycoord, width, height) {
            /// <summary>Positions the clip with the given ID according to the specified coordinates and dimensions.</summary>
            /// <param name="clipId" type="Number">The clip's ID.</param>
            /// <param name="xcoord" type="Number">The new x-coordinate.</param>
            /// <param name="ycoord" type="Number">The new y-coordinate.</param>
            /// <param name="width" type="Number">The new width.</param>
            /// <param name="height" type="Number">The new height.</param>
        },

        removeClip: function (clipId) {
            /// <summary>Removes the clip with the given ID.</summary>
            /// <returns type="Object">An object containing Clip "clip" and Number "trackId"</returns>
        },

        trimClip: function (clipId, startTime, dur, startTrim, endTrim) {
            /// <summary>Trims the clip with the given ID to the given parameters.</summary>
            /// <param name="clipId" type="Number">The ID of the clip to trim.</param>
            /// <param name="startTime" type="Number">The new start time of the clip.</param>
            /// <param name="dur" type="Number">The new duration of the clip.</param>
            /// <param name="startTrim" type="Number">The new start trim of the clip.</param>
            /// <param name="endTrim" type="Number">The new end trim of the clip.</param>
        },

        splitClip: function (clipIds, time, newIds) {
            /// <summary>Splits the clips with the given IDs at the specified project time.</summary>
            /// <param name="clipIds" type="Array">An array containing the IDs of the clips to split.</param>
            /// <param name="time" type="Number">The project time where the split should occur.</param>
            /// <param name="newIds" type="Array">A list of IDs to use for the new clips generated in the split.</param>
        },

        unsplitClip: function (clipIds, newIds) {
            /// <summary>Concatenates a pair of clips that were previously split and are exactly adjacent to each other (share one bound).</summary>
            /// <param name="clipIds" type="Array">An array containing the earlier portion of each clip to concatenate.</param>
            /// <param name="newIds" type="Array">An array containing the later portion of each clip to concatenate.</param>
        },

        addClipToTrack: function (clipObj, trackId, destinationTime) {
            /// <summary>Adds the given Clip to the track with the given ID.</summary>
            /// <param name="clipObj" type="Ensemble.Editor.Clip">The clip to add.</param>
            /// <param name="trackId" type="Number">The ID of the track in which to place the clip. In case of a collision, the TimelineMGR searches forward from the requested time for the first available empty slot large enough to contain the clip.</param>
            /// <param name="destinationTime" type="Number">The project time at which to insert the clip.</param>
        },

        moveTrackWithId: function (trackId, origin, destination) {
            /// <summary>Moves the track with the given ID to the specified position in the track array.</summary>
            /// <param name="trackId" type="Number">The ID of the track to move.</param>
            /// <param name="origin" type="Number">The index of the position where the track begins its move.</param>
            /// <param name="destination" type="Number">The index of the position where the track should end up after the move.</param>
        },

        getTrackById: function (idval) {
            /// <summary>Returns the Track object with the given ID, provided it exists.</summary>
            /// <param name="idval" type="Number">The ID of the track to locate.</param>
        },

        getClipById: function (idval) {
            /// <summary>Returns the Clip with the given ID, provided it exists. Searches all tracks.</summary>
            /// <param name="idval" type="Number">The ID of the clip to locate.</param>
        },        

        renameTrack: function (trackId, newName) {
            /// <summary>Renames the track with the given ID.</summary>
            /// <param name="trackId" type="Number">The ID of the track to rename.</param>
            /// <param name="newName" type="String">The name to give the track.</param>
        },

        renameClip: function (clipId, newName) {
            /// <summary>Renames the clip with the given ID.</summary>
            /// <param name="clipId" type="Number">The ID of the clip to rename.</param>
            /// <param name="newName" type="String">The name to give the clip.</param>
        },

        refreshClipVolumeModifiers: function () {
            /// <summary>Shortcut to refresh the volume on all clips across all tracks.</summary>
        },

        changeClipVolume: function (clipId, newVolume) {
            /// <summary>Sets the volume of the clip with the given ID.</summary>
            /// <param name="clipId" type="Number">The ID of the clip.</param>
            /// <param name="newVolume" type="Number">The volume to assign the clip.</param>
        },

        changeTrackVolume: function (trackId, newVolume) {
            /// <summary>Changes the volume of the track with the given ID.</summary>
            /// <param name="trackId" type="Number">The ID of the track.</param>
            /// <param name="newVolume" type="Number">The volume to assign the track.</param>
        },

        refreshComposition: function () {
            ///// <summary>Refreshes the MediaComposition preview display.</summary>
            //let previewElement = document.getElementsByClassName("editor-composition-player")[0],
            //    mediaStreamSource = Ensemble.Editor.TimelineMGR.composition.generatePreviewMediaStreamSource(previewElement.offsetWidth, previewElement.offsetHeight);
            //previewElement.src = URL.createObjectURL(mediaStreamSource, { oneTimeOnly: true });
        },

        generateNewTrackId: function () {
            /// <summary>Generates a new, unique ID for a Track.</summary>
            /// <returns type="Number">A number to represent a Track ID.</returns>
            this.uniqueTrackID++;
            return this.uniqueTrackID - 1;
        },

        generateNewClipId: function () {
            /// <summary>Generates a new, unique ID for a Clip.</summary>
            /// <returns type="Number">A number to represent a Clip ID.</returns>
            this.uniqueClipID++;
            return this.uniqueClipID - 1;
        },

        generateNewTrackMap: function (idval) {
            /// <summary>Generates a new track object.</summary>
            /// <param name="idval" type="Number">The ID of the track being generated.</param>
            /// <returns type="Object">An object representing the track.</returns>
            let itemId = (idval == null) ? -1 : idval;
            return {
                id: itemId,
                name: "Untitled track",
                volume: 1,
                selected: false,
                clips: []
            };
        },

        generateNewTrackMarkup: function (idval, nameval) {
            /// <summary>Generates markup for a new track based on the HTML track template.</summary>
            /// <param name="idval" type="Number">The track ID.</param>
            /// <param name="nameval" type="String">The track name.</param>
            /// <returns type="Object">An object representing the track. Contains two members: control and content.</returns>
            let newTrackControl = document.importNode(document.getElementsByClassName("eo1-template--track-control")[0].content.querySelectorAll(".track-control")[0], true),
                newTrackContent = document.importNode(document.getElementsByClassName("eo1-template--track-content")[0].content.querySelectorAll(".track-content")[0], true);

            newTrackControl.dataset.trackId = idval;
            newTrackContent.dataset.trackId = idval;

            WinJS.Utilities.addClass(newTrackControl, "timeline-track--" + idval);
            WinJS.Utilities.addClass(newTrackContent, "timeline-track--" + idval);

            if (nameval != null) newTrackControl.innerText = nameval;
            if (idval != null) newTrackContent.innerText = "Track " + idval;

            return {
                control: newTrackControl,
                content: newTrackContent
            };
        },

        ui: {
            newTrackButton: null,
            trackControls: null,
            trackContainer: null
        },

        _refreshUI: function () {
            this.ui.newTrackButton = document.querySelector(".timeline-new-track-control");
            this.ui.trackControls = document.querySelector(".timeline-track-controls");
            this.ui.trackContainer = document.querySelector(".timeline-track-container");

            this.ui.newTrackButton.addEventListener("click", this._listeners.newTrackButtonClicked);
        },

        _cleanUI: function () {
            this.ui.newTrackButton.removeEventListener("click", this._listeners.newTrackButtonClicked);

            this.ui.newTrackButton = null;
            this.ui.trackControls = null;
            this.ui.trackContainer = null;
        },

        _listeners: {
            newTrackButtonClicked: function (event) {
                Ensemble.HistoryMGR.performAction(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.createTrack, null));
            }
        }
    });
})();