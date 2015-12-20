(function () {
    WinJS.Namespace.define("Ensemble.Editor.TimelineMGR", {
        /// <summary>Manages the history state of the current project.</summary>

        tracks: [],
        mediaComposition: new Windows.Media.Editing.MediaComposition(),
        clipIndex: [],
        clipIndexPosition: 0,
        timeIndex: [],
        uniqueTrackID: 0,
        uniqueClipID: 0,

        init: function () {
            /// <summary>Links all UI references.</summary>
            this._refreshUI();

            // rebuild the index
            this.rebuildIndex();
        },
        
        unload: function () {
            /// <summary>Clears the timeline, unloads all the clips stored within it, and resets all values back to their defaults.</summary>
            this.tracks = [];

            this._cleanUI();
        },

        createTrack: function (idToUse, nameToUse, volumeToUse) {
            /// <summary>Creates a new track in the timeline.</summary>
            /// <param name="idToUse" type="Number">Optional. An ID to give the newly-created track, for use in project loading.</param>
            /// <param name="nameToUse" type="String">Optional. A name to give the track.</param>
            /// <param name="volumeToUse" type="Number">Optional. A volume level to assign the track.</param>
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

        rebuildIndex: function () {
            /// <summary>Rebuilds the index used as a target by the Renderer and the PlaybackMGR. WARNING: not safe to call during playback.</summary>
            this.refreshComposition();

            let timeList = [];
            let totalClipCount = 0;
            for (let i = 0; i < this.tracks.length; i++) {
                for (let k = 0; k < this.tracks[i].clips.length; k++) {
                    let start = this.tracks[i].clips[k].startTime;
                    let end = this.tracks[i].clips[k].startTime + this.tracks[i].clips[k].duration;
                    if (timeList.indexOf(start) === -1) timeList.push(start);
                    if (timeList.indexOf(end) === -1) timeList.push(end);
                    totalClipCount++;
                }
            }
            Ensemble.Session.projectClipCount = totalClipCount;
            timeList.sort(function (a, b) { return a - b });

            if (timeList.length > 0 && timeList[0] != 0) timeList.unshift(0);
            this.timeIndex = _.clone(timeList);

            for (let i = 0; i < timeList.length; i++) {
                timeList[i] = {
                    time: timeList[i],
                    starting: [],
                    stopping: [],
                    renderList: [],
                    playbackList: []
                };
                for (let k = 0; k < this.tracks.length; k++) {
                    for (let g = 0; g < this.tracks[k].clips.length; g++) {
                        let tempClip = this.tracks[k].clips[g];
                        if (tempClip.startTime === timeList[i].time) timeList[i].starting.push(tempClip);
                        if (tempClip.startTime + tempClip.duration === timeList[i].time) timeList[i].stopping.push(tempClip);
                        if ((tempClip.startTime <= timeList[i].time) && (timeList[i].time < tempClip.startTime + tempClip.duration)) {
                            if (tempClip.isRenderable()) timeList[i].renderList.push(tempClip);
                            timeList[i].playbackList.push(tempClip);
                        }
                    }
                }
            }
            this.clipIndex = timeList;
            if (this.clipIndex.length > 0) Ensemble.Session.projectDuration = this.clipIndex[this.clipIndex.length - 1].time;
            else Ensemble.Session.projectDuration = 0;
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

        generateNewTrackMap: function () {
            /// <summary>Generates a new track object.</summary>
            /// <returns type="Object">An object representing the track.</returns>
            return {
                id: -1,
                name: "Untitled track",
                volume: 1,
                selected: false,
                clips: []
            };
        },

        ui: {
            newTrackButton: null,
            trackControls: null,
            trackContainer: null
        },

        _refreshUI: function () {
            this.ui.newTrackButton = document.getElementsByClassName("timeline-new-track-control")[0];
            this.ui.trackControls = document.getElementsByClassName("timeline-track-controls")[0];
            this.ui.trackContainer = document.getElementsByClassName("timeline-track-container")[0];

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
                console.log("Create new track.");

                let newId = Ensemble.Editor.TimelineMGR.generateNewTrackId(),
                    newTrackControl = document.importNode(document.getElementsByClassName("eo1-template--track-control")[0].content.querySelectorAll(".track-control")[0], true),
                    newTrackContent = document.importNode(document.getElementsByClassName("eo1-template--track-content")[0].content.querySelectorAll(".track-content")[0], true);
                
                newTrackControl.dataset.trackId = newId;
                newTrackContent.dataset.trackId = newId;

                WinJS.Utilities.addClass(newTrackControl, "timeline-track--" + newId);
                WinJS.Utilities.addClass(newTrackContent, "timeline-track--" + newId);

                newTrackControl.innerText = "Track " + newId;
                newTrackContent.innerText = "Track " + newId;

                Ensemble.Editor.TimelineMGR.ui.trackControls.insertBefore(newTrackControl, Ensemble.Editor.TimelineMGR.ui.trackControls.lastElementChild);
                Ensemble.Editor.TimelineMGR.ui.trackContainer.appendChild(newTrackContent);
            }
        }
    });
})();