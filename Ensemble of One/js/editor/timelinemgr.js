(function () {
    WinJS.Namespace.define("Ensemble.Editor.TimelineMGR", {
        /// <summary>Manages the history state of the current project.</summary>

        tracks: [],
        _uniqueTrackID: 0,
        _displayScale: 10, //milliseconds per pixel
        _trackVolumeRollback: 0, //original value for the volume flyout
        _trackEditId: 0,

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

        moveTrackWithId: function (trackId, origin, destination) {
            /// <summary>Moves the track with the given ID to the specified position in the track array.</summary>
            /// <param name="trackId" type="Number">The ID of the track to move.</param>
            /// <param name="origin" type="Number">The index of the position where the track begins its move.</param>
            /// <param name="destination" type="Number">The index of the position where the track should end up after the move.</param>

            let trackTransformPercentage = (destination - origin) * 100;
            let affectedTransformPercentage = -100;
            let affectedDif = -1;
            if (trackTransformPercentage < 0) {
                affectedTransformPercentage = 100;
                affectedDif = 1;
            }

            let trackHeader = $("#" + this._buildTrackHeaderId(trackId));
            let trackControl = $("#" + this._buildTrackDetailId(trackId));
            let trackItself = $("#" + this._buildTrackDOMId(trackId));

            let trackNum = $(trackHeader).find(".trackNum");
            $(trackNum).text(destination + 1);

            $(trackHeader).css("transition", "transform 0.4s ease");
            $(trackHeader).css("transform", "translateY(" + trackTransformPercentage + "%)");
            $(trackControl).css("transition", "transform 0.4s ease");
            $(trackControl).css("transform", "translateY(" + trackTransformPercentage + "%)");
            $(trackItself).css("transition", "transform 0.4s ease");
            $(trackItself).css("transform", "translateY(" + trackTransformPercentage + "%)");

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
                let affectedHeader = $(Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timelineHeaders).children().get(i);
                let affectedControl = $(Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timelineDetails).children().get(i);
                let affectedTrack = $(Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timelineTracks).children().get(i);
                
                let trackNum = $(affectedHeader).find(".trackNum");
                $(trackNum).text(parseInt($(trackNum).text(), 10) + affectedDif);

                $(affectedHeader).css("transition", "transform 0.4s ease");
                $(affectedHeader).css("transform", "translateY(" + affectedTransformPercentage + "%)");
                $(affectedControl).css("transition", "transform 0.4s ease");
                $(affectedControl).css("transform", "translateY(" + affectedTransformPercentage + "%)");
                $(affectedTrack).css("transition", "transform 0.4s ease");
                $(affectedTrack).css("transform", "translateY(" + affectedTransformPercentage + "%)");
            }

            setTimeout(function (event) {
                console.log("Move animation finished. Update DOM order.");
                let trackHeader = $("#" + Ensemble.Editor.TimelineMGR._buildTrackHeaderId(Ensemble.Editor.TimelineMGR._trackEditId));
                let trackControl = $("#" + Ensemble.Editor.TimelineMGR._buildTrackDetailId(Ensemble.Editor.TimelineMGR._trackEditId));
                let trackItself = $("#" + Ensemble.Editor.TimelineMGR._buildTrackDOMId(Ensemble.Editor.TimelineMGR._trackEditId));

                let headerDestEl = $(".timeline-track--header")[destination]
                let controlDestEl = $(".timeline-track--controls")[destination];
                let trackDestEl = $(".timeline-track--content")[destination];

                $(".timeline-track").css("transition", "");
                $(".timeline-track").css("transform", "");
                if (destination != Ensemble.Editor.TimelineMGR.tracks.length) {
                    $(trackHeader).insertBefore($(headerDestEl));
                    $(trackControl).insertBefore($(controlDestEl));
                    $(trackItself).insertBefore($(trackDestEl));
                }
                else {
                    $(trackHeader).insertAfter($(headerDestEl));
                    $(trackControl).insertAfter($(controlDestEl));
                    $(trackItself).insertAfter($(trackDestEl));
                }
            }, 400);

            //Update model
            var movingItem = this.tracks.splice(origin, 1)[0];
            this.tracks.splice(destination, 0, movingItem);
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
            var tracks = document.getElementsByClassName("timeline-track--content");
            var details = document.getElementsByClassName("timeline-track--controls");
            var headers = document.getElementsByClassName("timeline-track--header");
            //var trackHeight = Math.floor(Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timeline.clientHeight / Ensemble.Settings.getEditorTimelineRowsVisible()) + "px";
            var trackHeight = "100px";
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

            //Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timeline.style.backgroundSize = "100px " + valueToSet + ";"
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
            //Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timeline.innerHTML = "";
            this.tracks = [];
            this._uniqueTrackID = 0;
        },

        _buildTrackDisplay: function (track) {
            /// <param name="track" type="Ensemble.Editor.Track">The track to represent on the timeline.</param>
            var trackNumber = Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timelineHeaders.childNodes.length + 1;
            //var trackHeight = Math.floor(Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timeline.clientHeight / Ensemble.Settings.getEditorTimelineRowsVisible()) + "px";
            var trackHeight = "100px";

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

            trackDetailControls.appendChild(renameControl);
            trackDetailControls.appendChild(volumeControl);
            trackDetailControls.appendChild(moveControl);
            trackDetailControls.appendChild(deleteControl);

            trackDetail.appendChild(trackDetailName);
            trackDetail.appendChild(trackDetailControls);

            var trackContent = document.createElement("div");
            trackContent.className = "timeline-track timeline-track--content";
            trackContent.style.height = trackHeight;
            trackContent.innerText = "Track content here.";
            trackContent.id = this._buildTrackDOMId(track.id);

            var trackContainer = document.createElement("div");
            trackContainer.className = "timeline-track";
            trackContainer.style.height = trackHeight;

            //trackContainer.appendChild(trackHeader);
            //trackContainer.appendChild(trackDetail);
            //trackContainer.appendChild(trackContent);

            //Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timeline.appendChild(trackContainer);

            Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timelineHeaders.appendChild(trackHeader);
            Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timelineDetails.appendChild(trackDetail);
            Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timelineTracks.appendChild(trackContent);
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
                        trackId: Ensemble.Editor.TimelineMGR._trackEditId,
                        oldVolume: Ensemble.Editor.TimelineMGR._trackVolumeRollback,
                        newVolume: $(Ensemble.Pages.Editor.UI.UserInput.Flyouts.trackVolume).find("input").val() / 100
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

            Ensemble.Pages.Editor.UI.UserInput.Buttons.moveTrackToTop.winControl.disabled = !(top);
            Ensemble.Pages.Editor.UI.UserInput.Buttons.moveTrackUp.winControl.disabled = !(up);
            Ensemble.Pages.Editor.UI.UserInput.Buttons.moveTrackDown.winControl.disabled = !(down);
            Ensemble.Pages.Editor.UI.UserInput.Buttons.moveTrackToBottom.winControl.disabled = !(bottom);

            $(Ensemble.Pages.Editor.UI.UserInput.Buttons.moveTrackToTop).click(Ensemble.Editor.TimelineMGR._moveCurrentTrackToTop);
            $(Ensemble.Pages.Editor.UI.UserInput.Buttons.moveTrackUp).click(Ensemble.Editor.TimelineMGR._moveCurrentTrackUp);
            $(Ensemble.Pages.Editor.UI.UserInput.Buttons.moveTrackDown).click(Ensemble.Editor.TimelineMGR._moveCurrentTrackDown);
            $(Ensemble.Pages.Editor.UI.UserInput.Buttons.moveTrackToBottom).click(Ensemble.Editor.TimelineMGR._moveCurrentTrackToBottom);

            Ensemble.Pages.Editor.UI.UserInput.Flyouts.moveTrack.winControl.show(event.currentTarget);
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

        _finishTrackMove: function (destinationIndex) {
            $(Ensemble.Pages.Editor.UI.UserInput.Buttons.moveTrackToTop).unbind("click");
            $(Ensemble.Pages.Editor.UI.UserInput.Buttons.moveTrackUp).unbind("click");
            $(Ensemble.Pages.Editor.UI.UserInput.Buttons.moveTrackDown).unbind("click");
            $(Ensemble.Pages.Editor.UI.UserInput.Buttons.moveTrackToBottom).unbind("click");
            var trackMoveOption = new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.moveTrack,
                {
                    trackId: Ensemble.Editor.TimelineMGR._trackEditId,
                    origin: Ensemble.Editor.TimelineMGR.tracks.indexOf(Ensemble.Editor.TimelineMGR.getTrackById(Ensemble.Editor.TimelineMGR._trackEditId)),
                    destination: destinationIndex
                }
            );
            Ensemble.HistoryMGR.performAction(trackMoveOption);
        }
    });
})();