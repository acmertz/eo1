(function () {
    WinJS.Namespace.define("Ensemble.Editor.TimelineMGR", {
        /// <summary>Manages the history state of the current project.</summary>

        tracks: [],
        _uniqueTrackID: 0,
        _displayScale: 10, //milliseconds per pixel
        _trackVolumeRollback: 0, //original value for the volume flyout
        _trackVolumeId: 0,

        createTrack: function (clipsToAdd, idToUse, nameToUse, volumeToUse) {
            /// <summary>Creates a new track in the timeline.</summary>
            /// <param name="clipsToAdd" type="Array">Optional. An array of Ensemble.EnsembleFile objects with which to prepopulate the track.</param>
            /// <param name="idToUse" type="Number">Optional. An ID to give the newly-created track, for use in project loading.</param>
            /// <param name="nameToUse" type="String">Optional. A name to give the track.</param>
            /// <param name="volumeToUse" type="Number">Optional. A volume level to assign the track.</param>

            var newTrack = new Ensemble.Editor.Track(idToUse, nameToUse, volumeToUse);
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

        getTrackById: function (idval) {
            /// <summary>Returns the Track object with the given ID, provided it exists.</summary>
            /// <returns type="Ensemble.Editor.Track">The matching track.</returns>
            for (var i=0; i<this.tracks.length; i++) {
                if (this.tracks[i].id == idval) return this.tracks[i];
            }
            return null;
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

        setRulerScale: function (rulerScale) {
            /// <summary>Sets the scale used to display the timeline, its tracks and clips, and the timing ruler.</summary>
            /// <param name="rulerScale" type="Number">A number representing the number of milliseconds per pixel to use in the timeline display.</param>
            console.log("Set timeline scale to " + rulerScale);
            Ensemble.Settings.setEditorRulerScale(rulerScale);

            var displayWidthTime = Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timelineRuler.clientWidth / rulerScale;
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

            var chunkCount = Math.ceil(Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timelineRuler.clientWidth / chunkSize);

            for (var i = 0; i < chunkCount; i++) {
                htmlStr = htmlStr + "<div class='timeChunk timeChunkLarge' style='width:" + chunkSize + "px;'>";
                for (var k = 0; k < subChunkCount; k++) {
                    htmlStr = htmlStr + "<div class='timeChunk timeChunkSmall' style='width:" + subChunkSize + "px;'></div>";
                }
                htmlStr = htmlStr + "</div>";
                htmlStr = htmlStr + "<div class='timeLabel' style='left: " + (chunkSize * (i + 1)) + "px;'>Label</div>";
            }

            //for (var i = 0; i < timeSec; i++) {
            //    htmlStr = htmlStr + "<div class='timeChunk timeChunkLarge' style='width:" + widthPerSecond + "px;'>" + i + "</div>";
            //}



            Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timelineRuler.style.transition = "0.1s transform ease";
            Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timelineRuler.style.transform = "translateY(100%)";
            setTimeout(function () {
                Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timelineRuler.innerHTML = htmlStr;
                Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timelineRuler.style.transform = "";
                setTimeout(function () {
                    Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timelineRuler.style.transition = "none";
                }, 200);
            }, 200);
            
        },

        zoomIn: function () {
            /// <summary>Increases the zoom on the timeline display by one level.</summary>
            Ensemble.Editor.TimelineMGR.setRulerScale(Ensemble.Settings.getEditorRulerScale() * 2);
        },

        zoomOut: function () {
            /// <summary>Decreases the zoom on the timeline display by one level.</summary>
            Ensemble.Editor.TimelineMGR.setRulerScale(Ensemble.Settings.getEditorRulerScale() * 0.5);
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

            $(renameControl).click(this._trackRenameButtonClicked);
            $(volumeControl).click(this._trackVolumeButtonClicked);

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
        },

        _trackRenameButtonClicked: function (event) {
            console.log("clicked.");
            var trackDetail = $(event.currentTarget).closest(".editorTimelineDetail");
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
            var parentTrack = $(event.currentTarget).closest(".editorTimelineDetail");
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
                    var parentTrack = $(event.currentTarget).closest(".editorTimelineDetail");
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
            var parentTrack = $(event.currentTarget).closest(".editorTimelineDetail");
            var trackId = parseInt($(parentTrack).attr("id").match(/\d+$/)[0]);
            Ensemble.Editor.TimelineMGR._trackVolumeId = trackId;
            $(Ensemble.Pages.Editor.UI.UserInput.Flyouts.trackVolume).find("input").val(Ensemble.Editor.TimelineMGR.getTrackById(trackId).volume * 100);
            $(Ensemble.Pages.Editor.UI.UserInput.Flyouts.trackVolume).find("input").change(Ensemble.Editor.TimelineMGR._trackVolumeSliderChanged);
            $(Ensemble.Pages.Editor.UI.UserInput.Flyouts.trackVolume).bind("beforehide", Ensemble.Editor.TimelineMGR._trackVolumeChangeFinish);
            Ensemble.Editor.TimelineMGR._trackVolumeRollback = $(Ensemble.Pages.Editor.UI.UserInput.Flyouts.trackVolume).find("input").val() / 100;
            Ensemble.Pages.Editor.UI.UserInput.Flyouts.trackVolume.winControl.show(event.currentTarget);
        },

        _trackVolumeSliderChanged: function (event) {
            console.log("Volume slider slid.");
            // TODO: additional logic to facilitate live volume adjustment
        },

        _trackVolumeChangeFinish: function (event) {
            // commit volume change on flyout hide.
            $(Ensemble.Pages.Editor.UI.UserInput.Flyouts.trackVolume).unbind("beforehide", Ensemble.Editor.TimelineMGR._trackVolumeChangeFinish);
            $(Ensemble.Pages.Editor.UI.UserInput.Flyouts.trackVolume).find("input").unbind("change", Ensemble.Editor.TimelineMGR._trackVolumeSliderChanged);
            if (($(Ensemble.Pages.Editor.UI.UserInput.Flyouts.trackVolume).find("input").val() / 100) != Ensemble.Editor.TimelineMGR._trackVolumeRollback) {
                var volumeChangeAction = new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.trackVolumeChanged,
                    {
                        trackId: Ensemble.Editor.TimelineMGR._trackVolumeId,
                        oldVolume: Ensemble.Editor.TimelineMGR._trackVolumeRollback,
                        newVolume: $(Ensemble.Pages.Editor.UI.UserInput.Flyouts.trackVolume).find("input").val() / 100
                    }
                );
                Ensemble.HistoryMGR.performAction(volumeChangeAction);
            }
        }
    });
})();