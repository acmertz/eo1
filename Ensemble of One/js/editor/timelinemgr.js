(function () {
    WinJS.Namespace.define("Ensemble.Editor.TimelineMGR", {
        /// <summary>Manages the history state of the current project.</summary>

        tracks: [],
        _clipIndex: [],
        _clipIndexPosition: 0,
        _timeIndex: [],
        _uniqueTrackID: 0,
        _uniqueClipID: 0,
        _displayScale: 10, //milliseconds per pixel
        _trackVolumeRollback: 0, //original value for the volume flyout
        _trackEditId: 0, //ID of the track being edited
        _currentTrackHeight: 0, //current height of a single Track in the Timeline display
        _currentScrollIndex: 0, //current scroll position. should usually be in the negatives.

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
            Ensemble.Editor.UI.PageSections.lowerHalf.timelineHeaders.innerHTML = "";
            Ensemble.Editor.UI.PageSections.lowerHalf.timelineDetails.innerHTML = "";
            Ensemble.Editor.UI.PageSections.lowerHalf.timelineTracks.innerHTML = "";
            //Ensemble.Editor.UI.PageSections.lowerHalf.timeline.innerHTML = "";
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
            /// <summary>Adds the given track to the given position in the list of tracks.</summary>
            /// <param name="track" type="Ensemble.Editor.Track">The Track to add.</param>
            /// <param name="index" type="Number">The position where the track should be added.</param>
            this.tracks.splice(index, 0, track);
            Ensemble.Session.projectTrackCount = this.tracks.length;
            let trackDisplayObj = Ensemble.Editor.TimelineMGR._buildTrackDisplay(track, index);

        
            // Insert the track before the item at the given index.
            $(Ensemble.Editor.UI.PageSections.lowerHalf.timelineHeaders).find(".timeline-track--header").eq(index).before(trackDisplayObj.header);
            $(Ensemble.Editor.UI.PageSections.lowerHalf.timelineDetails).find(".timeline-track--controls").eq(index).before(trackDisplayObj.detail);
            $(Ensemble.Editor.UI.PageSections.lowerHalf.timelineTracks).find(".timeline-track--content").eq(index).before(trackDisplayObj.content);
            this.refreshTrackNumbers();
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
                    trackRemoved = this.tracks.splice(i, 1);
                    break;
                }
            }
            Ensemble.Session.projectTrackCount = this.tracks.length;
            this.refreshTrackNumbers();
            return {
                track: trackRemoved,
                index: i
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
            setTimeout(function () {
                Ensemble.Editor.Renderer.renderSingleFrame();
            }, 0);
        },

        moveTrackWithId: function (trackId, origin, destination) {
            /// <summary>Moves the track with the given ID to the specified position in the track array.</summary>
            /// <param name="trackId" type="Number">The ID of the track to move.</param>
            /// <param name="origin" type="Number">The index of the position where the track begins its move.</param>
            /// <param name="destination" type="Number">The index of the position where the track should end up after the move.</param>

            //let animationDur = 400;

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
            requestAnimationFrame(function () { Ensemble.Editor.Renderer.renderSingleFrame(); });
        },

        getTrackById: function (idval) {
            /// <summary>Returns the Track object with the given ID, provided it exists.</summary>
            /// <returns type="Ensemble.Editor.Track">The matching track.</returns>
            for (var i=0; i<this.tracks.length; i++) {
                if (this.tracks[i].id == idval) return this.tracks[i];
            }
            return null;
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

        setRulerScale: function (rulerScale) {
            /// <summary>Sets the scale used to display the timeline, its tracks and clips, and the timing ruler.</summary>
            /// <param name="rulerScale" type="Number">A number representing the number of milliseconds per pixel to use in the timeline display.</param>
            console.log("Set timeline scale to " + rulerScale);
            Ensemble.Settings.setEditorRulerScale(rulerScale);

            var displayWidthTime = Ensemble.Editor.UI.PageSections.lowerHalf.timelineRuler.clientWidth / rulerScale;
            if (Ensemble.Session.projectDuration > displayWidthTime) displayWidthTime = Ensemble.Session.projectDuration;

            var timeSec = Math.ceil(displayWidthTime / 1000);

            console.log("Generating timeline ruler with length " + timeSec + " seconds...");

            var chunkSize = 0;
            var subChunkSize = 0;
            var subChunkCount = 0;
            if (displayWidthTime < 60000) {
                //1-second chunks, 0.5-second subchunks
                chunkSize = Math.floor(rulerScale * 1000);
                subChunkSize = Math.floor(0.5 * chunkSize);
                subChunkCount = 1;
            }
            else if (displayWidthTime < 180000) {
                //5-second chunks, 1-second subchunks
                chunkSize = Math.floor(rulerScale * 5000);
                subChunkSize = Math.floor(0.2 * chunkSize);
                subChunkCount = 4;
            }
            else if (displayWidthTime < 600000) {
                //15-second chunks, 5-second subchunks
                chunkSize = Math.floor(rulerScale * 15000);
                subChunkSize = Math.floor((1 / 3) * chunkSize);
                subChunkCount = 2;
            }
            else if (displayWidthTime < 900000) {
                //30-second chunks, 10-second subchunks
                chunkSize = Math.floor(rulerScale * 30000);
                subChunkSize = Math.floor((1 / 3) * chunkSize);
                subChunkCount = 2;
            }
            else if (displayWidthTime < 1800000) {
                //1-minute chunks, 30-second subchunks
                chunkSize = Math.floor(rulerScale * 60000)
                subChunkSize = Math.floor(0.5 * chunkSize);
                subChunkCount = 1;
            }
            else if (displayWidthTime < 3600000) {
                //5-minute chunks, 1-minute subchunks
                chunkSize = Math.floor(rulerScale * 300000);
                subChunkSize = Math.floor(0.2 * chunkSize);
                subChunkCount = 4;
            }
            else if (displayWidthTime < 7200000) {
                //15-minute chunks, 5-minute subchunks
                chunkSize = Math.floor(rulerScale * 900000);
                subChunkSize = Math.floor((1 / 3) * chunkSize);
                subChunkCount = 2;
            }


            else {
                //1-hour chunks, no subchunks
                chunkSize = Math.floor(rulerScale * 3600000);
                subChunkSize = 0;
                subChunkCount = 0;
            }

            var widthPerSecond = Math.floor(rulerScale * 1000);
            var htmlStr = "";

            var chunkCount = Math.ceil(Ensemble.Editor.UI.PageSections.lowerHalf.timelineRuler.clientWidth / chunkSize);

            for (var i = 0; i < chunkCount; i++) {
                htmlStr = htmlStr + "<div class='timeChunk timeChunkLarge' style='width:" + chunkSize + "px;'>";
                for (var k = 0; k < subChunkCount; k++) {
                    htmlStr = htmlStr + "<div class='timeChunk timeChunkSmall' style='width:" + subChunkSize + "px;'></div>";
                }
                htmlStr = htmlStr + "</div>";
                htmlStr = htmlStr + "<div class='timeLabel' style='left: " + (chunkSize * (i + 1)) + "px;'>Label</div>";
            }

            for (var i = 0; i < timeSec; i++) {
                htmlStr = htmlStr + "<div class='timeChunk timeChunkLarge' style='width:" + widthPerSecond + "px;'>" + i + "</div>";
            }

            Ensemble.Editor.UI.PageSections.lowerHalf.timelineRuler.innerHTML = htmlStr;

            // now update the widths/positions of all the clips.

            for (let i = 0; i < this.tracks.length; i++) {
                for (let k = 0; k < this.tracks[i].clips.length; k++) {
                    let clipEl = document.getElementById(this._buildClipDOMId(this.tracks[i].clips[k].id));
                    clipEl.style.width = Ensemble.Settings.getEditorRulerScale() * this.tracks[i].clips[k].duration + "px";
                    clipEl.style.left = Ensemble.Settings.getEditorRulerScale() * this.tracks[i].clips[k].startTime + "px";
                }
            }
        },

        zoomIn: function () {
            /// <summary>Increases the zoom on the timeline display by one level.</summary>
            Ensemble.Editor.TimelineMGR.setRulerScale(Ensemble.Settings.getEditorRulerScale() * 2);
        },

        zoomOut: function () {
            /// <summary>Decreases the zoom on the timeline display by one level.</summary>
            Ensemble.Editor.TimelineMGR.setRulerScale(Ensemble.Settings.getEditorRulerScale() * 0.5);
        },

        scrollUp: function () {
            /// <summary>Scrolls the timeline up by one track.</summary>
            let currentTop = parseFloat($(".timeline-scrollable-container").css("margin-top"));
            if (currentTop < 0) {
                $(".timeline-scrollable-container").css("margin-top", (currentTop + Ensemble.Editor.TimelineMGR._currentTrackHeight) + "px");
                //$(".timeline-scrollable-container").css("transition", "");
                //$(".timeline-scrollable-container").css("transform", "translate3d(0px, -" + Ensemble.Editor.TimelineMGR._currentTrackHeight + "px, 0px)");
                //$(".timeline-scrollable-container").height();
                //$(".timeline-scrollable-container").css("transition", "transform 0.2s ease");
                //$(".timeline-scrollable-container").css("transform", "translate3d(0px, 0px, 0px)");
                Ensemble.Editor.TimelineMGR._currentScrollIndex = parseFloat($(".timeline-scrollable-container").css("margin-top")) / Ensemble.Editor.TimelineMGR._currentTrackHeight;
            }
        },

        scrollDown: function () {
            /// <summary>Scrolls the timeline down by one track.</summary>
            let currentTop = parseFloat($(".timeline-scrollable-container").css("margin-top"));
            $(".timeline-scrollable-container").css("margin-top", (currentTop - Ensemble.Editor.TimelineMGR._currentTrackHeight) + "px");
            //$(".timeline-scrollable-container").css("transition", "");
            //$(".timeline-scrollable-container").css("transform", "translateY(" + Ensemble.Editor.TimelineMGR._currentTrackHeight + "px)");
            //$(".timeline-scrollable-container").height();
            //$(".timeline-scrollable-container").css("transition", "transform 0.2s ease");
            //$(".timeline-scrollable-container").css("transform", "translateY(0px)");
            Ensemble.Editor.TimelineMGR._currentScrollIndex = parseFloat($(".timeline-scrollable-container").css("margin-top")) / Ensemble.Editor.TimelineMGR._currentTrackHeight;
        },

        _snapScrollToNearestTrack: function () {
            $(".timeline-scrollable-container").css("margin-top", this._currentScrollIndex * this._currentTrackHeight);
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
            clipEl.style.width = Math.floor(Ensemble.Settings.getEditorRulerScale() * clip.duration) + "px";
            clipEl.style.left = Math.floor(Ensemble.Settings.getEditorRulerScale() * clip.startTime) + "px";

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

            return clipEl;
        },

        _buildTrackDisplay: function (track, index) {
            /// <param name="track" type="Ensemble.Editor.Track">The track to represent on the timeline.</param>
            /// <param name="index" type="Number">The index of the track in the list of tracks.</param>
            /// <returns type="Object">An object with three parts: header, details, and content.</returns>

            var trackNumber = Ensemble.Editor.UI.PageSections.lowerHalf.timelineHeaders.childNodes.length + 1;
            if (index != null) trackNumber = index + 1;

            //var trackHeight = Math.floor(Ensemble.Editor.UI.PageSections.lowerHalf.timeline.clientHeight / Ensemble.Settings.getEditorTimelineRowsVisible()) + "px";
            var trackHeight = this._currentTrackHeight + "px";

            var trackHeader = document.createElement("div");
            trackHeader.className = "timeline-track timeline-track--header";

            var trackNumEl = document.createElement("div");
            trackNumEl.className = "trackNum";
            trackNumEl.innerText = trackNumber.toString(10);

            var trackEditButtonEl = document.createElement("div");
            trackEditButtonEl.className = "trackEditButton";
            trackEditButtonEl.innerHTML = "&#xE126;";
            //$(trackEditButtonEl).mousedown(Ensemble.Pages.MainMenu._projectListItemOnMouseDownListener);
            //$(trackEditButtonEl).mouseup(Ensemble.Pages.MainMenu._projectListItemOnMouseUpListener);
            $(trackEditButtonEl).click(Ensemble.Editor.TimelineMGR.toggleTrackDetails);
            //$(trackEditButtonEl).click(Ensemble.Editor.TimelineMGR._showTrackControls);

            trackHeader.appendChild(trackNumEl);
            trackHeader.appendChild(trackEditButtonEl);
            trackHeader.style.height = trackHeight;
            trackHeader.id = this._buildTrackHeaderId(track.id);

            var trackDetail = document.createElement("div");
            trackDetail.className = "timeline-track timeline-track--controls";
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
            buttonNewTrack: null
        },

        _refreshUI: function () {
            this.ui.buttonScrollUp = document.getElementById("editorTimelineScrollUpButton");
            this.ui.buttonScrollDown = document.getElementById("editorTimelineScrollDownButton");
            this.ui.buttonZoomIn = document.getElementById("editorTimelineZoomInButton");
            this.ui.buttonZoomOut = document.getElementById("editorTimelineZoomOutButton");
            this.ui.buttonNewTrack = document.getElementById("editorTimelineAddTrackButton");

            this.ui.buttonScrollUp.addEventListener("click", this._listeners.buttonScrollUp);
            this.ui.buttonScrollDown.addEventListener("click", this._listeners.buttonScrollDown);
            this.ui.buttonZoomIn.addEventListener("click", this._listeners.buttonZoomIn);
            this.ui.buttonZoomOut.addEventListener("click", this._listeners.buttonZoomOut);
            this.ui.buttonNewTrack.addEventListener("click", this._listeners.buttonNewTrack);
        },

        _cleanUI: function () {
            this.ui.buttonScrollUp.removeEventListener("click", this._listeners.buttonScrollUp);
            this.ui.buttonScrollDown.removeEventListener("click", this._listeners.buttonScrollDown);
            this.ui.buttonZoomIn.removeEventListener("click", this._listeners.buttonZoomIn);
            this.ui.buttonZoomOut.removeEventListener("click", this._listeners.buttonZoomOut);
            this.ui.buttonNewTrack.removeEventListener("click", this._listeners.buttonNewTrack);

            this.ui.buttonScrollUp = null;
            this.ui.buttonScrollDown = null;
            this.ui.buttonZoomIn = null;
            this.ui.buttonZoomOut = null;
            this.ui.buttonNewTrack = null;
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
            Ensemble.Session.projectDuration = this._clipIndex[this._clipIndex.length - 1].time;
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
            }
        }
    });
})();