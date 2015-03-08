﻿(function () {
    WinJS.Namespace.define("Ensemble.Editor.TimelineMGR", {
        /// <summary>Manages the history state of the current project.</summary>

        tracks: [],
        _clipIndex: [],
        _clipIndexPosition: 0,
        _timeIndex: [],
        _uniqueTrackID: 0,
        _uniqueClipID: 0,
        _trackVolumeRollback: 0, //original value for the volume flyout
        _trackEditId: 0, //ID of the track being edited
        _currentTrackHeight: 0, //current height of a single Track in the Timeline display
        _currentScrollIndex: 0, //current scroll position. should usually be in the negatives.

        _timeCursorInitialPos: 0,
        _timeCursorLastMousPos: 0,
        _timeCursorDragOffset: 0,
        _timeCursorDragging: false,
        _timeCursorDisplayScale: 0,
        _timeCursorLastFinalPos: -1,

        _clipDragging: false,
        _clipDragPointerOriginalLeft: 0,
        _clipDragPointerCurrentLeft: 0,

        init: function () {
            /// <summary>Links all UI references.</summary>
            this._refreshUI();

            // todo: iterate through all tracks in the list and build their display.
            for (let i = 0; i < this.tracks.length; i++) {
                let entireTrack = this._buildTrackDisplay(this.tracks[i]);
                for (let k = 0; k < this.tracks[i].clips.length; k++) {
                    entireTrack.content.appendChild(this._buildClipDisplay(this.tracks[i].clips[k]));
                }
                Ensemble.Editor.UI.PageSections.lowerHalf.timelineHeaders.appendChild(entireTrack.header);
                Ensemble.Editor.UI.PageSections.lowerHalf.timelineDetails.appendChild(entireTrack.detail);
                Ensemble.Editor.UI.PageSections.lowerHalf.timelineTracks.appendChild(entireTrack.content);
            }
        },
        
        unload: function () {
            /// <summary>Clears the timeline, unloads all the clips stored within it, and resets all values back to their defaults.</summary>
            this.ui.timeCursor.style.left = "";
            let timelineCursor = this.ui.timeCursor.outerHTML;

            Ensemble.Editor.UI.PageSections.lowerHalf.timelineHeaders.innerHTML = "";
            Ensemble.Editor.UI.PageSections.lowerHalf.timelineDetails.innerHTML = "";
            Ensemble.Editor.UI.PageSections.lowerHalf.timelineTracks.innerHTML = timelineCursor;

            this.tracks = [];
            this._clipIndex = [];
            this._clipIndexPosition = 0;
            this._timeIndex = [];
            this._uniqueTrackID = 0;
            this._uniqueClipID = 0;
            this._cleanUI();
        },

        createTrack: function (clipsToAdd, idToUse, nameToUse, volumeToUse) {
            /// <summary>Creates a new track in the timeline.</summary>
            /// <param name="clipsToAdd" type="Array">Optional. An array of Ensemble.EnsembleFile objects with which to prepopulate the track.</param>
            /// <param name="idToUse" type="Number">Optional. An ID to give the newly-created track, for use in project loading.</param>
            /// <param name="nameToUse" type="String">Optional. A name to give the track.</param>
            /// <param name="volumeToUse" type="Number">Optional. A volume level to assign the track.</param>

            var newTrack = new Ensemble.Editor.Track(idToUse, nameToUse, volumeToUse);
            this.tracks.push(newTrack);
            Ensemble.Session.projectTrackCount = this.tracks.length;
            let trackDisplayObj = Ensemble.Editor.TimelineMGR._buildTrackDisplay(newTrack);
            
            // Append the track to the end.
            Ensemble.Editor.UI.PageSections.lowerHalf.timelineHeaders.appendChild(trackDisplayObj.header);
            Ensemble.Editor.UI.PageSections.lowerHalf.timelineDetails.appendChild(trackDisplayObj.detail);
            Ensemble.Editor.UI.PageSections.lowerHalf.timelineTracks.appendChild(trackDisplayObj.content);

            this.refreshTrackNumbers();

            return newTrack.id;
        },

        addTrackAtIndex: function (track, index) {
            /// <summary>Adds the given track to the given position in the list of tracks, assuming that any and all contained clips are fully loaded and ready for playback.</summary>
            /// <param name="track" type="Ensemble.Editor.Track">The Track to add.</param>
            /// <param name="index" type="Number">The position where the track should be added.</param>
            this.tracks.splice(index, 0, track);
            Ensemble.Session.projectTrackCount = this.tracks.length;
            let trackDisplayObj = Ensemble.Editor.TimelineMGR._buildTrackDisplay(track, index);

            for (let i = 0; i < track.clips.length; i++) {
                let clipDisplayObj = this._buildClipDisplay(track.clips[i]);
                trackDisplayObj.content.appendChild(clipDisplayObj);
            }

        
            // Insert the track before the item at the given index.
            if (index == this.tracks.length - 1) {
                $(Ensemble.Editor.UI.PageSections.lowerHalf.timelineHeaders).find(".timeline-track--header").eq(index - 1).after(trackDisplayObj.header);
                $(Ensemble.Editor.UI.PageSections.lowerHalf.timelineDetails).find(".timeline-track--controls").eq(index - 1).after(trackDisplayObj.detail);
                $(Ensemble.Editor.UI.PageSections.lowerHalf.timelineTracks).find(".timeline-track--content").eq(index - 1).after(trackDisplayObj.content);
            }
            else {
                $(Ensemble.Editor.UI.PageSections.lowerHalf.timelineHeaders).find(".timeline-track--header").eq(index).before(trackDisplayObj.header);
                $(Ensemble.Editor.UI.PageSections.lowerHalf.timelineDetails).find(".timeline-track--controls").eq(index).before(trackDisplayObj.detail);
                $(Ensemble.Editor.UI.PageSections.lowerHalf.timelineTracks).find(".timeline-track--content").eq(index).before(trackDisplayObj.content);
            }
            this.refreshTrackNumbers();
            this._rebuildIndex();
            Ensemble.Editor.PlaybackMGR.sync();
        },

        removeTrack: function (trackId) {
            /// <summary>Removes the track with the given ID, unloading any clips it may contain.</summary>
            /// <param name="trackId" type="Number">An ID representing the track to be removed.</param>
            /// <returns type="Object">An object containing the track that was removed, as well as its original position in the array of tracks.</returns>
            $("#" + this._buildTrackHeaderId(trackId)).remove();
            $("#" + this._buildTrackDetailId(trackId)).remove();
            $("#" + this._buildTrackDOMId(trackId)).remove();
            let trackRemoved = null;
            for (var i = 0; i < this.tracks.length; i++) {
                if (this.tracks[i].id == trackId) {
                    trackRemoved = this.tracks.splice(i, 1)[0];
                    break;
                }
            }
            Ensemble.Session.projectTrackCount = this.tracks.length;
            this.refreshTrackNumbers();
            for (let i = 0; i < trackRemoved.clips.length; i++) {
                trackRemoved.clips[i].unload();
            }
            this._rebuildIndex();
            Ensemble.Editor.Renderer.requestFrame();
            return {
                track: trackRemoved,
                index: i
            };
        },

        moveClip: function (clipId, trackId, time) {
            /// <summary>Moves the clip with the given ID to the specified track and time.</summary>
            /// <param name="clipId" type="Number">The ID of the clip to move.</param>
            /// <param name="trackId" type="Number">The ID of the destination track.</param>
            /// <param name="time" type="Number">The destination time, in milliseconds.</param>

            let switchLayers = true;
            let clipEl = null;
            let clipObj = null;

            for (let i = 0; i < Ensemble.Editor.TimelineMGR.tracks.length; i++) {
                if (!switchLayers) break;
                for (let k = 0; k < Ensemble.Editor.TimelineMGR.tracks[i].clips.length; k++) {
                    if (Ensemble.Editor.TimelineMGR.tracks[i].clips[k].id == clipId) {
                        if (Ensemble.Editor.TimelineMGR.tracks[i].id == trackId) {
                            switchLayers = false;
                            clipObj = Ensemble.Editor.TimelineMGR.tracks[i].clips[k];
                            clipEl = document.getElementById(this._buildClipDOMId(clipId));
                            break;
                        }
                        else {
                            // TODO: extract the clip from the DOM.
                        }
                    }
                }
            }

            clipObj.startTime = time;
            clipEl.style.left = (time / Ensemble.Editor.TimelineZoomMGR.zoomLevels[Ensemble.Editor.TimelineZoomMGR.currentLevel].ratio) + "px";

            if (switchLayers) {
                // Reinsert the clip.
            }

            this._rebuildIndex();
            Ensemble.Editor.PlaybackMGR.sync();
        },

        removeClip: function (clipId) {
            /// <summary>Removes the clip with the given ID.</summary>
            /// <returns type="Object">An object containing Clip "clip" and Number "trackId"</returns>
            $("#" + this._buildClipDOMId(clipId)).remove();
            let clipRemoved = null;
            let trackIndex = null;
            let found = false;
            for (let i = 0; i < this.tracks.length; i++) {
                for (let k = 0; k < this.tracks[i].clips.length; k++) {
                    if (this.tracks[i].clips[k].id == clipId) {
                        clipRemoved = this.tracks[i].clips.splice(k, 1);
                        trackIndex = this.tracks[i].id;
                        found = true;
                        break;
                    }
                    if (found) break;
                }
                if (found) break;
            }
            clipRemoved[0].unload();
            this._rebuildIndex();
            Ensemble.Editor.Renderer.requestFrame();
            return {
                clip: clipRemoved[0],
                trackId: trackIndex
            };
        },

        addClipToTrack: function (clipObj, trackId, destinationTime) {
            /// <summary>Adds the given Clip to the track with the given ID.</summary>
            /// <param name="clipObj" type="Ensemble.Editor.Clip">The clip to add.</param>
            /// <param name="trackId" type="Number">The ID of the track in which to place the clip. In case of a collision, the TimelineMGR searches forward from the requested time for the first available empty slot large enough to contain the clip.</param>
            /// <param name="destinationTime" type="Number">The project time at which to insert the clip.</param>
            var targetTrack = this.getTrackById(trackId);
            var fits = targetTrack.clipCollisionAt(destinationTime, clipObj.duration);
            if (fits.collision) {
                var offendingClip = targetTrack.getClipById(fits.offending);
                clipObj.startTime = targetTrack.firstFreeSlot(offendingClip.startTime + offendingClip.duration, clipObj.duration);
            }
            targetTrack.insertClip(clipObj);

            let targetTrackEl = document.getElementById(this._buildTrackDOMId(targetTrack.id));
            let newClipEl = this._buildClipDisplay(clipObj);
            targetTrackEl.appendChild(newClipEl);

            this._rebuildIndex();
            Ensemble.Editor.PlaybackMGR.sync();
        },

        moveTrackWithId: function (trackId, origin, destination) {
            /// <summary>Moves the track with the given ID to the specified position in the track array.</summary>
            /// <param name="trackId" type="Number">The ID of the track to move.</param>
            /// <param name="origin" type="Number">The index of the position where the track begins its move.</param>
            /// <param name="destination" type="Number">The index of the position where the track should end up after the move.</param>

            let trackTransformPercentage = (destination - origin) * -100;
            let affectedTransformPercentage = 100;
            let affectedDif = -1;
            if (trackTransformPercentage > 0) {
                affectedTransformPercentage = -100;
                affectedDif = 1;
            }

            let trackHeader = $("#" + this._buildTrackHeaderId(trackId));
            let trackControl = $("#" + this._buildTrackDetailId(trackId));
            let trackItself = $("#" + this._buildTrackDOMId(trackId));

            let affected = [];
            var start = null,
                end = null;
            if (destination > origin) {
                start = origin + 1;
                end = destination + 1;
            }
            else {
                start = destination;
                end = origin;
            }
            for (let i = start; i < end; i++) {
                affected.push("#" + this._buildTrackHeaderId(this.tracks[i].id));
                affected.push("#" + this._buildTrackDetailId(this.tracks[i].id));
                affected.push("#" + this._buildTrackDOMId(this.tracks[i].id));
            }


            if (destination > origin) {
                // Insert the moving track after the last track
                $(trackHeader).insertAfter($("#" + this._buildTrackHeaderId(this.tracks[destination].id)));
                $(trackControl).insertAfter($("#" + this._buildTrackDetailId(this.tracks[destination].id)));
                $(trackItself).insertAfter($("#" + this._buildTrackDOMId(this.tracks[destination].id)));
            }
            else {
                // Insert the moving track before the track currently in that location
                $(trackHeader).insertBefore($("#" + this._buildTrackHeaderId(this.tracks[destination].id)));
                $(trackControl).insertBefore($("#" + this._buildTrackDetailId(this.tracks[destination].id)));
                $(trackItself).insertBefore($("#" + this._buildTrackDOMId(this.tracks[destination].id)));
            }

            var movingItem = this.tracks.splice(origin, 1)[0];
            this.tracks.splice(destination, 0, movingItem);
            this.refreshTrackNumbers();
            this._rebuildIndex();
            Ensemble.Editor.Renderer.requestFrame();
        },

        getTrackById: function (idval) {
            /// <summary>Returns the Track object with the given ID, provided it exists.</summary>
            /// <param name="idval" type="Number">The ID of the track to locate.</param>
            /// <returns type="Ensemble.Editor.Track">The matching track.</returns>
            for (var i=0; i<this.tracks.length; i++) {
                if (this.tracks[i].id == idval) return this.tracks[i];
            }
            return null;
        },

        getClipById: function (idval) {
            /// <summary>Returns the Clip with the given ID, provided it exists. Searches all tracks.</summary>
            /// <param name="idval" type="Number">The ID of the clip to locate.</param>
            /// <returns type="Ensemble.Editor.Clip">The matching clip.</returns>
            let foundClip = null;
            for (let i = 0; i < this.tracks.length; i++) {
                foundClip = this.tracks[i].getClipById(idval);
                if (foundClip && foundClip != null) {
                    break;
                }
            }
            return foundClip;
        },

        getTrackIndex: function (idval) {
            /// <summary>Returns the index of the track. Lower values indicate higher stack locations (0 meaning the track is on top).</summary>
            /// <returns type="Number">The position of the track in the array.</returns>
            return this.tracks.indexOf(Ensemble.Editor.TimelineMGR.getTrackById(idval));
        },

        updateTrackSizing: function () {
            /// <summary>Updates the timeline tracks to match the recently resized view.</summary>
            let maxTrackHeight = 75;
            let increment = maxTrackHeight;
            let sizeReached = false;
            let timelineHeight = $(Ensemble.Editor.UI.PageSections.lowerHalf.timeline).innerHeight();

            let numberOfTracksVisible = 1;
            while (!sizeReached) {
                if (timelineHeight > increment) {
                    numberOfTracksVisible++;
                    increment = increment + maxTrackHeight;
                }
                else {
                    sizeReached = true;
                    numberOfTracksVisible--;
                }
            }

            this._currentTrackHeight = timelineHeight / numberOfTracksVisible;
            $(".timeline-track").height(this._currentTrackHeight);
            this._snapScrollToNearestTrack();

            this.ui.trackContainer.style.background = "repeating-linear-gradient(#FFFFFF, #FFFFFF " + this._currentTrackHeight + "px, #F0F0F0 " + this._currentTrackHeight + "px, #F0F0F0 " + (2 * this._currentTrackHeight) + "px)";
            this.newRulerScale();
        },

        generateNewTrackId: function () {
            /// <summary>Generates a new, unique ID for a Track.</summary>
            /// <returns type="Number">A number to represent a Track ID.</returns>
            this._uniqueTrackID++;
            return this._uniqueTrackID - 1;
        },

        generateNewClipId: function () {
            /// <summary>Generates a new, unique ID for a Clip.</summary>
            /// <returns type="Number">A number to represent a Clip ID.</returns>
            this._uniqueClipID++;
            return this._uniqueClipID - 1;
        },

        newRulerScale: function () {
            /// <summary>Sets the scale used to display the timeline, its tracks and clips, and the timing ruler.</summary>
            let params = Ensemble.Editor.TimelineZoomMGR.zoomLevels[Ensemble.Editor.TimelineZoomMGR.currentLevel];

            let ratio = params.ratio;
            let interval = params.interval;
            let mark = params.mark;
            let sub = params.sub;

            let markWidth = mark / ratio;

            let displayTime = Ensemble.Editor.UI.PageSections.lowerHalf.timelineRuler.clientWidth * ratio;
            if (Ensemble.Session.projectDuration > displayTime) displayTime = Ensemble.Session.projectDuration;

            let cur = 0;
            let htmlStr = "";
            let timeStr = "";

            while (displayTime > cur) {
                htmlStr = htmlStr + "<span style='width: " + markWidth + "px' class='timeline-ruler__mark"
                if (cur > 0) {
                    //if (cur % mark === 0) console.log("Mark at " + cur);
                    if (cur % sub === 0) {
                        //console.log("Sub at " + cur);
                        htmlStr = htmlStr + " timeline-ruler__mark--sub";
                    }
                    if (cur % interval === 0) {
                        //console.log("Interval at " + cur);
                        htmlStr = htmlStr + " timeline-ruler__mark--interval";
                        timeStr = timeStr + "<span class='timeline-ruler__time' style='left: " + (cur / ratio) + "px'>" + Ensemble.Utilities.TimeConverter.timelineTime(cur) + "</span>";
                    }
                }
                htmlStr = htmlStr + "'></span>";
                cur = cur + mark;
            }
            //console.log("Finished determining intervals.");
            Ensemble.Editor.TimelineMGR.ui.timeRulerInner.innerHTML = htmlStr + timeStr;

            for (let i = 0; i < this.tracks.length; i++) {
                for (let k = 0; k < this.tracks[i].clips.length; k++) {
                    let clipEl = document.getElementById(this._buildClipDOMId(this.tracks[i].clips[k].id));
                    clipEl.style.width = (this.tracks[i].clips[k].duration / ratio) + "px";
                    clipEl.style.left = (this.tracks[i].clips[k].startTime / ratio) + "px";
                }
            }

            this.newCursorUpdate(Ensemble.Editor.PlaybackMGR.lastTime);
        },

        newCursorUpdate: function (time) {
            /// <summary>Updates the position of the timeline playback cursor.</summary>
            /// <param name="time" type="Number">The time position at which to display the cursor.</param>
            let pos = time / Ensemble.Editor.TimelineZoomMGR.zoomLevels[Ensemble.Editor.TimelineZoomMGR.currentLevel].ratio + "px"
            this.ui.timeCursor.style.left = pos;
            this.ui.timeRulerFlag.style.left = pos;
        },

        zoomIn: function () {
            /// <summary>Increases the zoom on the timeline display by one level.</summary>
            if (Ensemble.Editor.TimelineZoomMGR.canZoomIn()) {
                Ensemble.Editor.TimelineZoomMGR.zoomIn();
                Ensemble.Editor.TimelineMGR.newRulerScale();
                setTimeout(function () { Ensemble.FileIO.saveProject(); }, 0);
            }
        },

        zoomOut: function () {
            /// <summary>Decreases the zoom on the timeline display by one level.</summary>
            if (Ensemble.Editor.TimelineZoomMGR.canZoomOut()) {
                Ensemble.Editor.TimelineZoomMGR.zoomOut();
                Ensemble.Editor.TimelineMGR.newRulerScale();
                setTimeout(function () { Ensemble.FileIO.saveProject(); }, 0);
            }
        },

        scrollUp: function () {
            /// <summary>Scrolls the timeline up by one track.</summary>
            let currentTop = parseFloat($(".timeline-scrollable-container").css("margin-top"));
            if (currentTop < 0) {
                $(".timeline-scrollable-container").css("margin-top", (currentTop + Ensemble.Editor.TimelineMGR._currentTrackHeight) + "px");
                this.ui.trackContainer.style.backgroundPosition = "0 " + (currentTop + Ensemble.Editor.TimelineMGR._currentTrackHeight) + "px";
                Ensemble.Editor.TimelineMGR._currentScrollIndex = parseFloat($(".timeline-scrollable-container").css("margin-top")) / Ensemble.Editor.TimelineMGR._currentTrackHeight;
            }
        },

        scrollDown: function () {
            /// <summary>Scrolls the timeline down by one track.</summary>
            let currentTop = parseFloat($(".timeline-scrollable-container").css("margin-top"));
            $(".timeline-scrollable-container").css("margin-top", (currentTop - Ensemble.Editor.TimelineMGR._currentTrackHeight) + "px");
            this.ui.trackContainer.style.backgroundPosition = "0 " + (currentTop + Ensemble.Editor.TimelineMGR._currentTrackHeight) + "px";
            Ensemble.Editor.TimelineMGR._currentScrollIndex = parseFloat($(".timeline-scrollable-container").css("margin-top")) / Ensemble.Editor.TimelineMGR._currentTrackHeight;
        },

        _snapScrollToNearestTrack: function () {
            $(".timeline-scrollable-container").css("margin-top", this._currentScrollIndex * this._currentTrackHeight);
            this.ui.trackContainer.style.backgroundPosition = "0 " + (this._currentScrollIndex * this._currentTrackHeight) + "px";
        },

        toggleTrackDetails: function () {
            if ($(Ensemble.Editor.UI.PageSections.lowerHalf.timelineDetails).hasClass("detailsExpanded")) {
                $(Ensemble.Editor.UI.PageSections.lowerHalf.timelineDetails).removeClass("detailsExpanded")
                $(Ensemble.Editor.UI.PageSections.lowerHalf.timelineHeaderDetailPlaceholder).removeClass("detailsExpanded");
                $(".trackEditButton").html("&#xE126;");
            }
            else {
                $(Ensemble.Editor.UI.PageSections.lowerHalf.timelineDetails).addClass("detailsExpanded")
                $(Ensemble.Editor.UI.PageSections.lowerHalf.timelineHeaderDetailPlaceholder).addClass("detailsExpanded");
                $(".trackEditButton").html("&#xE127;");
            }
        },

        renameTrack: function (trackId, newName) {
            /// <summary>Renames the track with the given ID.</summary>
            /// <param name="trackId" type="Number">The ID of the track to rename.</param>
            /// <param name="newName" type="String">The name to give the track.</param>
            this.getTrackById(trackId).name = newName;
            $("#" + this._buildTrackDetailId(trackId)).find(".timelineDetailName").text(newName);
        },

        changeTrackVolume: function (trackId, newVolume) {
            /// <summary>Changes the volume of the track with the given ID.</summary>
            /// <param name="trackId" type="Number">The ID of the track.</param>
            /// <param name="newVolume" type="Number">The volume to assign the track.</param>
            Ensemble.Editor.TimelineMGR.getTrackById(trackId).setVolume(newVolume);
        },

        refreshTrackNumbers: function () {
            /// <summary>Refreshes the list of track header numbers to ensure they properly match their order.</summary>
            for (let i = 0; i < this.tracks.length; i++) {
                $("#" + this._buildTrackHeaderId(this.tracks[i].id)).find(".trackNum").text(i + 1);
            }
        },

        _buildClipDisplay: function (clip) {
            /// <param name="clip" type="Ensemble.Editor.Clip">The Clip to represent on the timeline.</param>
            /// <returns>A new DOM element representing the clip.</returns>

            let clipEl = document.createElement("div");
            clipEl.id = Ensemble.Editor.TimelineMGR._buildClipDOMId(clip.id);
            clipEl.className = "timeline-clip";
            clipEl.style.width = (clip.duration / Ensemble.Editor.TimelineZoomMGR.zoomLevels[Ensemble.Editor.TimelineZoomMGR.currentLevel].ratio) + "px";
            clipEl.style.left = (clip.startTime / Ensemble.Editor.TimelineZoomMGR.zoomLevels[Ensemble.Editor.TimelineZoomMGR.currentLevel].ratio) + "px";

            let thumbEl = document.createElement("img");
            thumbEl.className = "timeline-clip__thumb";

            let titleEl = document.createElement("div");
            let titleIcon = document.createElement("span");
            titleIcon.className = "timeline-clip__icon";
            titleIcon.innerHTML = clip.file.icon + "&nbsp;";

            let titleText = document.createElement("span");
            titleText.className = "timeline-clip__title";
            titleText.innerText = clip.name;

            titleEl.appendChild(titleIcon);
            titleEl.appendChild(titleText);

            clipEl.appendChild(thumbEl);
            clipEl.appendChild(titleEl);

            clipEl.addEventListener("pointerenter", Ensemble.Editor.TimelineMGR._listeners.pointerEnteredClip);
            clipEl.addEventListener("pointerleave", Ensemble.Editor.TimelineMGR._listeners.pointerLeftClip);
            clipEl.addEventListener("pointerdown", Ensemble.Editor.TimelineMGR._listeners.pointerDownOnClip);

            return clipEl;
        },

        _buildTrackDisplay: function (track, index) {
            /// <param name="track" type="Ensemble.Editor.Track">The track to represent on the timeline.</param>
            /// <param name="index" type="Number">The index of the track in the list of tracks.</param>
            /// <returns type="Object">An object with three parts: header, details, and content.</returns>

            var trackNumber = Ensemble.Editor.UI.PageSections.lowerHalf.timelineHeaders.childNodes.length + 1;
            if (index != null) trackNumber = index + 1;

            var trackHeight = this._currentTrackHeight + "px";

            var trackHeader = document.createElement("div");
            trackHeader.className = "timeline-track timeline-track--header";

            var trackNumEl = document.createElement("div");
            trackNumEl.className = "trackNum";
            trackNumEl.innerText = trackNumber.toString(10);

            var trackEditButtonEl = document.createElement("div");
            trackEditButtonEl.className = "trackEditButton";
            trackEditButtonEl.innerHTML = "&#xE126;";
            $(trackEditButtonEl).click(Ensemble.Editor.TimelineMGR.toggleTrackDetails);

            trackHeader.appendChild(trackNumEl);
            trackHeader.appendChild(trackEditButtonEl);
            trackHeader.style.height = trackHeight;
            trackHeader.id = this._buildTrackHeaderId(track.id);
            trackHeader.dataset.trackId = track.id;

            var trackDetail = document.createElement("div");
            trackDetail.className = "timeline-track timeline-track--controls";
            trackDetail.id = this._buildTrackDetailId(track.id);
            trackDetail.style.height = trackHeight;
            trackDetail.dataset.trackId = track.id;

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

            $(renameControl).click(this._trackRenameButtonClicked);
            $(volumeControl).click(this._trackVolumeButtonClicked);
            $(moveControl).click(this._trackMoveButtonClicked);
            $(deleteControl).click(this._trackDeleteButtonClicked);

            trackDetailControls.appendChild(renameControl);
            trackDetailControls.appendChild(volumeControl);
            trackDetailControls.appendChild(moveControl);
            trackDetailControls.appendChild(deleteControl);

            trackDetail.appendChild(trackDetailName);
            trackDetail.appendChild(trackDetailControls);

            var trackContent = document.createElement("div");
            trackContent.className = "timeline-track timeline-track--content";
            trackContent.style.height = trackHeight;
            trackContent.id = this._buildTrackDOMId(track.id);
            trackContent.dataset.trackId = track.id;
            return {
                header: trackHeader,
                detail: trackDetail,
                content: trackContent
            };
        },

        _buildTrackDOMId: function (idval) {
            return "timeline-track--content" + idval;
        },
        
        _buildTrackHeaderId: function (idval) {
            return "timeline-track--header" + idval;
        },

        _buildTrackDetailId: function (idval) {
            return "timeline-track--controls" + idval;
        },

        _buildClipDOMId: function (idval) {
            return "timeline__clip" + idval;
        },

        _showTrackControls: function (event) {
            console.log("Show the track controls flyout.");
            document.getElementById("timeline-track_controls-flyout").winControl.show(event.currentTarget, "right");
        },

        _trackRenameButtonClicked: function (event) {
            console.log("clicked.");
            var trackDetail = $(event.currentTarget).closest(".timeline-track--controls");
            var trackTitleSpace = $(trackDetail).find(".timelineDetailName");
            $(trackTitleSpace).attr("contenteditable", true);
            trackTitleSpace.focus();
            var range = document.body.createTextRange();
            range.moveToElementText(trackTitleSpace[0]);
            range.select();
            
            $(trackTitleSpace).blur(Ensemble.Editor.TimelineMGR._trackRenameFinish);
            $(trackTitleSpace).keydown(Ensemble.Editor.TimelineMGR._trackRenameKeydown);
        },

        _trackRenameFinish: function (event) {
            console.log("Finish rename.");
            var parentTrack = $(event.currentTarget).closest(".timeline-track--controls");
            var curId = parseInt($(parentTrack).attr("id").match(/\d+$/)[0]);
            var trackObj = Ensemble.Editor.TimelineMGR.getTrackById(curId);
            var renameAction = new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.renameTrack, 
                {
                    trackId: curId,
                    oldName: trackObj.name,
                    newName: event.currentTarget.innerText
                }
            )
            Ensemble.HistoryMGR.performAction(renameAction);
            $(event.currentTarget).unbind("blur");
            $(event.currentTarget).unbind("keydown");
            $(event.currentTarget).blur();
            $(event.currentTarget).removeAttr("contenteditable");
        },

        _trackRenameKeydown: function (event) {
            switch (event.keyCode) {
                case 13:
                    Ensemble.Editor.TimelineMGR._trackRenameFinish(event);
                    return false;
                case 27:
                    console.log("Cancel rename.");
                    var parentTrack = $(event.currentTarget).closest(".timeline-track--controls");
                    var trackId = parseInt($(parentTrack).attr("id").match(/\d+$/)[0]);
                    var trackObj = Ensemble.Editor.TimelineMGR.getTrackById(trackId);
                    event.currentTarget.innerText = trackObj.name;
                    $(event.currentTarget).unbind("blur");
                    $(event.currentTarget).unbind("keydown");
                    $(event.currentTarget).blur();
                    $(event.currentTarget).removeAttr("contenteditable");
                    return false;
            }
        },

        _trackVolumeButtonClicked: function (event) {
            var parentTrack = $(event.currentTarget).closest(".timeline-track--controls");
            var trackId = parseInt($(parentTrack).attr("id").match(/\d+$/)[0]);
            Ensemble.Editor.TimelineMGR._trackEditId = trackId;
            $(Ensemble.Editor.UI.UserInput.Flyouts.trackVolume).find("input").val(Ensemble.Editor.TimelineMGR.getTrackById(trackId).volume * 100);
            $(Ensemble.Editor.UI.UserInput.Flyouts.trackVolume).find("input").change(Ensemble.Editor.TimelineMGR._trackVolumeSliderChanged);
            $(Ensemble.Editor.UI.UserInput.Flyouts.trackVolume).bind("beforehide", Ensemble.Editor.TimelineMGR._trackVolumeChangeFinish);
            Ensemble.Editor.TimelineMGR._trackVolumeRollback = $(Ensemble.Editor.UI.UserInput.Flyouts.trackVolume).find("input").val() / 100;
            Ensemble.Editor.UI.UserInput.Flyouts.trackVolume.winControl.show(event.currentTarget);
        },

        _trackVolumeSliderChanged: function (event) {
            console.log("Volume slider slid.");
            // TODO: additional logic to facilitate live volume adjustment
        },

        _trackVolumeChangeFinish: function (event) {
            // commit volume change on flyout hide.
            $(Ensemble.Editor.UI.UserInput.Flyouts.trackVolume).unbind("beforehide", Ensemble.Editor.TimelineMGR._trackVolumeChangeFinish);
            $(Ensemble.Editor.UI.UserInput.Flyouts.trackVolume).find("input").unbind("change", Ensemble.Editor.TimelineMGR._trackVolumeSliderChanged);
            if (($(Ensemble.Editor.UI.UserInput.Flyouts.trackVolume).find("input").val() / 100) != Ensemble.Editor.TimelineMGR._trackVolumeRollback) {
                var volumeChangeAction = new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.trackVolumeChanged,
                    {
                        trackId: Ensemble.Editor.TimelineMGR._trackEditId,
                        oldVolume: Ensemble.Editor.TimelineMGR._trackVolumeRollback,
                        newVolume: $(Ensemble.Editor.UI.UserInput.Flyouts.trackVolume).find("input").val() / 100
                    }
                );
                Ensemble.HistoryMGR.performAction(volumeChangeAction);
            }
        },

        _trackMoveButtonClicked: function (event) {
            //Determine which track's button has been pressed and enable/disable the appropriate move targets.
            var parentTrack = $(event.currentTarget).closest(".timeline-track--controls");
            Ensemble.Editor.TimelineMGR._trackEditId = parseInt($(parentTrack).attr("id").match(/\d+$/)[0]);
            var top = true,
                up = true,
                down = true,
                bottom = true;
            var indexOfTrack = Ensemble.Editor.TimelineMGR.getTrackIndex(Ensemble.Editor.TimelineMGR._trackEditId);

            if (indexOfTrack == 0) {
                top = false;
                up = false;
            }
            if (indexOfTrack == Ensemble.Editor.TimelineMGR.tracks.length - 1) {
                down = false;
                bottom = false;
            }

            Ensemble.Editor.UI.UserInput.Buttons.moveTrackToTop.winControl.disabled = !(top);
            Ensemble.Editor.UI.UserInput.Buttons.moveTrackUp.winControl.disabled = !(up);
            Ensemble.Editor.UI.UserInput.Buttons.moveTrackDown.winControl.disabled = !(down);
            Ensemble.Editor.UI.UserInput.Buttons.moveTrackToBottom.winControl.disabled = !(bottom);

            $(Ensemble.Editor.UI.UserInput.Buttons.moveTrackToTop).click(Ensemble.Editor.TimelineMGR._moveCurrentTrackToTop);
            $(Ensemble.Editor.UI.UserInput.Buttons.moveTrackUp).click(Ensemble.Editor.TimelineMGR._moveCurrentTrackUp);
            $(Ensemble.Editor.UI.UserInput.Buttons.moveTrackDown).click(Ensemble.Editor.TimelineMGR._moveCurrentTrackDown);
            $(Ensemble.Editor.UI.UserInput.Buttons.moveTrackToBottom).click(Ensemble.Editor.TimelineMGR._moveCurrentTrackToBottom);

            $(Ensemble.Editor.UI.UserInput.Flyouts.moveTrack.winControl).bind("afterhide", Ensemble.Editor.TimelineMGR._unbindTrackMoveListeners);
            Ensemble.Editor.UI.UserInput.Flyouts.moveTrack.winControl.show(event.currentTarget);
        },

        _moveCurrentTrackToTop: function (event) {
            console.log("Moving track " + Ensemble.Editor.TimelineMGR.getTrackById(Ensemble.Editor.TimelineMGR._trackEditId).id + " to the top.");
            Ensemble.Editor.TimelineMGR._finishTrackMove(0);
        },

        _moveCurrentTrackUp: function (event) {
            console.log("Moving track " + Ensemble.Editor.TimelineMGR.getTrackById(Ensemble.Editor.TimelineMGR._trackEditId).id + " up one level.");
            var destination = Ensemble.Editor.TimelineMGR.getTrackIndex(Ensemble.Editor.TimelineMGR._trackEditId) - 1;
            Ensemble.Editor.TimelineMGR._finishTrackMove(destination);
        },

        _moveCurrentTrackDown: function (event) {
            console.log("Moving track " + Ensemble.Editor.TimelineMGR.getTrackById(Ensemble.Editor.TimelineMGR._trackEditId).id + " down one level.");
            var destination = Ensemble.Editor.TimelineMGR.getTrackIndex(Ensemble.Editor.TimelineMGR._trackEditId) + 1;
            Ensemble.Editor.TimelineMGR._finishTrackMove(destination);
        },

        _moveCurrentTrackToBottom: function (event) {
            console.log("Moving track " + Ensemble.Editor.TimelineMGR.getTrackById(Ensemble.Editor.TimelineMGR._trackEditId).id + " to the bottom.");
            Ensemble.Editor.TimelineMGR._finishTrackMove(Ensemble.Editor.TimelineMGR.tracks.length - 1);
        },

        _unbindTrackMoveListeners: function (event) {
            $(Ensemble.Editor.UI.UserInput.Buttons.moveTrackToTop).unbind("click");
            $(Ensemble.Editor.UI.UserInput.Buttons.moveTrackUp).unbind("click");
            $(Ensemble.Editor.UI.UserInput.Buttons.moveTrackDown).unbind("click");
            $(Ensemble.Editor.UI.UserInput.Buttons.moveTrackToBottom).unbind("click");
            $(Ensemble.Editor.UI.UserInput.Flyouts.moveTrack.winControl).unbind("afterhide");
        },

        _finishTrackMove: function (destinationIndex) {
            Ensemble.Editor.TimelineMGR._unbindTrackMoveListeners();
            var trackMoveOption = new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.moveTrack,
                {
                    trackId: Ensemble.Editor.TimelineMGR._trackEditId,
                    origin: Ensemble.Editor.TimelineMGR.tracks.indexOf(Ensemble.Editor.TimelineMGR.getTrackById(Ensemble.Editor.TimelineMGR._trackEditId)),
                    destination: destinationIndex
                }
            );
            Ensemble.HistoryMGR.performAction(trackMoveOption);
        },

        _trackDeleteButtonClicked: function (event) {
            console.log("Delete button pressed.");
            let parentTrack = $(event.currentTarget).closest(".timeline-track--controls");
            Ensemble.Editor.TimelineMGR._trackEditId = parseInt($(parentTrack).attr("id").match(/\d+$/)[0]);
            let track = Ensemble.Editor.TimelineMGR.getTrackById(Ensemble.Editor.TimelineMGR._trackEditId);

            Ensemble.Editor.UI.TextFields.removeTrackConfirmationName.innerText = track.name;
            $(Ensemble.Editor.UI.UserInput.Buttons.confirmRemoveTrack).click(Ensemble.Editor.TimelineMGR._finishTrackDelete)
            $(Ensemble.Editor.UI.UserInput.Flyouts.trackRemove.winControl).bind("afterhide", Ensemble.Editor.TimelineMGR._unbindTrackDeleteListeners);

            Ensemble.Editor.UI.UserInput.Flyouts.trackRemove.winControl.show(event.currentTarget, "auto");
            //if (track.clips.length > 1) {
            //    // Show the delete track confirmation flyout.
            //}
            //else {
            //    // Track is empty. Just go ahead and delete it.
            //    Ensemble.Editor.TimelineMGR.removeTrack(Ensemble.Editor.TimelineMGR._trackEditId);
            //}
        },

        _unbindTrackDeleteListeners: function () {
            $(Ensemble.Editor.UI.UserInput.Buttons.confirmRemoveTrack).unbind("click");
            $(Ensemble.Editor.UI.UserInput.Flyouts.trackRemove.winControl).unbind("afterhide");
        },

        _finishTrackDelete: function () {
            Ensemble.Editor.UI.UserInput.Flyouts.trackRemove.winControl.hide();
            let trackDeleteAction = new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.removeTrack,
                {
                    trackId: Ensemble.Editor.TimelineMGR._trackEditId,
                    trackObj: null
                }
            );
            Ensemble.HistoryMGR.performAction(trackDeleteAction);
        },

        _showSelectionCallout: function (event) {
            let clip = document.getElementById(Ensemble.Editor.TimelineMGR._buildClipDOMId(Ensemble.Editor.SelectionMGR.selected[0]));
            let pos = $(clip).offset();
            Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout.style.top = pos.top + "px";
            Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout.style.left = event.pageX + "px";
            Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout.style.visibility = "visible";
            $(Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout).addClass("timeline-selection-callout--animatable");

            let commands = document.getElementsByClassName("selection-callout__command");
            for (let i = 0; i < commands.length; i++) {
                if (commands[i].dataset.calloutCommand == "move-clip") commands[i].addEventListener("pointerdown", Ensemble.Editor.TimelineMGR._listeners.calloutMoveClipPointerDown);
                else commands[i].addEventListener("click", Ensemble.Editor.TimelineMGR._listeners.selectionCalloutButtonClicked);
            }
        },

        _hideSelectionCallout: function () {
            Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout.style.visibility = "";
            $(Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout).removeClass("timeline-selection-callout--animatable");
            let commands = document.getElementsByClassName("selection-callout__command");
            for (let i = 0; i < commands.length; i++) {
                if (commands[i].dataset.calloutCommand == "move-clip") commands[i].removeEventListener("pointerdown", Ensemble.Editor.TimelineMGR._listeners.calloutMoveClipPointerDown);
                else commands[i].removeEventListener("click", Ensemble.Editor.TimelineMGR._listeners.selectionCalloutButtonClicked);
            }
        },



        ui: {
            buttonScrollUp: null,
            buttonScrollDown: null,
            buttonZoomIn: null,
            buttonZoomOut: null,
            buttonNewTrack: null,
            timeCursor: null,
            timeCursorPreview: null,
            trackContainer: null,
            scrollableContainer: null,
            timeRuler: null,
            timeRulerInner: null,
            timeRulerFlag: null,
            timelineSelectionCallout: null,
            timelineSelectionContextMenu: null
        },

        _refreshUI: function () {
            this.ui.buttonScrollUp = document.getElementById("editorTimelineScrollUpButton");
            this.ui.buttonScrollDown = document.getElementById("editorTimelineScrollDownButton");
            this.ui.buttonZoomIn = document.getElementById("editorTimelineZoomInButton");
            this.ui.buttonZoomOut = document.getElementById("editorTimelineZoomOutButton");
            this.ui.buttonNewTrack = document.getElementById("editorTimelineAddTrackButton");
            this.ui.timeCursor = document.getElementsByClassName("timeline__cursor")[0];
            this.ui.timeCursorPreview = document.getElementsByClassName("editorTimelineDragPreviewFlyout")[0];
            this.ui.trackContainer = document.getElementById("timeline-track-container");
            this.ui.scrollableContainer = document.getElementsByClassName("timeline-track-container-wrap")[0];
            this.ui.timeRuler = document.getElementById("editorTimelineRulerContent");
            this.ui.timeRulerInner = document.getElementsByClassName("timeline-ruler__inner")[0];
            this.ui.timeRulerFlag = document.getElementsByClassName("timeline-ruler__flag")[0];
            this.ui.timelineSelectionCallout = document.getElementsByClassName("timeline-selection-callout")[0];
            this.ui.timelineSelectionContextMenu = document.getElementById("clip-selected-contextmenu");

            this.ui.buttonScrollUp.addEventListener("click", this._listeners.buttonScrollUp);
            this.ui.buttonScrollDown.addEventListener("click", this._listeners.buttonScrollDown);
            this.ui.buttonZoomIn.addEventListener("click", this._listeners.buttonZoomIn);
            this.ui.buttonZoomOut.addEventListener("click", this._listeners.buttonZoomOut);
            this.ui.buttonNewTrack.addEventListener("click", this._listeners.buttonNewTrack);
            this.ui.timeCursor.addEventListener("pointerdown", this._listeners.timeCursorMousedown);
            this.ui.timeRulerFlag.addEventListener("pointerdown", this._listeners.timeCursorMousedown);
            this.ui.trackContainer.addEventListener("pointerdown", this._listeners.timelineTrackContainerPointerDown);
            this.ui.scrollableContainer.addEventListener("scroll", this._listeners.timelineScrolled);
        },

        _cleanUI: function () {
            this.ui.buttonScrollUp.removeEventListener("click", this._listeners.buttonScrollUp);
            this.ui.buttonScrollDown.removeEventListener("click", this._listeners.buttonScrollDown);
            this.ui.buttonZoomIn.removeEventListener("click", this._listeners.buttonZoomIn);
            this.ui.buttonZoomOut.removeEventListener("click", this._listeners.buttonZoomOut);
            this.ui.buttonNewTrack.removeEventListener("click", this._listeners.buttonNewTrack);
            this.ui.timeCursor.removeEventListener("pointerdown", this._listeners.timeCursorMousedown);
            this.ui.timeRulerFlag.removeEventListener("pointerdown", this._listeners.timeCursorMousedown);
            this.ui.scrollableContainer.addEventListener("scroll", this._listeners.timelineScrolled);

            this.ui.buttonScrollUp = null;
            this.ui.buttonScrollDown = null;
            this.ui.buttonZoomIn = null;
            this.ui.buttonZoomOut = null;
            this.ui.buttonNewTrack = null;
            this.ui.timeCursor = null;
            this.ui.timeCursorPreview = null;
            this.ui.trackContainer = null;
            this.ui.scrollableContainer = null;
            this.ui.timeRuler = null;
            this.ui.timeRulerInner = null;
            this.ui.timeRulerFlag = null;
            this.ui.timelineSelectionCallout = null;
            this.ui.timelineSelectionContextMenu = null;
        },

        _rebuildIndex: function () {
            /// <summary>Rebuilds the index used as a target by the Renderer and the PlaybackMGR. WARNING: not safe to call during playback.</summary>
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
            this._timeIndex = _.clone(timeList);

            for (let i = 0; i < timeList.length; i++) {
                timeList[i] = {
                    time: timeList[i],
                    starting: [],
                    stopping: [],
                    renderList: []
                };
                for (let k = 0; k < this.tracks.length; k++) {
                    for (let g = 0; g < this.tracks[k].clips.length; g++) {
                        let tempClip = this.tracks[k].clips[g];
                        if (tempClip.startTime === timeList[i].time) timeList[i].starting.push(tempClip);
                        if (tempClip.startTime + tempClip.duration === timeList[i].time) timeList[i].stopping.push(tempClip);
                        if ((tempClip.startTime <= timeList[i].time) && (timeList[i].time < tempClip.startTime + tempClip.duration)) timeList[i].renderList.push(tempClip);
                    }
                }
            }
            this._clipIndex = timeList;
            if (this._clipIndex.length > 0) Ensemble.Session.projectDuration = this._clipIndex[this._clipIndex.length - 1].time;
            else Ensemble.Session.projectDuration = 0;
            Ensemble.Editor.PlaybackMGR.primeTimer();
        },

        _listeners: {
            buttonScrollUp: function (event) {
                Ensemble.Editor.TimelineMGR.scrollUp();
            },

            buttonScrollDown: function (event) {
                Ensemble.Editor.TimelineMGR.scrollDown();
            },

            buttonZoomIn: function (event) {
                Ensemble.Editor.TimelineMGR.zoomIn();
            },

            buttonZoomOut: function (event) {
                Ensemble.Editor.TimelineMGR.zoomOut();
            },

            buttonNewTrack: function (event) {
                var action = new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.createTrack);
                Ensemble.HistoryMGR.performAction(action);
            },

            timeCursorMousedown: function (event) {
                if (!Ensemble.Editor.PlaybackMGR.playing) {
                    event.stopPropagation();

                    Ensemble.KeyboardMGR.editorTimelineCursorDrag();
                    $("#editorTimelineEWClickEater").removeClass("editorClickEaterFaded");

                    let allClips = document.getElementsByClassName("timeline-clip");
                    for (let i = 0; i < allClips.length; i++) {
                        allClips[i].removeEventListener("pointerenter", Ensemble.Editor.TimelineMGR._listeners.pointerEnteredClip);
                        allClips[i].removeEventListener("pointerleave", Ensemble.Editor.TimelineMGR._listeners.pointerLeftClip);
                    }

                    Ensemble.Editor.TimelineMGR._timeCursorDragOffset = event.offsetX;
                    Ensemble.Editor.TimelineMGR._timeCursorLastMousPos = event.pageX;
                    Ensemble.Editor.TimelineMGR._timeCursorInitialPos = parseInt(Ensemble.Editor.TimelineMGR.ui.timeCursor.style.left, 10);
                    Ensemble.Editor.TimelineMGR._timeCursorDisplayScale = Ensemble.Editor.TimelineZoomMGR.zoomLevels[Ensemble.Editor.TimelineZoomMGR.currentLevel].ratio;

                    let cursorScreenPos = event.pageX - event.offsetX;
                    let cursorOffset = cursorScreenPos - Ensemble.Editor.TimelineMGR._timeCursorInitialPos;

                    Ensemble.Editor.TimelineMGR._timeCursorDragOffset = Ensemble.Editor.TimelineMGR._timeCursorDragOffset + cursorOffset;

                    let rulerPos = Math.floor($("#editorTimelineRulerContainer").position().top);
                    Ensemble.Editor.TimelineMGR.ui.timeCursorPreview.style.top = (rulerPos + 5) + "px";
                    Ensemble.Editor.TimelineMGR.ui.timeCursorPreview.style.left = Ensemble.Editor.TimelineMGR._timeCursorLastMousPos - (0.5 * Ensemble.Editor.TimelineMGR.ui.timeCursorPreview.offsetWidth) + "px";
                    Ensemble.Editor.TimelineMGR.ui.timeCursorPreview.style.visibility = "visible";

                    document.addEventListener("pointermove", Ensemble.Editor.TimelineMGR._listeners.timeCursorDragUpdate);
                    document.addEventListener("pointerup", Ensemble.Editor.TimelineMGR._listeners.timeCursorDragFinished);

                    Ensemble.Editor.TimelineMGR._timeCursorDragging = true;
                    requestAnimationFrame(Ensemble.Editor.TimelineMGR._listeners.updateTimeCursorDragPos);
                }
            },

            timeCursorDragUpdate: function (event) {
                event.stopPropagation();
                Ensemble.Editor.TimelineMGR._timeCursorLastMousPos = event.pageX;
            },

            timeCursorDragFinished: function (event) {
                event.stopPropagation();
                document.removeEventListener("pointermove", Ensemble.Editor.TimelineMGR._listeners.timeCursorDragUpdate);
                document.removeEventListener("pointerup", Ensemble.Editor.TimelineMGR._listeners.timeCursorDragFinished);
                $("#editorTimelineEWClickEater").addClass("editorClickEaterFaded");
                Ensemble.Editor.TimelineMGR._timeCursorDragging = false;
                Ensemble.KeyboardMGR.editorDefault();

                let allClips = document.getElementsByClassName("timeline-clip");
                for (let i = 0; i < allClips.length; i++) {
                    allClips[i].addEventListener("pointerenter", Ensemble.Editor.TimelineMGR._listeners.pointerEnteredClip);
                    allClips[i].addEventListener("pointerleave", Ensemble.Editor.TimelineMGR._listeners.pointerLeftClip);
                }
            },

            updateTimeCursorDragPos: function (event) {
                let candidatePos = Ensemble.Editor.TimelineMGR._timeCursorLastMousPos - Ensemble.Editor.TimelineMGR._timeCursorDragOffset;
                if (0 > candidatePos) candidatePos = 0;
                let candidateTime = candidatePos * Ensemble.Editor.TimelineMGR._timeCursorDisplayScale;

                if (Ensemble.Editor.TimelineMGR._timeCursorLastFinalPos != candidatePos) {
                    Ensemble.Editor.TimelineMGR._timeCursorLastFinalPos = candidatePos;
                    Ensemble.Editor.TimelineMGR.ui.timeCursor.style.left = candidatePos + "px";
                    Ensemble.Editor.TimelineMGR.ui.timeRulerFlag.style.left = candidatePos + "px";
                    Ensemble.Editor.TimelineMGR.ui.timeCursorPreview.style.left = Ensemble.Editor.TimelineMGR._timeCursorLastMousPos - (0.5 * Ensemble.Editor.TimelineMGR.ui.timeCursorPreview.offsetWidth) + "px";
                    Ensemble.Editor.TimelineMGR.ui.timeCursorPreview.innerText = Ensemble.Utilities.TimeConverter.convertTime(candidateTime);
                }

                if (Ensemble.Editor.TimelineMGR._timeCursorDragging) requestAnimationFrame(Ensemble.Editor.TimelineMGR._listeners.updateTimeCursorDragPos);
                else {
                    // finalize drag position and seek project
                    Ensemble.Editor.PlaybackMGR.seek(candidateTime);
                    Ensemble.Editor.TimelineMGR._timeCursorLastFinalPos = -1;
                    Ensemble.Editor.TimelineMGR.ui.timeCursorPreview.style.visibility = "";
                }
            },
            
            pointerEnteredClip: function (event) {
                let clipId = parseInt(event.currentTarget.id.match(/\d+$/)[0], 10);
                Ensemble.Editor.SelectionMGR.addToHovering(clipId);
            },

            pointerLeftClip: function (event) {
                let clipId = parseInt(event.currentTarget.id.match(/\d+$/)[0], 10);
                Ensemble.Editor.SelectionMGR.removeFromHovering(clipId);
            },

            pointerDownOnClip: function (event) {
                event.stopPropagation();
                let clipId = parseInt(event.currentTarget.id.match(/\d+$/)[0], 10);
                console.log("Pointer down on clip " + clipId + "!");

                if (event.shiftKey) {
                    //Ensemble.Editor.SelectionMGR.addToSelection(clipId);
                }
                else {
                    Ensemble.Editor.SelectionMGR.replaceSelection(clipId);
                }

                if (Ensemble.Editor.SelectionMGR.selected.length > 1) {
                    Ensemble.Editor.TimelineMGR._hideSelectionCallout();
                }
                else {
                    Ensemble.Editor.TimelineMGR._showSelectionCallout(event);
                }

                if (event.button == 2) {
                    event.stopPropagation();
                    event.preventDefault();
                    let commands = document.getElementsByClassName("selection-callout__command");
                    setTimeout(function () {
                        Ensemble.Editor.TimelineMGR.ui.timelineSelectionContextMenu.winControl.show(commands[commands.length - 1]);
                    }, 100);
                }
                return false;
            },

            timelineTrackContainerPointerDown: function (event) {
                Ensemble.Editor.SelectionMGR.clearSelection();
                Ensemble.Editor.TimelineMGR._hideSelectionCallout();
            },

            timelineScrolled: function (event) {
                Ensemble.Editor.TimelineMGR.ui.timeRuler.scrollLeft = Ensemble.Editor.TimelineMGR.ui.scrollableContainer.scrollLeft;
            },

            selectionCalloutButtonClicked: function (event) {
                if (event.currentTarget.dataset.calloutCommand == "context-menu") Ensemble.Editor.TimelineMGR.ui.timelineSelectionContextMenu.winControl.show(event.currentTarget);
                else console.log("Unidentified callout command.");
            },

            calloutMoveClipPointerDown: function (event) {
                if (!Ensemble.Editor.PlaybackMGR.playing) {
                    event.stopPropagation();

                    Ensemble.KeyboardMGR.editorTimelineCursorDrag();
                   
                    Ensemble.Editor.TimelineMGR._clipDragPointerOriginalLeft = event.pageX;
                    Ensemble.Editor.TimelineMGR._clipDragPointerCurrentLeft = event.pageX;

                    for (let i = 0; i < Ensemble.Editor.SelectionMGR.selected.length; i++) {
                        let origEl = document.getElementById(Ensemble.Editor.TimelineMGR._buildClipDOMId(Ensemble.Editor.SelectionMGR.selected[i]));
                        let ghostEl = document.createElement("div");
                        ghostEl.className = "timeline-clip-ghost";
                        ghostEl.style.width = origEl.style.width;
                        ghostEl.style.height = Ensemble.Editor.TimelineMGR._currentTrackHeight + "px";
                        ghostEl.style.top = $(origEl).closest(".timeline-track--content").position().top + "px";
                        ghostEl.style.left = $(origEl).position().left + "px";
                        ghostEl.dataset.origLeft = ghostEl.style.left;
                        ghostEl.dataset.origTop = ghostEl.style.top;
                        ghostEl.dataset.clipId = Ensemble.Editor.SelectionMGR.selected[i];
                        document.getElementById("editorTimelineTracks").appendChild(ghostEl);
                    }

                    document.addEventListener("pointermove", Ensemble.Editor.TimelineMGR._listeners.clipDragCursorUpdate);
                    document.addEventListener("pointerup", Ensemble.Editor.TimelineMGR._listeners.clipDragFinished);

                    $(Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout).removeClass("timeline-selection-callout--animatable");
                    Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout.dataset.origLeft = Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout.style.left;

                    Ensemble.Editor.TimelineMGR._clipDragging = true;
                    requestAnimationFrame(Ensemble.Editor.TimelineMGR._listeners.updateDraggedClipPosition);
                }
            },

            clipDragCursorUpdate: function (event) {
                event.stopPropagation();
                Ensemble.Editor.TimelineMGR._clipDragPointerCurrentLeft = event.pageX;
            },

            updateDraggedClipPosition: function (event) {
                let dif = Ensemble.Editor.TimelineMGR._clipDragPointerCurrentLeft - Ensemble.Editor.TimelineMGR._clipDragPointerOriginalLeft;
                let ghosts = document.getElementsByClassName("timeline-clip-ghost");
                for (let i = 0; i < ghosts.length; i++) {
                    let candidateLeft = parseFloat(ghosts[i].dataset.origLeft, 10) + dif;
                    if (0 > candidateLeft) candidateLeft = 0;
                    ghosts[i].style.left = candidateLeft + "px";                   
                }
                Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout.style.left = parseFloat(Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout.dataset.origLeft, 10) + dif + "px";

                if (Ensemble.Editor.TimelineMGR._clipDragging) requestAnimationFrame(Ensemble.Editor.TimelineMGR._listeners.updateDraggedClipPosition);
                else {
                    let zoomRatio = Ensemble.Editor.TimelineZoomMGR.zoomLevels[Ensemble.Editor.TimelineZoomMGR.currentLevel].ratio;
                    let clipsToMove = [];
                    let destinationTimes = [];
                    let destinationTracks = [];
                    let originalTimes = [];
                    let originalTracks = [];
                    for (let i = 0; i < ghosts.length; i++) {
                        let clipId = parseInt(ghosts[i].dataset.clipId, 10);
                        let origClip = Ensemble.Editor.TimelineMGR.getClipById(clipId);
                        clipsToMove.push(clipId);
                        destinationTimes.push(Math.floor(parseFloat(ghosts[i].style.left, 10) * zoomRatio));
                        destinationTracks.push(parseFloat(ghosts[i].style.top, 10) / Ensemble.Editor.TimelineMGR._currentTrackHeight);
                        originalTimes.push(origClip.startTime);
                        originalTracks.push(parseFloat(ghosts[i].dataset.origTop, 10) / Ensemble.Editor.TimelineMGR._currentTrackHeight);
                        ghosts[i].parentNode.removeChild(ghosts[i]);
                    }
                    $(Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout).addClass("timeline-selection-callout--animatable");
                    
                    let moveAction = new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.moveClip, {
                        clipIds: clipsToMove,
                        destinationTimes: destinationTimes,
                        destinationTracks: destinationTracks,
                        originalTimes: originalTimes,
                        originalTracks: originalTracks
                    });

                    Ensemble.HistoryMGR.performAction(moveAction);
                }
            },

            clipDragFinished: function (event) {
                event.stopPropagation();
                document.removeEventListener("pointermove", Ensemble.Editor.TimelineMGR._listeners.clipDragCursorUpdate);
                document.removeEventListener("pointerup", Ensemble.Editor.TimelineMGR._listeners.clipDragFinished);
                Ensemble.Editor.TimelineMGR._clipDragging = false;
                Ensemble.KeyboardMGR.editorDefault();
            }
        }
    });
})();