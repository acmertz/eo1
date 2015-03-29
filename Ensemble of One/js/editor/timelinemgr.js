(function () {
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

        _clipTrimming: false,
        _trimGripperArr: [],
        _trimMaxDur: 0,
        _trimMinStart: 0,
        _trimMaxEnd: 0,
        _trimStartBound: 0,
        _trimEndBound: 0,

        _clipDragPrimeTimer: null,
        _lastMouseDragEvent: null,
        _clipDragging: false,
        _clipDragArr: [],
        _ghostDragArr: [],
        _clipDragPointerOriginalLeft: 0,
        _clipDragPointerCurrentLeft: 0,
        _clipDragPointerOriginalTop: 0,
        _clipDragPointerCurrentTop: 0,
        _clipDragSnapBefore: null,
        _clipDragSnapAfter: null,

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

            let continueSearch = true;
            let switchLayers = false;
            let clipEl = null;
            let clipObj = null;

            for (let i = 0; i < Ensemble.Editor.TimelineMGR.tracks.length; i++) {
                if (!continueSearch) break;
                for (let k = 0; k < Ensemble.Editor.TimelineMGR.tracks[i].clips.length; k++) {
                    if (Ensemble.Editor.TimelineMGR.tracks[i].clips[k].id == clipId) {
                        if (Ensemble.Editor.TimelineMGR.tracks[i].id == trackId) {
                            continueSearch = false;
                            clipObj = Ensemble.Editor.TimelineMGR.tracks[i].clips[k];
                            clipEl = document.getElementById(this._buildClipDOMId(clipId));
                            break;
                        }
                        else {
                            // TODO: extract the clip from the DOM.
                            clipObj = Ensemble.Editor.TimelineMGR.tracks[i].clips.splice(k, 1)[0];
                            let tempEl = document.getElementById(Ensemble.Editor.TimelineMGR._buildClipDOMId(clipObj.id));
                            clipEl = tempEl.parentElement.removeChild(tempEl);
                            continueSearch = false;
                            switchLayers = true;
                            break;
                        }
                    }
                }
            }

            clipObj.startTime = time;
            clipEl.style.left = (time / Ensemble.Editor.TimelineZoomMGR.zoomLevels[Ensemble.Editor.TimelineZoomMGR.currentLevel].ratio) + "px";

            if (switchLayers) {
                // Reinsert the clip.
                Ensemble.Editor.TimelineMGR.getTrackById(trackId).insertClip(clipObj);
                document.getElementById(Ensemble.Editor.TimelineMGR._buildTrackDOMId(trackId)).appendChild(clipEl);
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

        trimClip: function (clipId, startTime, dur, startTrim, endTrim) {
            /// <summary>Trims the clip with the given ID to the given parameters.</summary>
            /// <param name="clipId" type="Number">The ID of the clip to trim.</param>
            /// <param name="startTime" type="Number">The new start time of the clip.</param>
            /// <param name="dur" type="Number">The new duration of the clip.</param>
            /// <param name="startTrim" type="Number">The new start trim of the clip.</param>
            /// <param name="endTrim" type="Number">The new end trim of the clip.</param>
            let clipObj = Ensemble.Editor.TimelineMGR.getClipById(clipId);
            let clipEl = document.getElementById(Ensemble.Editor.TimelineMGR._buildClipDOMId(clipId));
            let zoomRatio = Ensemble.Editor.TimelineZoomMGR.zoomLevels[Ensemble.Editor.TimelineZoomMGR.currentLevel].ratio;

            clipObj.startTime = startTime;
            clipObj.duration = dur;
            clipObj.startTrim = startTrim;
            clipObj.endTrim = endTrim;

            clipEl.style.left = (startTime / zoomRatio) + "px";
            clipEl.style.width = (dur / zoomRatio) + "px";

            Ensemble.Editor.TimelineMGR._rebuildIndex();
            Ensemble.Editor.Renderer.requestFrame();
        },

        closestCompatibleTimes: function (target, starts, durations, tracks) {
            /// <summary>Finds the closest time compatible with the specified start times and durations across the given tracks.</summary>
            /// <param name="target" type="Number">The number from which to compute time.</param>
            /// <param name="starts" type="Array">An array of start times.</param>
            /// <param name="durations" type="Array">An array of durations.</param>
            /// <param name="tracks" type="Array">An array of track IDs.</param>
            /// <returns type="Object">An object containing the two closest times, in the following format: {before: [], after: []}</returns>
        },

        addClipToTrack: function (clipObj, trackId, destinationTime) {
            /// <summary>Adds the given Clip to the track with the given ID.</summary>
            /// <param name="clipObj" type="Ensemble.Editor.Clip">The clip to add.</param>
            /// <param name="trackId" type="Number">The ID of the track in which to place the clip. In case of a collision, the TimelineMGR searches forward from the requested time for the first available empty slot large enough to contain the clip.</param>
            /// <param name="destinationTime" type="Number">The project time at which to insert the clip.</param>
            var targetTrack = this.getTrackById(trackId);
            var fits = targetTrack.clipCollisionAt(destinationTime, clipObj.duration);
            if (fits.collision) {
                let offendingClip = targetTrack.getClipById(fits.offending);
                let slotsAfter = targetTrack.freeSlotsAfter(offendingClip, clipObj);
                clipObj.startTime = slotsAfter[0];
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

        showTrimControls: function (clipId) {
            /// <summary>Shows the trim controls for the clip with the given ID.</summary>
            /// <param name="clipId" type="Number">The ID of the clip to trim.</param>
            console.log("Beginning trim operation.");
            let clipObj = Ensemble.Editor.TimelineMGR.getClipById(clipId);
            let clipEl = document.getElementById(Ensemble.Editor.TimelineMGR._buildClipDOMId(clipId));

            let ghostEl = document.createElement("div");
            ghostEl.className = "timeline-clip-ghost";
            ghostEl.style.width = clipEl.style.width;
            ghostEl.style.height = Ensemble.Editor.TimelineMGR._currentTrackHeight + "px";
            ghostEl.style.top = $(clipEl).closest(".timeline-track--content").position().top + "px";
            ghostEl.style.left = $(clipEl).position().left + "px";
            ghostEl.dataset.origLeft = ghostEl.style.left;
            ghostEl.dataset.origTop = ghostEl.style.top;
            ghostEl.dataset.origWidth = clipEl.style.width;
            ghostEl.dataset.clipId = clipId;


            let leftGripper = document.createElement("div");
            leftGripper.className = "timeline-clip-gripper timeline-clip-gripper--left";
            leftGripper.style.left = ghostEl.style.left;
            leftGripper.style.top = ghostEl.style.top;
            leftGripper.style.height = ghostEl.style.height;
            leftGripper.dataset.which = "left";

            let rightGripper = document.createElement("div");
            rightGripper.className = "timeline-clip-gripper timeline-clip-gripper--right";
            rightGripper.style.left = parseFloat(ghostEl.style.left) + parseFloat(ghostEl.style.width) + "px";
            rightGripper.style.top = ghostEl.style.top;
            rightGripper.style.height = ghostEl.style.height;
            rightGripper.dataset.which = "right";

            leftGripper.addEventListener("pointerdown", Ensemble.Editor.TimelineMGR._listeners.clipTrimGripperMouseDown);
            rightGripper.addEventListener("pointerdown", Ensemble.Editor.TimelineMGR._listeners.clipTrimGripperMouseDown);
            ghostEl.addEventListener("pointerdown", Ensemble.Editor.TimelineMGR._listeners.clipTrimGhostMouseDown);

            Ensemble.Editor.TimelineMGR._clipDragArr.push(clipObj);
            Ensemble.Editor.TimelineMGR._ghostDragArr.push(ghostEl);
            Ensemble.Editor.TimelineMGR._trimGripperArr.push(leftGripper);
            Ensemble.Editor.TimelineMGR._trimGripperArr.push(rightGripper);

            document.getElementById("editorTimelineTracks").appendChild(ghostEl);
            document.getElementById("editorTimelineTracks").appendChild(leftGripper);
            document.getElementById("editorTimelineTracks").appendChild(rightGripper);

            Ensemble.Editor.TimelineMGR._trimMaxDur = clipObj.file.duration;
            Ensemble.Editor.TimelineMGR._trimMinStart = clipObj.startTime - clipObj.startTrim;
            Ensemble.Editor.TimelineMGR._trimMaxEnd = clipObj.startTime + clipObj.duration + clipObj.endTrim;

            let found = false;
            for (let i = 0; i < Ensemble.Editor.TimelineMGR.tracks.length; i++) {
                if (found) break;
                for (let k = 0; k < Ensemble.Editor.TimelineMGR.tracks[i].clips.length; k++) {
                    if (Ensemble.Editor.TimelineMGR.tracks[i].clips[k].id == clipObj.id) {
                        if (k > 0) {
                            let prev = Ensemble.Editor.TimelineMGR._trimStartBound = Ensemble.Editor.TimelineMGR.tracks[i].clips[k - 1];
                            Ensemble.Editor.TimelineMGR._trimStartBound = prev.startTime + prev.duration;
                        }
                        else Ensemble.Editor.TimelineMGR._trimStartBound = 0;

                        if (Ensemble.Editor.TimelineMGR.tracks[i].clips.length > k + 1) {
                            let next = Ensemble.Editor.TimelineMGR._trimStartBound = Ensemble.Editor.TimelineMGR.tracks[i].clips[k + 1];
                            Ensemble.Editor.TimelineMGR._trimEndBound = next.startTime;
                        }
                        else Ensemble.Editor.TimelineMGR._trimEndBound = Infinity;
                        found = true;
                        break;
                    }
                }
            }
            $(".timeline-clip").addClass("timeline-clip--interaction-disabled");
            Ensemble.Editor.TimelineMGR.ui.timeCursor.style.display = "none";
            Ensemble.Editor.CalloutMGR.setState(Ensemble.Editor.CalloutMGR.States.trim);
        },

        acceptTrim: function () {
            /// <summary>Accepts and completes the current trim operation.</summary>
            let zoomRatio = Ensemble.Editor.TimelineZoomMGR.zoomLevels[Ensemble.Editor.TimelineZoomMGR.currentLevel].ratio;
            let ghost = Ensemble.Editor.TimelineMGR._ghostDragArr[0];
            let clip = Ensemble.Editor.TimelineMGR._clipDragArr[0];
            
            let clipStart = Math.round(parseFloat(ghost.style.left) * zoomRatio);
            let clipDur = Math.round(parseFloat(ghost.style.width) * zoomRatio);

            // now find where the clip would be if it were not trimmed at all
            let tempStart = clip.startTime - clip.startTrim;
            let tempEnd = clip.startTime + clip.duration + clip.endTrim;

            // compare the new start and duration to the calculated ones to determine the trim values.
            let tempStartTrim = clipStart - tempStart;
            let tempEndTrim = tempEnd - (clipStart + clipDur);

            let trimAction = new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.trimClip, {
                clipId: clip.id,
                newStartTime: clipStart,
                newDuration: clipDur,
                newStartTrim: tempStartTrim,
                newEndTrim: tempEndTrim,
                oldStartTrim: clip.startTrim,
                oldEndTrim: clip.endTrim,
                oldDuration: clip.duration,
                oldStartTime: clip.startTime
            });
            Ensemble.HistoryMGR.performAction(trimAction);
            Ensemble.Editor.CalloutMGR.setState(Ensemble.Editor.CalloutMGR.States.standard);
            $(".timeline-clip-gripper").remove();
            $(".timeline-clip-ghost").remove();
            Ensemble.Editor.TimelineMGR._clipDragArr = [];
            Ensemble.Editor.TimelineMGR._ghostDragArr = [];
            Ensemble.Editor.TimelineMGR._trimGripperArr = [];
            Ensemble.Editor.TimelineMGR.ui.timeCursor.style.display = "";
            $(".timeline-clip").removeClass("timeline-clip--interaction-disabled");
        },
        
        rejectTrim: function () {
            /// <summary>Rejects and cancels the current trim operation.</summary>
            Ensemble.Editor.TimelineMGR._clipTrimming = false;
            Ensemble.Editor.CalloutMGR.setState(Ensemble.Editor.CalloutMGR.States.standard);
            $(".timeline-clip-gripper").remove();
            $(".timeline-clip-ghost").remove();
            Ensemble.Editor.TimelineMGR._clipDragArr = [];
            Ensemble.Editor.TimelineMGR._ghostDragArr = [];
            Ensemble.Editor.TimelineMGR._trimGripperArr = [];
            Ensemble.Editor.TimelineMGR.ui.timeCursor.style.display = "";
            $(".timeline-clip").removeClass("timeline-clip--interaction-disabled");
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

                Ensemble.Editor.SelectionMGR.replaceSelection(clipId);
                Ensemble.Editor.CalloutMGR.show(Ensemble.Editor.SelectionMGR.selected[0], event)

                if (event.pointerType == "touch") {
                }

                else {
                    if (event.button == 0) {
                        console.log("Left-clicked.");
                        Ensemble.Editor.TimelineMGR._lastMouseDragEvent = event;
                        Ensemble.Editor.TimelineMGR._clipDragPrimeTimer = setTimeout(Ensemble.Editor.TimelineMGR._listeners.mouseClipDirectDragStart, 100);
                        document.addEventListener("pointerup", Ensemble.Editor.TimelineMGR._listeners.mouseClipPreventDirectDragStart);
                    }
                    else if (event.button == 2) {
                        event.stopPropagation();
                        event.preventDefault();
                        let commands = document.getElementsByClassName("selection-callout__command");
                        setTimeout(function () {
                            Ensemble.Editor.TimelineMGR.ui.timelineSelectionContextMenu.winControl.show(commands[commands.length - 1]);
                        }, 100);
                    }
                }
                return false;
            },

            timelineTrackContainerPointerDown: function (event) {
                if (Ensemble.Editor.TimelineMGR._clipTrimming) {
                    Ensemble.Editor.TimelineMGR.rejectTrim();
                }
                else {
                    Ensemble.Editor.SelectionMGR.clearSelection();
                    Ensemble.Editor.CalloutMGR.hide();
                }
            },

            timelineScrolled: function (event) {
                Ensemble.Editor.TimelineMGR.ui.timeRuler.scrollLeft = Ensemble.Editor.TimelineMGR.ui.scrollableContainer.scrollLeft;
            },

            mouseClipPreventDirectDragStart: function (event) {
                clearTimeout(Ensemble.Editor.TimelineMGR._clipDragPrimeTimer);
            },

            mouseClipDirectDragStart: function () {
                document.removeEventListener("pointerup", Ensemble.Editor.TimelineMGR._listeners.mouseClipPreventDirectDragStart);
                console.log("Start direct drag on clip.");
                let event = Ensemble.Editor.TimelineMGR._lastMouseDragEvent;

                event.stopPropagation();

                Ensemble.KeyboardMGR.editorTimelineCursorDrag();

                Ensemble.Editor.TimelineMGR._clipDragPointerOriginalLeft = event.pageX;
                Ensemble.Editor.TimelineMGR._clipDragPointerCurrentLeft = event.pageX;
                Ensemble.Editor.TimelineMGR._clipDragPointerOriginalTop = event.pageY;
                Ensemble.Editor.TimelineMGR._clipDragPointerCurrentTop = event.pageY;

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

                    Ensemble.Editor.TimelineMGR._clipDragArr.push(Ensemble.Editor.TimelineMGR.getClipById(Ensemble.Editor.SelectionMGR.selected[i]));
                    Ensemble.Editor.TimelineMGR._ghostDragArr.push(ghostEl);
                }

                document.addEventListener("pointermove", Ensemble.Editor.TimelineMGR._listeners.clipDragCursorUpdate);
                document.addEventListener("pointerup", Ensemble.Editor.TimelineMGR._listeners.clipDirectDragFinished);

                Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout.dataset.origLeft = Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout.style.left;

                Ensemble.Editor.TimelineMGR._clipDragging = true;

                if (Ensemble.Editor.SelectionMGR.selected.length == 1) requestAnimationFrame(Ensemble.Editor.TimelineMGR._listeners.updateSingleClipDirectDrag);
                else requestAnimationFrame(Ensemble.Editor.TimelineMGR._listeners.updateDraggedClipPosition);
            },

            updateSingleClipDirectDrag: function (event) {
                let zoomRatio = Ensemble.Editor.TimelineZoomMGR.zoomLevels[Ensemble.Editor.TimelineZoomMGR.currentLevel].ratio;
                let ghost = Ensemble.Editor.TimelineMGR._ghostDragArr[0];
                let clip = Ensemble.Editor.TimelineMGR._clipDragArr[0];
                let dif = Ensemble.Editor.TimelineMGR._clipDragPointerCurrentLeft - Ensemble.Editor.TimelineMGR._clipDragPointerOriginalLeft;
                let yDif = Ensemble.Editor.TimelineMGR._clipDragPointerCurrentTop - Ensemble.Editor.TimelineMGR._clipDragPointerOriginalTop;

                let dragTime = (parseFloat(ghost.dataset.origLeft) + dif) * zoomRatio;
                let trackIndex = Math.floor((parseFloat(ghost.dataset.origTop) + yDif + (0.5 * Ensemble.Editor.TimelineMGR._currentTrackHeight)) / Ensemble.Editor.TimelineMGR._currentTrackHeight);
                
                if (0 > trackIndex) trackIndex = 0;

                Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout.style.top = parseFloat(Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout.dataset.origTop) + yDif + "px";
                ghost.style.top = (trackIndex * Ensemble.Editor.TimelineMGR._currentTrackHeight) + "px";

                if (dragTime < 0) dragTime = 0;

                dragTime = Ensemble.Editor.TimelineMGR.tracks[trackIndex].closestFreeSlot(dragTime, clip.duration, clip.id);
                dragPx = dragTime / zoomRatio;

                ghost.style.left = dragPx + "px";
                Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout.style.left = parseFloat(Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout.dataset.origLeft) + dif + "px";

                if (Ensemble.Editor.TimelineMGR._clipDragging) requestAnimationFrame(Ensemble.Editor.TimelineMGR._listeners.updateSingleClipDirectDrag);
                else {
                    let moveAction = new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.moveClip, {
                        clipIds: [clip.id],
                        destinationTimes: [dragTime],
                        destinationTracks: [Ensemble.Editor.TimelineMGR.tracks[trackIndex].id],
                        originalTimes: [clip.startTime],
                        originalTracks: [Ensemble.Editor.TimelineMGR.tracks[Math.round(parseFloat(ghost.dataset.origTop) / Ensemble.Editor.TimelineMGR._currentTrackHeight)].id]
                    });
                    Ensemble.HistoryMGR.performAction(moveAction);
                    ghost.parentNode.removeChild(ghost);
                    Ensemble.Editor.TimelineMGR._ghostDragArr = [];
                    Ensemble.Editor.TimelineMGR._clipDragArr = [];
                    console.log("Finish single clip move.");
                }
            },

            clipDirectDragFinished: function (event) {
                console.log("Direct drag finished.");
                event.stopPropagation();
                document.removeEventListener("pointermove", Ensemble.Editor.TimelineMGR._listeners.clipDragCursorUpdate);
                document.removeEventListener("pointerup", Ensemble.Editor.TimelineMGR._listeners.clipDirectDragFinished);
                Ensemble.Editor.TimelineMGR._clipDragging = false;
                Ensemble.KeyboardMGR.editorDefault();
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

                        Ensemble.Editor.TimelineMGR._clipDragArr.push(Ensemble.Editor.TimelineMGR.getClipById(Ensemble.Editor.SelectionMGR.selected[i]));
                        Ensemble.Editor.TimelineMGR._ghostDragArr.push(ghostEl);
                    }

                    document.addEventListener("pointermove", Ensemble.Editor.TimelineMGR._listeners.clipDragCursorUpdate);
                    document.addEventListener("pointerup", Ensemble.Editor.TimelineMGR._listeners.clipDragFinished);

                    Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout.dataset.origLeft = Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout.style.left;

                    Ensemble.Editor.TimelineMGR._clipDragging = true;

                    if (Ensemble.Editor.SelectionMGR.selected.length == 1) requestAnimationFrame(Ensemble.Editor.TimelineMGR._listeners.updateSingleClipTimeDrag);
                    else requestAnimationFrame(Ensemble.Editor.TimelineMGR._listeners.updateDraggedClipPosition);
                }
            },

            clipDragCursorUpdate: function (event) {
                event.stopPropagation();
                Ensemble.Editor.TimelineMGR._clipDragPointerCurrentLeft = event.pageX;
                Ensemble.Editor.TimelineMGR._clipDragPointerCurrentTop = event.pageY;
            },

            updateSingleClipTimeDrag: function (event) {
                let zoomRatio = Ensemble.Editor.TimelineZoomMGR.zoomLevels[Ensemble.Editor.TimelineZoomMGR.currentLevel].ratio;
                let ghost = Ensemble.Editor.TimelineMGR._ghostDragArr[0];
                let clip = Ensemble.Editor.TimelineMGR._clipDragArr[0];
                let dif = Ensemble.Editor.TimelineMGR._clipDragPointerCurrentLeft - Ensemble.Editor.TimelineMGR._clipDragPointerOriginalLeft;
                let dragTime = (parseFloat(ghost.dataset.origLeft) + dif) * zoomRatio;
                let trackIndex = Math.round(parseFloat(ghost.style.top) / Ensemble.Editor.TimelineMGR._currentTrackHeight);

                if (dragTime < 0) dragTime = 0;
                
                dragTime = Ensemble.Editor.TimelineMGR.tracks[trackIndex].closestFreeSlot(dragTime, clip.duration, clip.id);
                dragPx = dragTime / zoomRatio;

                ghost.style.left = dragPx + "px";
                Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout.style.left = parseFloat(Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout.dataset.origLeft) + dif + "px";

                if (Ensemble.Editor.TimelineMGR._clipDragging) requestAnimationFrame(Ensemble.Editor.TimelineMGR._listeners.updateSingleClipTimeDrag);
                else {
                    // finish move.
                    let moveAction = new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.moveClip, {
                        clipIds: [clip.id],
                        destinationTimes: [dragTime],
                        destinationTracks: [Ensemble.Editor.TimelineMGR.tracks[trackIndex].id],
                        originalTimes: [clip.startTime],
                        originalTracks: [Ensemble.Editor.TimelineMGR.tracks[Math.round(parseFloat(ghost.dataset.origTop) / Ensemble.Editor.TimelineMGR._currentTrackHeight)].id]
                    });

                    Ensemble.HistoryMGR.performAction(moveAction);

                    ghost.parentNode.removeChild(ghost);
                    Ensemble.Editor.TimelineMGR._ghostDragArr = [];
                    Ensemble.Editor.TimelineMGR._clipDragArr = [];
                    console.log("Finish single clip move.");
                }
            },

            updateDraggedClipPosition: function (event) {
                let zoomRatio = Ensemble.Editor.TimelineZoomMGR.zoomLevels[Ensemble.Editor.TimelineZoomMGR.currentLevel].ratio;
                let dif = Ensemble.Editor.TimelineMGR._clipDragPointerCurrentLeft - Ensemble.Editor.TimelineMGR._clipDragPointerOriginalLeft;
                let ghosts = document.getElementsByClassName("timeline-clip-ghost");

                if (ghosts.length > 1) {
                    // allow temporary collision
                    for (let i = 0; i < ghosts.length; i++) {
                        let candidateLeft = parseFloat(ghosts[i].dataset.origLeft) + dif;
                        if (0 > candidateLeft) candidateLeft = 0;
                        ghosts[i].style.left = candidateLeft + "px";

                        let collision = false;
                        let offendingClip = null;
                        let trackIndex = parseFloat(ghosts[i].style.top) / Ensemble.Editor.TimelineMGR._currentTrackHeight;

                        for (let g = 0; g < Ensemble.Editor.TimelineMGR.tracks[trackIndex].clips.length; g++) {
                            let candidateStartTime = candidateLeft * zoomRatio;
                            let candidateEndTime = candidateStartTime + (parseFloat(ghosts[i].style.width) * zoomRatio);
                            let ghostId = parseInt(ghosts[i].dataset.clipId, 10);
                            if (Ensemble.Editor.TimelineMGR.tracks[trackIndex].clips[g].timeCollision(ghostId, candidateStartTime, candidateEndTime)) {
                                collision = true;
                                offendingClip = Ensemble.Editor.TimelineMGR.tracks[trackIndex].clips[g];
                                break;
                            }
                        }
                        if (collision) {
                            $(ghosts[i]).addClass("timeline-clip-ghost--collision");
                            ghosts[i].dataset.offendingId = offendingClip.id;
                        }
                        else $(ghosts[i]).removeClass("timeline-clip-ghost--collision");
                    }
                }
                else {
                    // check if time is valid. If not, snap to nearest edge.
                    let candidateTime = (parseFloat(ghosts[0].dataset.origLeft) + dif) * zoomRatio;
                    let trackIndex = parseFloat(ghosts[0].style.top) / Ensemble.Editor.TimelineMGR._currentTrackHeight;
                    let candidateClip = Ensemble.Editor.TimelineMGR.getClipById(parseInt(ghosts[0].dataset.clipId, 10));
                    let clipDur = candidateClip.duration;
                    candidateTime = Ensemble.Editor.TimelineMGR.tracks[trackIndex].closestFreeSlot(candidateTime, clipDur, candidateClip.id);
                    ghosts[0].style.left = (candidateTime / zoomRatio) + "px";
                }
                Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout.style.left = parseFloat(Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout.dataset.origLeft) + dif + "px";

                if (Ensemble.Editor.TimelineMGR._clipDragging) requestAnimationFrame(Ensemble.Editor.TimelineMGR._listeners.updateDraggedClipPosition);
                else {
                    // finish move operation.
                    let candidateSeekTime = Math.floor(parseFloat(ghosts[i].style.left) * zoomRatio);
                    let invalidClips = document.getElementsByClassName("timeline-clip-ghost--collision");
                    let movingClips = document.getElementsByClassName("timeline-clip-ghost");
                    let movingTargets = [];

                    if (invalidClips.length > 0) {
                        let durations = [];
                        let starts = [];
                        let ids = [];
                        let tracks = [];
                        for (let i = 0; i < ghosts.length; i++) {
                            durations.push(Ensemble.Editor.TimelineMGR.getClipById(parseInt(ghosts[i], 10)).duration);
                            starts.push(Math.floor(parseFloat(ghosts[i].style.left) * zoomRatio));
                            ids.push(parseInt(ghosts[i].dataset.clipId, 10));
                            tracks.push(Ensemble.Editor.TimelineMGR.tracks[(parseFloat(ghosts[i].style.top) / Ensemble.Editor.TimelineMGR._currentTrackHeight)].id);
                        }



                        // TODO: using closestCompatibleTimes(), generate an appropriate timeset for all of the clips.


                    }

                    let clipsToMove = [];
                    let destinationTimes = [];
                    let destinationTracks = [];
                    let originalTimes = [];
                    let originalTracks = [];
                    for (let i = 0; i < ghosts.length; i++) {
                        let clipId = parseInt(ghosts[i].dataset.clipId, 10);
                        let origClip = Ensemble.Editor.TimelineMGR.getClipById(clipId);
                        clipsToMove.push(clipId);
                        destinationTimes.push(candidateSeekTime);
                        destinationTracks.push(Ensemble.Editor.TimelineMGR.tracks[(parseFloat(ghosts[i].style.top) / Ensemble.Editor.TimelineMGR._currentTrackHeight)].id);
                        originalTimes.push(origClip.startTime);
                        originalTracks.push(Ensemble.Editor.TimelineMGR.tracks[parseFloat(ghosts[i].dataset.origTop) / Ensemble.Editor.TimelineMGR._currentTrackHeight].id);
                        ghosts[i].parentNode.removeChild(ghosts[i]);
                    }

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
            },

            calloutMoveTrackClipPointerDown: function (event) {
                if (!Ensemble.Editor.PlaybackMGR.playing) {
                    event.stopPropagation();

                    Ensemble.KeyboardMGR.editorTimelineCursorDrag();

                    Ensemble.Editor.TimelineMGR._clipDragPointerOriginalTop = event.pageY;
                    Ensemble.Editor.TimelineMGR._clipDragPointerCurrentTop = event.pageY;

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

                        Ensemble.Editor.TimelineMGR._clipDragArr.push(Ensemble.Editor.TimelineMGR.getClipById(Ensemble.Editor.SelectionMGR.selected[i]));
                        Ensemble.Editor.TimelineMGR._ghostDragArr.push(ghostEl);
                    }

                    document.addEventListener("pointermove", Ensemble.Editor.TimelineMGR._listeners.clipDragCursorUpdate);
                    document.addEventListener("pointerup", Ensemble.Editor.TimelineMGR._listeners.clipDragFinished);

                    Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout.dataset.origLeft = Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout.style.left;
                    Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout.dataset.origTop = Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout.style.top;

                    Ensemble.Editor.TimelineMGR._clipDragging = true;

                    if (Ensemble.Editor.SelectionMGR.selected.length == 1) requestAnimationFrame(Ensemble.Editor.TimelineMGR._listeners.updateSingleClipTrackDrag);
                }
            },

            updateSingleClipTrackDrag: function (event) {
                let zoomRatio = Ensemble.Editor.TimelineZoomMGR.zoomLevels[Ensemble.Editor.TimelineZoomMGR.currentLevel].ratio;
                let ghost = Ensemble.Editor.TimelineMGR._ghostDragArr[0];
                let clip = Ensemble.Editor.TimelineMGR._clipDragArr[0];
                let dif = Ensemble.Editor.TimelineMGR._clipDragPointerCurrentTop - Ensemble.Editor.TimelineMGR._clipDragPointerOriginalTop;

                let trackIndex = Math.floor((parseFloat(ghost.dataset.origTop) + dif + (0.5 * Ensemble.Editor.TimelineMGR._currentTrackHeight)) / Ensemble.Editor.TimelineMGR._currentTrackHeight);
                if (0 > trackIndex) trackIndex = 0;

                Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout.style.top = parseFloat(Ensemble.Editor.TimelineMGR.ui.timelineSelectionCallout.dataset.origTop) + dif + "px";
                //ghost.style.top = parseFloat(ghost.dataset.origTop) + dif + "px";
                ghost.style.top = (trackIndex * Ensemble.Editor.TimelineMGR._currentTrackHeight) + "px";
                let result = Ensemble.Editor.TimelineMGR.tracks[trackIndex].clipCollisionAt(clip.startTime, clip.duration);
                let sameClip = true;
                if (result.collision) {
                    for (let i = 0; i < result.offending.length; i++) {
                        if (result.offending[i] != clip.id) {
                            $(ghost).addClass("timeline-clip-ghost--collision");
                            sameClip = false;
                            break;
                        }
                    }
                }
                if (sameClip) $(ghost).removeClass("timeline-clip-ghost--collision");


                if (Ensemble.Editor.TimelineMGR._clipDragging) requestAnimationFrame(Ensemble.Editor.TimelineMGR._listeners.updateSingleClipTrackDrag);
                else {
                    let collisionClip = document.getElementsByClassName("timeline-clip-ghost--collision");
                    if (collisionClip.length > 0) {
                        collisionClip = collisionClip[0];
                        let closestBefore = Ensemble.Editor.TimelineMGR.tracks[trackIndex].closestFreeSlot(clip.startTime, clip.duration, clip.id, false, true);
                        let closestAfter = Ensemble.Editor.TimelineMGR.tracks[trackIndex].closestFreeSlot(clip.startTime, clip.duration, clip.id, true, false);

                        let title = "Resolve Collision";
                        let commands = [];
                        let message = "Oops, it looks like there's a collision. You can't move " + clip.name + " to that track because there's already another clip in the way. Do you want to move " + clip.name + " ";
                        if (closestBefore != null) {
                            message = message + "before or ";
                            Ensemble.Editor.TimelineMGR._clipDragSnapBefore = new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.moveClip, {
                                clipIds: [clip.id],
                                destinationTimes: [closestBefore],
                                destinationTracks: [Ensemble.Editor.TimelineMGR.tracks[trackIndex].id],
                                originalTimes: [clip.startTime],
                                originalTracks: [Ensemble.Editor.TimelineMGR.tracks[parseFloat(ghost.dataset.origTop) / Ensemble.Editor.TimelineMGR._currentTrackHeight].id]
                            });
                            commands.push({
                                label: "Before",
                                handler: function () { Ensemble.Editor.TimelineMGR._listeners.finishSingleClipTrackDrag(Ensemble.Editor.TimelineMGR._clipDragSnapBefore) }
                            });
                        }
                        message = message + "after the offending clip?";

                        Ensemble.Editor.TimelineMGR._clipDragSnapAfter = new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.moveClip, {
                            clipIds: [clip.id],
                            destinationTimes: [closestAfter],
                            destinationTracks: [Ensemble.Editor.TimelineMGR.tracks[trackIndex].id],
                            originalTimes: [clip.startTime],
                            originalTracks: [Ensemble.Editor.TimelineMGR.tracks[parseFloat(ghost.dataset.origTop) / Ensemble.Editor.TimelineMGR._currentTrackHeight].id]
                        });

                        commands.push({
                            label: "After",
                            handler: function () { Ensemble.Editor.TimelineMGR._listeners.finishSingleClipTrackDrag(Ensemble.Editor.TimelineMGR._clipDragSnapAfter) }
                        });

                        commands.push({
                            label: "Cancel",
                            handler: function () { Ensemble.Editor.TimelineMGR._listeners.finishSingleClipTrackDrag(null) }
                        });

                        Ensemble.OSDialogMGR.showDialog(title, message, commands, commands.length - 1, commands.length - 1);
                    }

                    else {
                        // no collision. just move the clip to the track.
                        let moveAction = new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.moveClip, {
                            clipIds: [clip.id],
                            destinationTimes: [clip.startTime],
                            destinationTracks: [Ensemble.Editor.TimelineMGR.tracks[trackIndex].id],
                            originalTimes: [clip.startTime],
                            originalTracks: [Ensemble.Editor.TimelineMGR.tracks[Math.round(parseFloat(ghost.dataset.origTop) / Ensemble.Editor.TimelineMGR._currentTrackHeight)].id]
                        });
                        Ensemble.Editor.TimelineMGR._listeners.finishSingleClipTrackDrag(moveAction);
                    }
                }
            },

            finishSingleClipTrackDrag: function (action) {
                if (action) {
                    Ensemble.HistoryMGR.performAction(action);
                    Ensemble.Editor.TimelineMGR._clipDragSnapBefore = null;
                    Ensemble.Editor.TimelineMGR._clipDragSnapAfter = null;
                }
                else console.log("Canceled move.");
                Ensemble.Editor.TimelineMGR._ghostDragArr[0].parentNode.removeChild(Ensemble.Editor.TimelineMGR._ghostDragArr[0]);
                Ensemble.Editor.TimelineMGR._ghostDragArr = [];
                Ensemble.Editor.TimelineMGR._clipDragArr = [];
                console.log("Finish single clip move.");
            },

            clipTrimGhostMouseDown: function (event) {
                event.preventDefault();
                event.stopPropagation();
            },

            clipTrimGripperMouseDown: function (event) {
                event.preventDefault();
                event.stopPropagation();

                Ensemble.Editor.TimelineMGR._clipDragPointerOriginalLeft = event.pageX;
                Ensemble.Editor.TimelineMGR._clipDragPointerCurrentLeft = event.pageX;

                event.currentTarget.dataset.origLeft = event.currentTarget.style.left;
                $(event.currentTarget).addClass("timeline-clip-gripper--active");

                document.addEventListener("pointermove", Ensemble.Editor.TimelineMGR._listeners.clipDragCursorUpdate);
                document.addEventListener("pointerup", Ensemble.Editor.TimelineMGR._listeners.clipTrimStopped);

                Ensemble.Editor.TimelineMGR._clipTrimming = true;
                requestAnimationFrame(Ensemble.Editor.TimelineMGR._listeners.updateClipTrim);
            },

            updateClipTrim: function (event) {
                let zoomRatio = Ensemble.Editor.TimelineZoomMGR.zoomLevels[Ensemble.Editor.TimelineZoomMGR.currentLevel].ratio;
                let dif = Ensemble.Editor.TimelineMGR._clipDragPointerCurrentLeft - Ensemble.Editor.TimelineMGR._clipDragPointerOriginalLeft;
                let ghost = Ensemble.Editor.TimelineMGR._ghostDragArr[0];
                let origClip = Ensemble.Editor.TimelineMGR._clipDragArr[0];
                let activeGripper = document.getElementsByClassName("timeline-clip-gripper--active")[0];
                let leftGripper = Ensemble.Editor.TimelineMGR._trimGripperArr[0];
                let rightGripper = Ensemble.Editor.TimelineMGR._trimGripperArr[1];

                let maxDur = Ensemble.Editor.TimelineMGR._trimMaxDur;
                let minStart = Ensemble.Editor.TimelineMGR._trimMinStart;
                let maxEnd = Ensemble.Editor.TimelineMGR._trimMaxEnd;
                let startBound = Ensemble.Editor.TimelineMGR._trimStartBound;
                let endBound = Ensemble.Editor.TimelineMGR._trimEndBound;
                console.log("Bounds: " + minStart + ", " + maxEnd);

                let leftGripperTime = 0;
                let rightGripperTime = 0;
                let ghostTime = 0;
                let ghostDur = 0;

                if ($(activeGripper).hasClass("timeline-clip-gripper--left")) {
                    leftGripperTime = (parseFloat(leftGripper.dataset.origLeft) + dif) * zoomRatio;
                    rightGripperTime = parseFloat(rightGripper.style.left) * zoomRatio;

                    if (leftGripperTime >= rightGripperTime) leftGripperTime = rightGripperTime - 1;
                    if (minStart > leftGripperTime) leftGripperTime = minStart;
                    if (startBound > leftGripperTime) leftGripperTime = startBound;
                }
                else {
                    leftGripperTime = parseFloat(leftGripper.style.left) * zoomRatio;
                    rightGripperTime = (parseFloat(rightGripper.dataset.origLeft) + dif) * zoomRatio;

                    if (leftGripperTime >= rightGripperTime) rightGripperTime = leftGripperTime + 1;
                    if (rightGripperTime > maxEnd) rightGripperTime = maxEnd;
                    if (rightGripperTime > endBound) rightGripperTime = endBound;
                }
                ghostTime = leftGripperTime;
                ghostDur = rightGripperTime - leftGripperTime;

                leftGripper.style.left = (leftGripperTime / zoomRatio) + "px";
                rightGripper.style.left = (rightGripperTime / zoomRatio) + "px";
                ghost.style.left = (ghostTime / zoomRatio) + "px";
                ghost.style.width = (ghostDur / zoomRatio) + "px";


                if (Ensemble.Editor.TimelineMGR._clipTrimming) requestAnimationFrame(Ensemble.Editor.TimelineMGR._listeners.updateClipTrim);
                else {
                    $(".timeline-clip-gripper--active").removeClass("timeline-clip-gripper--active");
                }
            },

            clipTrimStopped: function (event) {
                event.stopPropagation();
                document.removeEventListener("pointermove", Ensemble.Editor.TimelineMGR._listeners.clipDragCursorUpdate);
                document.removeEventListener("pointerup", Ensemble.Editor.TimelineMGR._listeners.clipTrimStopped);
                Ensemble.Editor.TimelineMGR._clipTrimming = false;
                Ensemble.KeyboardMGR.editorDefault();
            }


        }
    });
})();