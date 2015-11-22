(function () {
    WinJS.Namespace.define("Ensemble.FileIO", {
        /// <summary>Provides platform-agnostic interfaces for accessing the host device's file system.</summary>

        supportedVideoTypes: [".3g2", ".3gp2", ".3gp", ".3gpp", ".m4v", ".mp4v", ".mp4", ".mov", ".m2ts", ".asf", ".wm", ".wmv", ".avi"],
        supportedAudioTypes: [".m4a", ".wma", ".aac", ".adt", ".adts", ".mp3", ".wav", ".ac3", ".ec3"],
        supportedImageTypes: [".jpg", ".jpeg", ".png", ".gif", ".bmp"],

        _clipLoadBuffer: {},

        _createProjectCallback: null,
        _createProjectRes: null,
        _createProjectComposition: null,
        _createProjectData: {
            callback: null,
            resolution: {width: 0, height: 0},
            composition: new Windows.Media.Editing.MediaComposition(),
            name: "",
            aspect: ""
        },

        _projectLoadBuffer: {},
        _projectClipsFullyLoaded: 0,

        _pickItemsCallback: null,
        _pickItemsTempFiles: [],
        _pickItemsTempFilesCount: 0,
        _pickItemsTempFolders: [],
        _pickItemsTempFoldersCount: 0,

        _multiClipLoadTotal: 0,
        _multiClipLoadCb: null,
        _multiClipLoadBuffer: [],

        saveProject: function (overrideFile) {
            /// <summary>Saves the currently loaded project to disk.</summary>
            /// <param name="overrideFile" type="Windows.Storage.StorageFile">Optional. A target for the save operation.</param>

            //Generate XML string
            var xml = new XMLWriter();
            xml.BeginNode("EnsembleOfOneProject");

            xml.BeginNode("ProjectThumb");
            Ensemble.Editor.Renderer.updateThumb();
            xml.WriteString(Ensemble.Session.projectThumb);
            xml.EndNode();

            xml.BeginNode("TimelineZoom");
            xml.WriteString(Ensemble.Editor.TimelineZoomMGR.currentLevel.toString());
            xml.EndNode();

            xml.BeginNode("DateCreated");
            xml.WriteString(Ensemble.Session.projectDateCreated.getTime().toString());
            xml.EndNode();

            xml.BeginNode("DateModified");
            xml.WriteString(Date.now().toString(10));
            xml.EndNode();

            xml.BeginNode("NumberOfClips");
            xml.WriteString(Ensemble.Session.projectClipCount.toString());
            xml.EndNode();

            xml.BeginNode("AspectRatio");
            xml.WriteString(Ensemble.Session.projectAspect);
            xml.EndNode();

            xml.BeginNode("Resolution");
            xml.Attrib("width", Ensemble.Session.projectResolution.width.toString());
            xml.Attrib("height", Ensemble.Session.projectResolution.height.toString());
            xml.EndNode();

            xml.BeginNode("ProjectLength");
            xml.WriteString(Ensemble.Session.projectDuration.toString());
            xml.EndNode();

            xml.BeginNode("Tracks");
            xml.Attrib("FreeTrackId", Ensemble.Editor.TimelineMGR._uniqueTrackID.toString());
            xml.Attrib("FreeClipId", Ensemble.Editor.TimelineMGR._uniqueClipID.toString());
            //Write track data
            if (Ensemble.Session.projectTrackCount == 0) xml.WriteString("");
            else {
                for (var i = 0; i < Ensemble.Session.projectTrackCount; i++) {
                    xml = Ensemble.FileIO._writeTrackToXML(xml, Ensemble.Editor.TimelineMGR.tracks[i]);
                }
            }
            xml.EndNode();

            xml.BeginNode("History");
            xml.BeginNode("Undo");
            if (Ensemble.HistoryMGR.canUndo()) {
                for (var i = 0; i < Ensemble.HistoryMGR._backStack.length; i++) {
                    xml.BeginNode("HistoryAction");
                    if (Ensemble.HistoryMGR._backStack[i]._type == Ensemble.Events.Action.ActionType.createTrack) {
                        xml.Attrib("type", Ensemble.HistoryMGR._backStack[i]._type);
                        xml.Attrib("trackId", Ensemble.HistoryMGR._backStack[i]._payload.trackId.toString());
                    }

                    else if (Ensemble.HistoryMGR._backStack[i]._type == Ensemble.Events.Action.ActionType.renameTrack) {
                        xml.Attrib("type", Ensemble.HistoryMGR._backStack[i]._type);
                        xml.Attrib("trackId", Ensemble.HistoryMGR._backStack[i]._payload.trackId.toString());
                        xml.Attrib("oldName", Ensemble.HistoryMGR._backStack[i]._payload.oldName);
                        xml.Attrib("newName", Ensemble.HistoryMGR._backStack[i]._payload.newName);
                    }

                    else if (Ensemble.HistoryMGR._backStack[i]._type == Ensemble.Events.Action.ActionType.trackVolumeChanged) {
                        xml.Attrib("type", Ensemble.HistoryMGR._backStack[i]._type);
                        xml.Attrib("trackId", Ensemble.HistoryMGR._backStack[i]._payload.trackId.toString());
                        xml.Attrib("oldVolume", Ensemble.HistoryMGR._backStack[i]._payload.oldVolume.toString());
                        xml.Attrib("newVolume", Ensemble.HistoryMGR._backStack[i]._payload.newVolume.toString());
                    }

                    else if (Ensemble.HistoryMGR._backStack[i]._type == Ensemble.Events.Action.ActionType.moveTrack) {
                        xml.Attrib("type", Ensemble.HistoryMGR._backStack[i]._type);
                        xml.Attrib("trackId", Ensemble.HistoryMGR._backStack[i]._payload.trackId.toString());
                        xml.Attrib("origin", Ensemble.HistoryMGR._backStack[i]._payload.origin.toString());
                        xml.Attrib("destination", Ensemble.HistoryMGR._backStack[i]._payload.destination.toString());
                    }

                    else if (Ensemble.HistoryMGR._backStack[i]._type == Ensemble.Events.Action.ActionType.removeTrack) {
                        xml.Attrib("type", Ensemble.HistoryMGR._backStack[i]._type);
                        xml.Attrib("trackId", Ensemble.HistoryMGR._backStack[i]._payload.trackId.toString());
                        xml.Attrib("originalLocation", Ensemble.HistoryMGR._backStack[i]._payload.originalLocation.toString())
                        xml = Ensemble.FileIO._writeTrackToXML(xml, Ensemble.HistoryMGR._backStack[i]._payload.trackObj);
                    }

                    else if (Ensemble.HistoryMGR._backStack[i]._type == Ensemble.Events.Action.ActionType.importClip) {
                        xml.Attrib("type", Ensemble.HistoryMGR._backStack[i]._type);
                        xml.Attrib("clipId", Ensemble.HistoryMGR._backStack[i]._payload.clipId.toString());
                    }

                    else if (Ensemble.HistoryMGR._backStack[i]._type == Ensemble.Events.Action.ActionType.removeClip) {
                        xml.Attrib("type", Ensemble.HistoryMGR._backStack[i]._type);
                        for (let k = 0; k < Ensemble.HistoryMGR._backStack[i]._payload.clipObjs.length; k++) {
                            xml.BeginNode("RemovedClip");
                            xml.Attrib("trackId", Ensemble.HistoryMGR._backStack[i]._payload.trackLocations[k].toString());
                            xml = Ensemble.FileIO._writeClipToXML(xml, Ensemble.HistoryMGR._backStack[i]._payload.clipObjs[k]);
                            xml.EndNode();
                        }
                    }

                    else if (Ensemble.HistoryMGR._backStack[i]._type == Ensemble.Events.Action.ActionType.moveClip) {
                        xml.Attrib("type", Ensemble.HistoryMGR._backStack[i]._type);
                        let destTracks = Ensemble.HistoryMGR._backStack[i]._payload.destinationTracks;
                        let destTimes = Ensemble.HistoryMGR._backStack[i]._payload.destinationTimes;
                        let origTracks = Ensemble.HistoryMGR._backStack[i]._payload.originalTracks;
                        let origTimes = Ensemble.HistoryMGR._backStack[i]._payload.originalTimes;
                        let ids = Ensemble.HistoryMGR._backStack[i]._payload.clipIds;
                        for (let k = 0; k < ids.length; k++) {
                            xml.BeginNode("MovedClip");
                            xml.Attrib("clipId", ids[k].toString());
                            xml.Attrib("destinationTrack", destTracks[k].toString());
                            xml.Attrib("destinationTime", destTimes[k].toString());
                            xml.Attrib("originalTrack", origTracks[k].toString());
                            xml.Attrib("originalTime", origTimes[k].toString());
                            xml.EndNode();
                        }
                    }

                    else if (Ensemble.HistoryMGR._backStack[i]._type == Ensemble.Events.Action.ActionType.trimClip) {
                        xml.Attrib("type", Ensemble.HistoryMGR._backStack[i]._type);
                        xml.Attrib("newStartTime", Ensemble.HistoryMGR._backStack[i]._payload.newStartTime.toString());
                        xml.Attrib("newDuration", Ensemble.HistoryMGR._backStack[i]._payload.newDuration.toString());
                        xml.Attrib("newStartTrim", Ensemble.HistoryMGR._backStack[i]._payload.newStartTrim.toString());
                        xml.Attrib("newEndTrim", Ensemble.HistoryMGR._backStack[i]._payload.newEndTrim.toString());
                        xml.Attrib("oldStartTrim", Ensemble.HistoryMGR._backStack[i]._payload.oldStartTrim.toString());
                        xml.Attrib("oldEndTrim", Ensemble.HistoryMGR._backStack[i]._payload.oldEndTrim.toString());
                        xml.Attrib("oldDuration", Ensemble.HistoryMGR._backStack[i]._payload.oldDuration.toString());
                        xml.Attrib("oldStartTime", Ensemble.HistoryMGR._backStack[i]._payload.oldStartTime.toString());
                    }

                    else if (Ensemble.HistoryMGR._backStack[i]._type == Ensemble.Events.Action.ActionType.splitClip) {
                        xml.Attrib("type", Ensemble.HistoryMGR._backStack[i]._type);
                        let clipIds = Ensemble.HistoryMGR._backStack[i]._payload.clipIds;
                        let newIds = Ensemble.HistoryMGR._backStack[i]._payload.newIds;
                        xml.Attrib("time", Ensemble.HistoryMGR._backStack[i]._payload.time.toString());
                        for (let k = 0; k < clipIds.length; k++) {
                            xml.BeginNode("SplitClip");
                            xml.Attrib("clipId", clipIds[k].toString());
                            xml.Attrib("newId", newIds[k].toString());
                            xml.EndNode();
                        }
                    }

                    else if (Ensemble.HistoryMGR._backStack[i]._type == Ensemble.Events.Action.ActionType.positionClip) {
                        xml.Attrib("type", Ensemble.HistoryMGR._backStack[i]._type);
                        let ids = Ensemble.HistoryMGR._backStack[i]._payload.clipIds;
                        let newX = Ensemble.HistoryMGR._backStack[i]._payload.newX;
                        let newY = Ensemble.HistoryMGR._backStack[i]._payload.newY;
                        let newWidth = Ensemble.HistoryMGR._backStack[i]._payload.newWidth;
                        let newHeight = Ensemble.HistoryMGR._backStack[i]._payload.newHeight;
                        let oldX = Ensemble.HistoryMGR._backStack[i]._payload.oldX;
                        let oldY = Ensemble.HistoryMGR._backStack[i]._payload.oldY;
                        let oldWidth = Ensemble.HistoryMGR._backStack[i]._payload.oldWidth;
                        let oldHeight = Ensemble.HistoryMGR._backStack[i]._payload.oldHeight;

                        for (let k = 0; k < ids.length; k++) {
                            xml.BeginNode("PositionedClip");
                            xml.Attrib("clipId", ids[k].toString());
                            xml.Attrib("newX", newX[k].toString());
                            xml.Attrib("newY", newY[k].toString());
                            xml.Attrib("newWidth", newWidth[k].toString());
                            xml.Attrib("newHeight", newHeight[k].toString());
                            xml.Attrib("oldX", oldX[k].toString());
                            xml.Attrib("oldY", oldY[k].toString());
                            xml.Attrib("oldWidth", oldWidth[k].toString());
                            xml.Attrib("oldHeight", oldHeight[k].toString());
                            xml.EndNode();
                        }
                    }

                    else if (Ensemble.HistoryMGR._backStack[i]._type == Ensemble.Events.Action.ActionType.renameClip) {
                        xml.Attrib("type", Ensemble.HistoryMGR._backStack[i]._type);
                        xml.Attrib("clipId", Ensemble.HistoryMGR._backStack[i]._payload.clipId.toString());
                        xml.Attrib("oldName", Ensemble.HistoryMGR._backStack[i]._payload.oldName);
                        xml.Attrib("newName", Ensemble.HistoryMGR._backStack[i]._payload.newName);
                    }

                    else if (Ensemble.HistoryMGR._backStack[i]._type == Ensemble.Events.Action.ActionType.clipVolumeChanged) {
                        xml.Attrib("type", Ensemble.HistoryMGR._backStack[i]._type);
                        xml.Attrib("clipId", Ensemble.HistoryMGR._backStack[i]._payload.clipId.toString());
                        xml.Attrib("oldVolume", Ensemble.HistoryMGR._backStack[i]._payload.oldVolume.toString());
                        xml.Attrib("newVolume", Ensemble.HistoryMGR._backStack[i]._payload.newVolume.toString());
                    }

                    else if (Ensemble.HistoryMGR._backStack[i]._type == Ensemble.Events.Action.ActionType.createLens) {
                        xml.Attrib("type", Ensemble.HistoryMGR._backStack[i]._type);
                        xml.Attrib("lensId", Ensemble.HistoryMGR._backStack[i]._payload.lensId.toString());
                        xml.Attrib("lensType", Ensemble.HistoryMGR._backStack[i]._payload.lensType);
                        xml.Attrib("destinationTrack", Ensemble.HistoryMGR._backStack[i]._payload.destinationTrack.toString());
                        xml.Attrib("destinationTime", Ensemble.HistoryMGR._backStack[i]._payload.destinationTime.toString());
                    }

                    else if (Ensemble.HistoryMGR._backStack[i]._type == Ensemble.Events.Action.ActionType.editLens) {
                        xml.Attrib("type", Ensemble.HistoryMGR._backStack[i]._type);
                        xml.Attrib("lensId", Ensemble.HistoryMGR._backStack[i]._payload.lensId.toString());
                        xml.Attrib("oldEffectDetails", JSON.stringify(Ensemble.HistoryMGR._backStack[i]._payload.oldEffectDetails));
                        xml.Attrib("newEffectDetails", JSON.stringify(Ensemble.HistoryMGR._backStack[i]._payload.newEffectDetails));
                    }

                    else console.error("Unable to save History Action to disk - unknown type.");
                    xml.EndNode();
                }
            }
            else xml.WriteString("");
            xml.EndNode();

            xml.BeginNode("Redo");
            if (Ensemble.HistoryMGR.canRedo()) {
                for (var i = 0; i < Ensemble.HistoryMGR._forwardStack.length; i++) {
                    xml.BeginNode("HistoryAction");
                    if (Ensemble.HistoryMGR._forwardStack[i]._type == Ensemble.Events.Action.ActionType.createTrack) {
                        xml.Attrib("type", Ensemble.HistoryMGR._forwardStack[i]._type);
                        xml.Attrib("trackId", Ensemble.HistoryMGR._forwardStack[i]._payload.trackId.toString());
                    }

                    else if (Ensemble.HistoryMGR._forwardStack[i]._type == Ensemble.Events.Action.ActionType.renameTrack) {
                        xml.Attrib("type", Ensemble.HistoryMGR._forwardStack[i]._type);
                        xml.Attrib("trackId", Ensemble.HistoryMGR._forwardStack[i]._payload.trackId.toString());
                        xml.Attrib("oldName", Ensemble.HistoryMGR._forwardStack[i]._payload.oldName);
                        xml.Attrib("newName", Ensemble.HistoryMGR._forwardStack[i]._payload.newName);
                    }

                    else if (Ensemble.HistoryMGR._forwardStack[i]._type == Ensemble.Events.Action.ActionType.trackVolumeChanged) {
                        xml.Attrib("type", Ensemble.HistoryMGR._forwardStack[i]._type);
                        xml.Attrib("trackId", Ensemble.HistoryMGR._forwardStack[i]._payload.trackId.toString());
                        xml.Attrib("oldVolume", Ensemble.HistoryMGR._forwardStack[i]._payload.oldVolume.toString());
                        xml.Attrib("newVolume", Ensemble.HistoryMGR._forwardStack[i]._payload.newVolume.toString());
                    }

                    else if (Ensemble.HistoryMGR._forwardStack[i]._type == Ensemble.Events.Action.ActionType.moveTrack) {
                        xml.Attrib("type", Ensemble.HistoryMGR._forwardStack[i]._type);
                        xml.Attrib("trackId", Ensemble.HistoryMGR._forwardStack[i]._payload.trackId.toString());
                        xml.Attrib("origin", Ensemble.HistoryMGR._forwardStack[i]._payload.origin.toString());
                        xml.Attrib("destination", Ensemble.HistoryMGR._forwardStack[i]._payload.destination.toString());
                    }

                    else if (Ensemble.HistoryMGR._forwardStack[i]._type == Ensemble.Events.Action.ActionType.removeTrack) {
                        xml.Attrib("type", Ensemble.HistoryMGR._forwardStack[i]._type);
                        xml.Attrib("trackId", Ensemble.HistoryMGR._forwardStack[i]._payload.trackId.toString());
                    }

                    else if (Ensemble.HistoryMGR._forwardStack[i]._type == Ensemble.Events.Action.ActionType.importClip) {
                        xml.Attrib("type", Ensemble.HistoryMGR._forwardStack[i]._type);
                        xml.Attrib("destinationTrack", Ensemble.HistoryMGR._forwardStack[i]._payload.destinationTrack.toString());
                        xml = Ensemble.FileIO._writeClipToXML(xml, Ensemble.HistoryMGR._forwardStack[i]._payload.clipObj);
                    }

                    else if (Ensemble.HistoryMGR._forwardStack[i]._type == Ensemble.Events.Action.ActionType.removeClip) {
                        xml.Attrib("type", Ensemble.HistoryMGR._forwardStack[i]._type);
                        for (let k = 0; k < Ensemble.HistoryMGR._forwardStack[i]._payload.clipIds.length; k++) {
                            xml.BeginNode("RemovedClip");
                            xml.Attrib("clipId", Ensemble.HistoryMGR._forwardStack[i]._payload.clipIds[k].toString());
                            xml.EndNode();
                        }
                    }

                    else if (Ensemble.HistoryMGR._forwardStack[i]._type == Ensemble.Events.Action.ActionType.moveClip) {
                        xml.Attrib("type", Ensemble.HistoryMGR._forwardStack[i]._type);
                        let destTracks = Ensemble.HistoryMGR._forwardStack[i]._payload.destinationTracks;
                        let destTimes = Ensemble.HistoryMGR._forwardStack[i]._payload.destinationTimes;
                        let origTracks = Ensemble.HistoryMGR._forwardStack[i]._payload.originalTracks;
                        let origTimes = Ensemble.HistoryMGR._forwardStack[i]._payload.originalTimes;
                        let ids = Ensemble.HistoryMGR._forwardStack[i]._payload.clipIds;
                        for (let k = 0; k < ids.length; k++) {
                            xml.BeginNode("MovedClip");
                            xml.Attrib("clipId", ids[k].toString());
                            xml.Attrib("destinationTrack", destTracks[k].toString());
                            xml.Attrib("destinationTime", destTimes[k].toString());
                            xml.Attrib("originalTrack", origTracks[k].toString());
                            xml.Attrib("originalTime", origTimes[k].toString());
                            xml.EndNode();
                        }
                    }

                    else if (Ensemble.HistoryMGR._forwardStack[i]._type == Ensemble.Events.Action.ActionType.trimClip) {
                        xml.Attrib("type", Ensemble.HistoryMGR._forwardStack[i]._type);
                        xml.Attrib("newStartTime", Ensemble.HistoryMGR._forwardStack[i]._payload.newStartTime.toString());
                        xml.Attrib("newDuration", Ensemble.HistoryMGR._forwardStack[i]._payload.newDuration.toString());
                        xml.Attrib("newStartTrim", Ensemble.HistoryMGR._forwardStack[i]._payload.newStartTrim.toString());
                        xml.Attrib("newEndTrim", Ensemble.HistoryMGR._forwardStack[i]._payload.newEndTrim.toString());
                        xml.Attrib("oldStartTrim", Ensemble.HistoryMGR._forwardStack[i]._payload.oldStartTrim.toString());
                        xml.Attrib("oldEndTrim", Ensemble.HistoryMGR._forwardStack[i]._payload.oldEndTrim.toString());
                        xml.Attrib("oldDuration", Ensemble.HistoryMGR._forwardStack[i]._payload.oldDuration.toString());
                        xml.Attrib("oldStartTime", Ensemble.HistoryMGR._forwardStack[i]._payload.oldStartTime.toString());
                    }

                    else if (Ensemble.HistoryMGR._forwardStack[i]._type == Ensemble.Events.Action.ActionType.splitClip) {
                        xml.Attrib("type", Ensemble.HistoryMGR._forwardStack[i]._type);
                        let clipIds = Ensemble.HistoryMGR._forwardStack[i]._payload.clipIds;
                        let newIds = Ensemble.HistoryMGR._forwardStack[i]._payload.newIds;
                        xml.Attrib("time", Ensemble.HistoryMGR._forwardStack[i]._payload.time.toString());
                        for (let k = 0; k < clipIds.length; k++) {
                            xml.BeginNode("SplitClip");
                            xml.Attrib("clipId", clipIds[k].toString());
                            xml.Attrib("newId", newIds[k].toString());
                            xml.EndNode();
                        }
                    }

                    else if (Ensemble.HistoryMGR._forwardStack[i]._type == Ensemble.Events.Action.ActionType.positionClip) {
                        xml.Attrib("type", Ensemble.HistoryMGR._forwardStack[i]._type);
                        let ids = Ensemble.HistoryMGR._forwardStack[i]._payload.clipIds;
                        let newX = Ensemble.HistoryMGR._forwardStack[i]._payload.newX;
                        let newY = Ensemble.HistoryMGR._forwardStack[i]._payload.newY;
                        let newWidth = Ensemble.HistoryMGR._forwardStack[i]._payload.newWidth;
                        let newHeight = Ensemble.HistoryMGR._forwardStack[i]._payload.newHeight;
                        let oldX = Ensemble.HistoryMGR._forwardStack[i]._payload.oldX;
                        let oldY = Ensemble.HistoryMGR._forwardStack[i]._payload.oldY;
                        let oldWidth = Ensemble.HistoryMGR._forwardStack[i]._payload.oldWidth;
                        let oldHeight = Ensemble.HistoryMGR._forwardStack[i]._payload.oldHeight;

                        for (let k = 0; k < ids.length; k++) {
                            xml.BeginNode("PositionedClip");
                            xml.Attrib("clipId", ids[k].toString());
                            xml.Attrib("newX", newX[k].toString());
                            xml.Attrib("newY", newY[k].toString());
                            xml.Attrib("newWidth", newWidth[k].toString());
                            xml.Attrib("newHeight", newHeight[k].toString());
                            xml.Attrib("oldX", oldX[k].toString());
                            xml.Attrib("oldY", oldY[k].toString());
                            xml.Attrib("oldWidth", oldWidth[k].toString());
                            xml.Attrib("oldHeight", oldHeight[k].toString());
                            xml.EndNode();
                        }
                    }

                    else if (Ensemble.HistoryMGR._forwardStack[i]._type == Ensemble.Events.Action.ActionType.renameClip) {
                        xml.Attrib("type", Ensemble.HistoryMGR._forwardStack[i]._type);
                        xml.Attrib("clipId", Ensemble.HistoryMGR._forwardStack[i]._payload.clipId.toString());
                        xml.Attrib("oldName", Ensemble.HistoryMGR._forwardStack[i]._payload.oldName);
                        xml.Attrib("newName", Ensemble.HistoryMGR._forwardStack[i]._payload.newName);
                    }

                    else if (Ensemble.HistoryMGR._forwardStack[i]._type == Ensemble.Events.Action.ActionType.clipVolumeChanged) {
                        xml.Attrib("type", Ensemble.HistoryMGR._forwardStack[i]._type);
                        xml.Attrib("clipId", Ensemble.HistoryMGR._forwardStack[i]._payload.clipId.toString());
                        xml.Attrib("oldVolume", Ensemble.HistoryMGR._forwardStack[i]._payload.oldVolume.toString());
                        xml.Attrib("newVolume", Ensemble.HistoryMGR._forwardStack[i]._payload.newVolume.toString());
                    }

                    else if (Ensemble.HistoryMGR._forwardStack[i]._type == Ensemble.Events.Action.ActionType.createLens) {
                        xml.Attrib("type", Ensemble.HistoryMGR._forwardStack[i]._type);
                        xml.Attrib("lensId", Ensemble.HistoryMGR._forwardStack[i]._payload.lensId.toString());
                        xml.Attrib("lensType", Ensemble.HistoryMGR._forwardStack[i]._payload.lensType);
                        xml.Attrib("destinationTrack", Ensemble.HistoryMGR._forwardStack[i]._payload.destinationTrack.toString());
                        xml.Attrib("destinationTime", Ensemble.HistoryMGR._forwardStack[i]._payload.destinationTime.toString());
                    }

                    else if (Ensemble.HistoryMGR._forwardStack[i]._type == Ensemble.Events.Action.ActionType.editLens) {
                        xml.Attrib("type", Ensemble.HistoryMGR._forwardStack[i]._type);
                        xml.Attrib("lensId", Ensemble.HistoryMGR._forwardStack[i]._payload.lensId.toString());
                        xml.Attrib("oldEffectDetails", JSON.stringify(Ensemble.HistoryMGR._forwardStack[i]._payload.oldEffectDetails));
                        xml.Attrib("newEffectDetails", JSON.stringify(Ensemble.HistoryMGR._forwardStack[i]._payload.newEffectDetails));
                    }

                    else {
                        console.error("Unable to save History Action to disk - unknown type.");
                    }
                    xml.EndNode();
                }
            }
            else xml.WriteString("");
            xml.EndNode();
            xml.EndNode();

            xml.EndNode();
            xml.Close();

            xml = xml.ToString();
            
            if (overrideFile) {
                Windows.Storage.FileIO.writeTextAsync(overrideFile, xml).then(function (complete) {
                    if (Ensemble.Session.projectFileInApp) {
                        // Remove the old project file from internal storage
                        Ensemble.Session.projectFile.deleteAsync(Windows.Storage.StorageDeleteOption.permanentDelete).done(function () {
                            Ensemble.FileIO.removeRecentProject(Ensemble.Session.projectFile);
                            Ensemble.FileIO.addOrReplaceRecentProject(overrideFile);
                            Ensemble.Session.projectFile = overrideFile;
                            Ensemble.Session.projectFileInApp = false;
                        });
                    }
                    else {
                        Ensemble.Session.projectFile = overrideFile;
                    }
                });
            }

            else {
                Windows.Storage.FileIO.writeTextAsync(Ensemble.Session.projectFile, xml).done(function (complete) {
                    console.info("Saved " + Ensemble.Session.projectName + ".");
                });
            }
        },

        requestSaveAs: function () {
            /// <summary>Show a "Save as..." dialog to the user.</summary>
            let savePicker = new Windows.Storage.Pickers.FileSavePicker();
            savePicker.suggestedFileName = Ensemble.Session.projectName;
            savePicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.desktop;
            savePicker.fileTypeChoices.insert("Ensemble of One Project", [".eo1"]);
            savePicker.pickSaveFileAsync().then(Ensemble.FileIO._confirmSaveAs)
        },

        _confirmSaveAs: function (file) {
            /// <summary>Return function for the save as picker.</summary>
            /// <param name="file" type="Windows.Storage.StorageFile">The file picked by the user.</param>
            if (file) {
                Ensemble.FileIO.saveProject(file);
                let appView = Windows.UI.ViewManagement.ApplicationView.getForCurrentView();
                appView.title = file.displayName;
            }
        },

        _writeTrackToXML: function (xml, track) {
            /// <summary>Writes XML data for the given track to the XML file.</summary>
            /// <param name="xml" type="XMLWriter">The XML writer.</param>
            /// <param name="track" type="Ensemble.Editor.Track">The Track to save.</param>
            /// <returns type="XMLWriter">The updated XML writer, including the new Track.</returns>
            xml.BeginNode("Track");
            xml.Attrib("trackId", track.id.toString());
            xml.Attrib("trackName", track.name);
            xml.Attrib("trackVolume", track.volume.toString());

            //Write clip data
            if (track.clips.length == 0) xml.WriteString("");
            else {
                for (var k = 0; k < track.clips.length; k++) {
                    xml = this._writeClipToXML(xml, track.clips[k])
                }
            }
            xml.EndNode();

            return xml;
        },

        _writeClipToXML: function (xml, clip) {
            /// <summary>Writes XML data for the given track to the XML file.</summary>
            /// <param name="xml" type="XMLWriter">The XML writer.</param>
            /// <param name="clip" type="Ensemble.Editor.Clip">The Clip to save.</param>
            /// <returns type="XMLWriter">The updated XML writer, including the new Clip.</returns>
            xml.BeginNode("Clip");
            xml.Attrib("id", clip.id.toString());
            xml.Attrib("type", clip.type);
            xml.Attrib("name", clip.name);
            xml.Attrib("volume", clip.volume.toString());
            xml.Attrib("start", clip.startTime.toString());
            xml.Attrib("duration", clip.duration.toString());
            xml.Attrib("startTrim", clip.startTrim.toString());
            xml.Attrib("endTrim", clip.endTrim.toString());
            xml.Attrib("xcoord", clip.xcoord.toString());
            xml.Attrib("ycoord", clip.ycoord.toString());
            xml.Attrib("width", clip.width.toString());
            xml.Attrib("height", clip.height.toString());
            xml.Attrib("aspect", Ensemble.Utilities.AspectGenerator.calcAspect(clip.width, clip.height).toString());
            xml.Attrib("path", clip.type == Ensemble.Editor.Clip.ClipType.lens ? "" : clip.file.path);
            xml.Attrib("token", clip.type == Ensemble.Editor.Clip.ClipType.lens ? "" : clip.file.token);
            xml.Attrib("effectDetails", clip.type == Ensemble.Editor.Clip.ClipType.lens ? JSON.stringify(clip.effectDetails) : "");
            xml.EndNode();
            return xml;
        },

        createProject: function (name, aspect, callback) {
            /// <summary>Creates save files for a new project.</summary>
            /// <param name="name" type="String">The name of the project.</param>
            /// <param name="aspect" type="String">The aspect ratio of the project (16:9, 4:3, etc.).</param>
            Ensemble.FileIO._createProjectData.resolution = Ensemble.Settings.getDefaultResolution(aspect);
            Ensemble.FileIO._createProjectData.composition = new Windows.Media.Editing.MediaComposition();
            Ensemble.FileIO._createProjectData.callback = callback;
            Ensemble.FileIO._createProjectData.name = name;
            Ensemble.FileIO._createProjectData.aspect = aspect;

            let fillerImageFilename = Ensemble.FileIO._createProjectData.resolution.width + "x" + Ensemble.FileIO._createProjectData.resolution.height + ".png";
            Windows.Storage.StorageFile.getFileFromApplicationUriAsync(new Windows.Foundation.Uri("ms-appx:///img/compositionFillers/" + fillerImageFilename)).then(function (fillerImage) {
                Windows.Media.Editing.MediaClip.createFromImageFileAsync(fillerImage, 0).then(function (fillerMediaClip) {
                    Ensemble.FileIO._createProjectData.composition.clips.append(fillerMediaClip);
                    Ensemble.FileIO._createProjectData.composition.overlayLayers.append(new Windows.Media.Editing.MediaOverlayLayer());
                    Windows.Storage.ApplicationData.current.temporaryFolder.createFileAsync("tmp.cmp", Windows.Storage.CreationCollisionOption.generateUniqueName).then(function (compositionFile) {
                        Ensemble.FileIO._createProjectData.composition.saveAsync(compositionFile).then(function () {
                            Windows.Storage.FileIO.readTextAsync(compositionFile).done(function (compositionXML) {
                                let parser = new DOMParser(),
                                    xmlDoc = parser.parseFromString(compositionXML, "text/xml");
                                Ensemble.FileIO._generateNewProjectFile(xmlDoc);
                            });
                        });
                    });
                });
            });
        },

        _generateNewProjectFile: function (compositionXML) {
            /// <param name="compositionXML" type="XMLDocument">The XML document generated by the MediaComposition API.</param>
            let projectData = Ensemble.FileIO._createProjectData;

            let xmlDoc = document.implementation.createDocument(null, "EnsembleOfOneProject", null),
                rootNode = xmlDoc.firstChild;

            let tempCanvas = document.createElement("canvas");
            tempCanvas.width = projectData.resolution.width * 0.25;
            tempCanvas.height = projectData.resolution.height * 0.25;
            let tempContext = tempCanvas.getContext("2d");
            tempContext.fillStyle = "#000";
            tempContext.fillRect(0, 0, projectData.resolution.width * 0.25, projectData.resolution.height * 0.25);
            let thumbNode = xmlDoc.createElement("ProjectThumb");
            thumbNode.appendChild(xmlDoc.createTextNode(tempCanvas.toDataURL("image/png")));
            rootNode.appendChild(thumbNode);

            let zoomNode = xmlDoc.createElement("TimelineZoom");
            zoomNode.appendChild(xmlDoc.createTextNode(Ensemble.Editor.TimelineZoomMGR.currentLevel.toString()));
            rootNode.appendChild(zoomNode);

            let countNode = xmlDoc.createElement("NumberOfClips");
            countNode.appendChild(xmlDoc.createTextNode("0"));
            rootNode.appendChild(countNode);

            let aspectNode = xmlDoc.createElement("AspectRatio");
            aspectNode.appendChild(xmlDoc.createTextNode(projectData.aspect));
            rootNode.appendChild(aspectNode);

            let resNode = xmlDoc.createElement("Resolution");
            resNode.setAttribute("width", projectData.resolution.width.toString());
            resNode.setAttribute("height", projectData.resolution.height.toString());
            rootNode.appendChild(resNode);

            let lengthNode = xmlDoc.createElement("ProjectLength");
            lengthNode.appendChild(xmlDoc.createTextNode("0"));
            rootNode.appendChild(lengthNode);

            let trackContainerNode = xmlDoc.createElement("Tracks");
            trackContainerNode.setAttribute("FreeTrackId", "1");
            trackContainerNode.setAttribute("FreeClipId", "0");

            let firstTrackNode = xmlDoc.createElement("Track");
            firstTrackNode.setAttribute("trackId", "0");
            firstTrackNode.setAttribute("trackName", "Untitled track");
            firstTrackNode.setAttribute("trackVolume", "1");
            trackContainerNode.appendChild(firstTrackNode);
            rootNode.appendChild(trackContainerNode);

            let historyNode = xmlDoc.createElement("History"),
                undoNode = xmlDoc.createElement("Undo"),
                redoNode = xmlDoc.createElement("Redo");
            historyNode.appendChild(undoNode);
            historyNode.appendChild(redoNode);
            rootNode.appendChild(historyNode);

            rootNode.appendChild(compositionXML.getElementsByTagName("Composition")[0]);

            let xmlSerializer = new XMLSerializer();

            Windows.Storage.ApplicationData.current.localFolder.createFolderAsync("Projects", Windows.Storage.CreationCollisionOption.openIfExists).then(function (projectDir) {
                projectDir.createFileAsync(projectData.name + ".eo1", Windows.Storage.CreationCollisionOption.generateUniqueName).then(function (projectFile) {
                    Windows.Storage.FileIO.writeTextAsync(projectFile, xmlSerializer.serializeToString(xmlDoc)).then(function () {
                        Ensemble.FileIO._createProjectData.callback(projectFile);
                        Ensemble.FileIO._createProjectData.callback = null;
                    });
                });
            });
        },

        loadProject: function (file, internal) {
            /// <summary>Loads a saved project from storage external to the application.</summary>
            /// <param name="file" type="Windows.Storage.StorageFile">The project file to load.</param>
            /// <param name="internal" type="Boolean">Optional. If true, treat the project as an unsaved internal project.</param>
            Ensemble.FileIO.addOrReplaceRecentProject(file);
            Ensemble.Session.projectFile = file;
            Ensemble.Session.projectFileInApp = internal;
            Windows.Storage.FileIO.readTextAsync(file).then(function (contents) {
                Ensemble.FileIO._processLoadedProjectData(file.name, file.displayName, contents);
            });
        },

        _processLoadedProjectData: function (filename, projectName, xmlString) {
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(xmlString, "text/xml");

            var ensembleProject = xmlDoc.firstChild;

            let correctedProjectName = projectName.toLowerCase();
            if (correctedProjectName.slice(-4) == ".eo1") correctedProjectName = projectName.substr(0, projectName.length - 4);
            else correctedProjectName = projectName;

            console.log("Loading project \"" + correctedProjectName + "...\"");

            let projectThumb = xmlDoc.getElementsByTagName("ProjectThumb")[0].childNodes[0].nodeValue;

            var zoomLevel = parseInt(xmlDoc.getElementsByTagName("TimelineZoom")[0].childNodes[0].nodeValue, 10);

            var dateModified = new Date(parseInt(xmlDoc.getElementsByTagName("DateModified")[0].childNodes[0].nodeValue, 10));
            var dateCreated = new Date(parseInt(xmlDoc.getElementsByTagName("DateCreated")[0].childNodes[0].nodeValue, 10));
            var numberOfClips = parseInt(xmlDoc.getElementsByTagName("NumberOfClips")[0].childNodes[0].nodeValue, 10);
            var aspectRatio = xmlDoc.getElementsByTagName("AspectRatio")[0].childNodes[0].nodeValue;
            let resolution = {
                width: parseInt(xmlDoc.getElementsByTagName("Resolution")[0].getAttribute("width"), 10),
                height: parseInt(xmlDoc.getElementsByTagName("Resolution")[0].getAttribute("height"), 10)
            };
            var duration = parseInt(xmlDoc.getElementsByTagName("ProjectLength")[0].childNodes[0].nodeValue, 10);

            var tracks = xmlDoc.getElementsByTagName("Tracks")[0].getElementsByTagName("Track");
            var freeTrackId = parseInt(xmlDoc.getElementsByTagName("Tracks")[0].getAttribute("FreeTrackId"));
            var freeClipId = parseInt(xmlDoc.getElementsByTagName("Tracks")[0].getAttribute("FreeClipId"));

            var historyParent = xmlDoc.getElementsByTagName("History")[0];
            var undoParent = historyParent.getElementsByTagName("Undo")[0];
            var redoParent = historyParent.getElementsByTagName("Redo")[0];

            Ensemble.Session.projectAspect = aspectRatio;
            Ensemble.Session.projectResolution = resolution;
            Ensemble.Session.projectFilename = filename;
            Ensemble.Session.projectName = correctedProjectName;
            Ensemble.Session.projectThumb = projectThumb;
            Ensemble.Session.projectDuration = duration;
            Ensemble.Session.projectDateModified = dateModified;
            Ensemble.Session.projectDateCreated = dateCreated;
            Ensemble.Session.projectClipCount = numberOfClips;

            Ensemble.Editor.TimelineZoomMGR.currentLevel = zoomLevel;

            //May be overridden during the rest of the load process due to missing or invalid clip references.
            Ensemble.Session.projectTrackCount = tracks.length;
            Ensemble.Editor.TimelineMGR._uniqueTrackID = freeTrackId;
            Ensemble.Editor.TimelineMGR._uniqueClipID = freeClipId;

            var undoActions = undoParent.getElementsByTagName("HistoryAction");
            if (undoActions.length > 0) {
                console.log("Loading " + undoActions.length + " back history items.");
                for (var i = 0; i < undoActions.length; i++) {
                    var actionType = undoActions[i].getAttribute("type");
                    if (actionType === Ensemble.Events.Action.ActionType.createTrack) {
                        Ensemble.HistoryMGR._backStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.createTrack,
                            {
                                trackId: parseInt(undoActions[i].getAttribute("trackId"), 10)
                            }
                        ));
                    }
                    else if (actionType === Ensemble.Events.Action.ActionType.renameTrack) {
                        Ensemble.HistoryMGR._backStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.renameTrack,
                            {
                                trackId: parseInt( undoActions[i].getAttribute("trackId"), 10),
                                oldName: undoActions[i].getAttribute("oldName"),
                                newName: undoActions[i].getAttribute("newName")
                            }
                        ));
                    }
                    else if (actionType === Ensemble.Events.Action.ActionType.trackVolumeChanged) {
                        Ensemble.HistoryMGR._backStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.trackVolumeChanged,
                            {
                                trackId: parseInt(undoActions[i].getAttribute("trackId"), 10),
                                oldVolume: parseFloat(undoActions[i].getAttribute("oldVolume")),
                                newVolume: parseFloat(undoActions[i].getAttribute("newVolume"))
                            }
                        ));
                    }
                    else if (actionType === Ensemble.Events.Action.ActionType.moveTrack) {
                        Ensemble.HistoryMGR._backStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.moveTrack,
                            {
                                trackId: parseInt(undoActions[i].getAttribute("trackId"), 10),
                                origin: parseInt(undoActions[i].getAttribute("origin"), 10),
                                destination: parseInt(undoActions[i].getAttribute("destination"), 10)
                            }
                        ));
                    }
                    else if (actionType === Ensemble.Events.Action.ActionType.removeTrack) {
                        let trackParent = undoActions[i].getElementsByTagName("Track")[0];
                        let generatedTrack = Ensemble.FileIO._loadTrackFromXML(trackParent);
                        Ensemble.HistoryMGR._backStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.removeTrack,
                            {
                                trackId: parseInt(undoActions[i].getAttribute("trackId"), 10),
                                trackObj: generatedTrack,
                                originalLocation: parseInt(undoActions[i].getAttribute("originalLocation"), 10)
                            }
                        ));
                    }
                    else if (actionType === Ensemble.Events.Action.ActionType.importClip) {
                        Ensemble.HistoryMGR._backStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.importClip,
                            {
                                clipId: parseInt(undoActions[i].getAttribute("clipId"), 10)
                            }
                        ));
                    }
                    else if (actionType === Ensemble.Events.Action.ActionType.removeClip) {
                        let removedClips = undoActions[i].getElementsByTagName("RemovedClip");
                        let removedArr = [];
                        let trackArr = [];
                        for (let k = 0; k < removedClips.length; k++) {
                            removedArr.push(Ensemble.FileIO._loadClipFromXML(removedClips[k].getElementsByTagName("Clip")[0]));
                            trackArr.push(parseInt(removedClips[k].getAttribute("trackId"), 10));
                        }
                        Ensemble.HistoryMGR._backStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.removeClip, {
                            clipObjs: removedArr,
                            trackLocations: trackArr
                        }));
                    }
                    else if (actionType === Ensemble.Events.Action.ActionType.moveClip) {
                        let movedClips = undoActions[i].getElementsByTagName("MovedClip");
                        let ids = [];
                        let destinationTimes = [];
                        let destinationTracks = [];
                        let originalTimes = [];
                        let originalTracks = [];
                        for (let i = 0; i < movedClips.length; i++) {
                            ids.push(parseInt(movedClips[i].getAttribute("clipId"), 10));
                            destinationTimes.push(parseInt(movedClips[i].getAttribute("destinationTime"), 10));
                            destinationTracks.push(parseInt(movedClips[i].getAttribute("destinationTrack"), 10));
                            originalTimes.push(parseInt(movedClips[i].getAttribute("originalTime"), 10));
                            originalTracks.push(parseInt(movedClips[i].getAttribute("originalTrack"), 10));
                        }
                        Ensemble.HistoryMGR._backStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.moveClip, {
                                clipIds: ids,
                                destinationTimes: destinationTimes,
                                destinationTracks: destinationTracks,
                                originalTimes: originalTimes,
                                originalTracks: originalTracks
                        }));
                    }
                    else if (actionType === Ensemble.Events.Action.ActionType.trimClip) {
                        Ensemble.HistoryMGR._backStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.trimClip, {
                            clipId: parseInt(undoActions[i].getAttribute("clipId"), 10),
                            newStartTime: parseInt(undoActions[i].getAttribute("newStartTime"), 10),
                            newDuration: parseInt(undoActions[i].getAttribute("newDuration"), 10),
                            newStartTrim: parseInt(undoActions[i].getAttribute("newStartTrim"), 10),
                            newEndTrim: parseInt(undoActions[i].getAttribute("newEndTrim"), 10),
                            oldStartTrim: parseInt(undoActions[i].getAttribute("oldStartTrim"), 10),
                            oldEndTrim: parseInt(undoActions[i].getAttribute("oldEndTrim"), 10),
                            oldDuration: parseInt(undoActions[i].getAttribute("oldDuration"), 10),
                            oldStartTime: parseInt(undoActions[i].getAttribute("oldStartTime"), 10)
                        }));
                    }
                    else if (actionType === Ensemble.Events.Action.ActionType.splitClip) {
                        let splitClips = undoActions[i].getElementsByTagName("SplitClip");
                        let ids = [];
                        let newids = [];
                        let time = parseInt(undoActions[i].getAttribute("time"), 10);
                        for (let k = 0; k < splitClips.length; k++) {
                            ids.push(parseInt(splitClips[k].getAttribute("clipId"), 10));
                            newids.push(parseInt(splitClips[k].getAttribute("newId"), 10));
                        }
                        Ensemble.HistoryMGR._backStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.splitClip, {
                            clipIds: ids,
                            newIds: newids,
                            time: time
                        }));
                    }
                    else if (actionType === Ensemble.Events.Action.ActionType.positionClip) {
                        let positionedClips = undoActions[i].getElementsByTagName("PositionedClip");
                        let ids = [];
                        let newX = [];
                        let newY = [];
                        let newWidth = [];
                        let newHeight = [];

                        let oldX = [];
                        let oldY = [];
                        let oldWidth = [];
                        let oldHeight = [];

                        for (let k = 0; k < positionedClips.length; k++) {
                            ids.push(parseInt(positionedClips[k].getAttribute("clipId"), 10));
                            oldX.push(parseInt(positionedClips[k].getAttribute("oldX"), 10));
                            oldY.push(parseInt(positionedClips[k].getAttribute("oldY"), 10));
                            oldWidth.push(parseInt(positionedClips[k].getAttribute("oldWidth"), 10));
                            oldHeight.push(parseInt(positionedClips[k].getAttribute("oldHeight"), 10));
                            newX.push(parseInt(positionedClips[k].getAttribute("newX"), 10));
                            newY.push(parseInt(positionedClips[k].getAttribute("newY"), 10));
                            newWidth.push(parseInt(positionedClips[k].getAttribute("newWidth"), 10));
                            newHeight.push(parseInt(positionedClips[k].getAttribute("newHeight"), 10));
                        }

                        Ensemble.HistoryMGR._backStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.positionClip, {
                            clipIds: ids,
                            oldX: oldX,
                            oldY: oldY,
                            oldWidth: oldWidth,
                            oldHeight: oldHeight,
                            newX: newX,
                            newY: newY,
                            newWidth: newWidth,
                            newHeight: newHeight
                        }));
                    }
                    else if (actionType == Ensemble.Events.Action.ActionType.renameClip) {
                        Ensemble.HistoryMGR._backStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.renameClip, {
                            clipId: parseInt(undoActions[i].getAttribute("clipId"), 10),
                            oldName: undoActions[i].getAttribute("oldName"),
                            newName: undoActions[i].getAttribute("newName")
                        }));
                    }
                    else if (actionType == Ensemble.Events.Action.ActionType.clipVolumeChanged) {
                        Ensemble.HistoryMGR._backStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.clipVolumeChanged, {
                            clipId: parseInt(undoActions[i].getAttribute("clipId"), 10),
                            oldVolume: parseFloat(undoActions[i].getAttribute("oldVolume")),
                            newVolume: parseFloat(undoActions[i].getAttribute("newVolume"))
                        }));
                    }
                    else if (actionType == Ensemble.Events.Action.ActionType.createLens) {
                        Ensemble.HistoryMGR._backStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.createLens, {
                            lensId: parseInt(undoActions[i].getAttribute("lensId"), 10),
                            lensType: undoActions[i].getAttribute("lensType"),
                            destinationTrack: parseInt(undoActions[i].getAttribute("destinationTrack"), 10),
                            destinationTime: parseInt(undoActions[i].getAttribute("destinationTime"), 10)
                        }));
                    }
                    else if (actionType == Ensemble.Events.Action.ActionType.editLens) {
                        Ensemble.HistoryMGR._backStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.editLens, {
                            lensId: parseInt(undoActions[i].getAttribute("lensId"), 10),
                            oldEffectDetails: JSON.parse(undoActions[i].getAttribute("oldEffectDetails")),
                            newEffectDetails: JSON.parse(undoActions[i].getAttribute("newEffectDetails")),
                        }));
                    }
                    else {
                        console.error("Unable to load History Action from disk - unknown type.");
                    }
                }
            }

            var redoActions = redoParent.getElementsByTagName("HistoryAction");
            if (redoActions.length > 0) {
                console.log("Loading " + redoActions.length + " forward history items.");
                for (var i = 0; i < redoActions.length; i++) {
                    var actionType = redoActions[i].getAttribute("type");
                    if (actionType === Ensemble.Events.Action.ActionType.createTrack) {
                        Ensemble.HistoryMGR._forwardStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.createTrack,
                            {
                                trackId: parseInt(redoActions[i].getAttribute("trackId"), 10)
                            }
                        ));
                    }
                    else if (actionType === Ensemble.Events.Action.ActionType.renameTrack) {
                        Ensemble.HistoryMGR._forwardStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.renameTrack,
                            {
                                trackId: parseInt(redoActions[i].getAttribute("trackId"), 10),
                                oldName: redoActions[i].getAttribute("oldName"),
                                newName: redoActions[i].getAttribute("newName")
                            }
                        ));
                    }
                    else if (actionType === Ensemble.Events.Action.ActionType.trackVolumeChanged) {
                        Ensemble.HistoryMGR._forwardStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.trackVolumeChanged,
                            {
                                trackId: parseInt(redoActions[i].getAttribute("trackId"), 10),
                                oldVolume: parseFloat(redoActions[i].getAttribute("oldVolume")),
                                newVolume: parseFloat(redoActions[i].getAttribute("newVolume"))
                            }
                        ));
                    }
                    else if (actionType === Ensemble.Events.Action.ActionType.moveTrack) {
                        Ensemble.HistoryMGR._forwardStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.moveTrack,
                            {
                                trackId: parseInt(redoActions[i].getAttribute("trackId"), 10),
                                origin: parseInt(redoActions[i].getAttribute("origin"), 10),
                                destination: parseInt(redoActions[i].getAttribute("destination"), 10)
                            }
                        ));
                    }
                    else if (actionType === Ensemble.Events.Action.ActionType.removeTrack) {
                        let trackParent = redoActions[i].getElementsByTagName("Track")[0];
                        Ensemble.HistoryMGR._forwardStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.removeTrack,
                            {
                                trackId: parseInt(redoActions[i].getAttribute("trackId"), 10)
                            }
                        ));
                    }
                    else if (actionType === Ensemble.Events.Action.ActionType.importClip) {
                        let clipParent = redoActions[i].getElementsByTagName("Clip")[0];
                        let generatedClip = Ensemble.FileIO._loadClipFromXML(clipParent);
                        let destinationTrack = parseInt(redoActions[i].getAttribute("destinationTrack"), 10);
                        Ensemble.HistoryMGR._forwardStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.importClip,
                            {
                                clipId: generatedClip.id,
                                clipObj: generatedClip,
                                destinationTrack: destinationTrack,
                                destinationTime: generatedClip.startTime
                            }
                        ));
                    }
                    else if (actionType === Ensemble.Events.Action.ActionType.removeClip) {
                        let removedClips = redoActions[i].getElementsByTagName("RemovedClip");
                        let removedArr = [];
                        for (let k = 0; k < removedClips.length; k++) {
                            removedArr.push(parseInt(removedClips[k].getAttribute("clipId"), 10));
                        }
                        Ensemble.HistoryMGR._forwardStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.removeClip, {
                            clipIds: removedArr,
                        }));
                    }
                    else if (actionType === Ensemble.Events.Action.ActionType.moveClip) {
                        let movedClips = redoActions[i].getElementsByTagName("MovedClip");
                        let ids = [];
                        let destinationTimes = [];
                        let destinationTracks = [];
                        let originalTimes = [];
                        let originalTracks = [];
                        for (let i = 0; i < movedClips.length; i++) {
                            ids.push(parseInt(movedClips[i].getAttribute("clipId"), 10));
                            destinationTimes.push(parseInt(movedClips[i].getAttribute("destinationTime"), 10));
                            destinationTracks.push(parseInt(movedClips[i].getAttribute("destinationTrack"), 10));
                            originalTimes.push(parseInt(movedClips[i].getAttribute("originalTime"), 10));
                            originalTracks.push(parseInt(movedClips[i].getAttribute("originalTrack"), 10));
                        }
                        Ensemble.HistoryMGR._forwardStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.moveClip, {
                            clipIds: ids,
                            destinationTimes: destinationTimes,
                            destinationTracks: destinationTracks,
                            originalTimes: originalTimes,
                            originalTracks: originalTracks
                        }));
                    }
                    else if (actionType === Ensemble.Events.Action.ActionType.trimClip) {
                        Ensemble.HistoryMGR._forwardStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.trimClip, {
                            clipId: parseInt(redoActions[i].getAttribute("clipId"), 10),
                            newStartTime: parseInt(redoActions[i].getAttribute("newStartTime"), 10),
                            newDuration: parseInt(redoActions[i].getAttribute("newDuration"), 10),
                            newStartTrim: parseInt(redoActions[i].getAttribute("newStartTrim"), 10),
                            newEndTrim: parseInt(redoActions[i].getAttribute("newEndTrim"), 10),
                            oldStartTrim: parseInt(redoActions[i].getAttribute("oldStartTrim"), 10),
                            oldEndTrim: parseInt(redoActions[i].getAttribute("oldEndTrim"), 10),
                            oldDuration: parseInt(redoActions[i].getAttribute("oldDuration"), 10),
                            oldStartTime: parseInt(redoActions[i].getAttribute("oldStartTime"), 10)
                        }));
                    }
                    else if (actionType === Ensemble.Events.Action.ActionType.splitClip) {
                        let splitClips = redoActions[i].getElementsByTagName("SplitClip");
                        let ids = [];
                        let newids = [];
                        let time = parseInt(redoActions[i].getAttribute("time"), 10);
                        for (let k = 0; k < splitClips.length; k++) {
                            ids.push(parseInt(splitClips[k].getAttribute("clipId"), 10));
                            newids.push(parseInt(splitClips[k].getAttribute("newId"), 10));
                        }
                        Ensemble.HistoryMGR._forwardStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.splitClip, {
                            clipIds: ids,
                            newIds: newids,
                            time: time
                        }));
                    }
                    else if (actionType === Ensemble.Events.Action.ActionType.positionClip) {
                        let positionedClips = redoActions[i].getElementsByTagName("PositionedClip");
                        let ids = [];
                        let newX = [];
                        let newY = [];
                        let newWidth = [];
                        let newHeight = [];

                        let oldX = [];
                        let oldY = [];
                        let oldWidth = [];
                        let oldHeight = [];

                        for (let k = 0; k < positionedClips.length; k++) {
                            ids.push(parseInt(positionedClips[k].getAttribute("clipId"), 10));
                            oldX.push(parseInt(positionedClips[k].getAttribute("oldX"), 10));
                            oldY.push(parseInt(positionedClips[k].getAttribute("oldY"), 10));
                            oldWidth.push(parseInt(positionedClips[k].getAttribute("oldWidth"), 10));
                            oldHeight.push(parseInt(positionedClips[k].getAttribute("oldHeight"), 10));
                            newX.push(parseInt(positionedClips[k].getAttribute("newX"), 10));
                            newY.push(parseInt(positionedClips[k].getAttribute("newY"), 10));
                            newWidth.push(parseInt(positionedClips[k].getAttribute("newWidth"), 10));
                            newHeight.push(parseInt(positionedClips[k].getAttribute("newHeight"), 10));
                        }

                        Ensemble.HistoryMGR._forwardStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.positionClip, {
                            clipIds: ids,
                            oldX: oldX,
                            oldY: oldY,
                            oldWidth: oldWidth,
                            oldHeight: oldHeight,
                            newX: newX,
                            newY: newY,
                            newWidth: newWidth,
                            newHeight: newHeight
                        }));
                    }
                    else if (actionType == Ensemble.Events.Action.ActionType.renameClip) {
                        Ensemble.HistoryMGR._forwardStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.renameClip, {
                            clipId: parseInt(redoActions[i].getAttribute("clipId"), 10),
                            oldName: redoActions[i].getAttribute("oldName"),
                            newName: redoActions[i].getAttribute("newName")
                        }));
                    }
                    else if (actionType == Ensemble.Events.Action.ActionType.clipVolumeChanged) {
                        Ensemble.HistoryMGR._forwardStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.clipVolumeChanged, {
                            clipId: parseInt(redoActions[i].getAttribute("clipId"), 10),
                            oldVolume: parseFloat(redoActions[i].getAttribute("oldVolume")),
                            newVolume: parseFloat(redoActions[i].getAttribute("newVolume"))
                        }));
                    }
                    else if (actionType == Ensemble.Events.Action.ActionType.createLens) {
                        Ensemble.HistoryMGR._forwardStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.createLens, {
                            lensId: parseInt(redoActions[i].getAttribute("lensId"), 10),
                            lensType: redoActions[i].getAttribute("lensType"),
                            destinationTrack: parseInt(redoActions[i].getAttribute("destinationTrack"), 10),
                            destinationTime: parseInt(redoActions[i].getAttribute("destinationTime"), 10)
                        }));
                    }
                    else if (actionType == Ensemble.Events.Action.ActionType.editLens) {
                        Ensemble.HistoryMGR._forwardStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.editLens, {
                            lensId: parseInt(redoActions[i].getAttribute("lensId"), 10),
                            oldEffectDetails: JSON.parse(redoActions[i].getAttribute("oldEffectDetails")),
                            newEffectDetails: JSON.parse(redoActions[i].getAttribute("newEffectDetails")),
                        }));
                    }
                    else {
                        console.error("Unable to load History Action from disk - unknown type.");
                    }
                }
            }

            if (tracks.length > 0) {
                //Create empty tracks
                for (let i = 0; i < tracks.length; i++) {
                    let loadedTrack = Ensemble.FileIO._loadTrackFromXML(tracks[i]);
                    //Ensemble.Editor.TimelineMGR.addTrackAtIndex(loadedTrack, i);
                    Ensemble.Editor.TimelineMGR.tracks.push(loadedTrack);
                }
                Ensemble.FileIO._projectClipsFullyLoaded = 0;
                for (let i = 0; i < Ensemble.Editor.TimelineMGR.tracks.length; i++) {
                    for (let k = 0; k < Ensemble.Editor.TimelineMGR.tracks[i].clips.length; k++) {
                        if (Ensemble.Editor.TimelineMGR.tracks[i].clips[k].type == Ensemble.Editor.Clip.ClipType.lens) Ensemble.FileIO._projectProjectLoadCompletionChecker();
                        else Ensemble.FileIO._loadFileFromStub(Ensemble.Editor.TimelineMGR.tracks[i].clips[k], i, Ensemble.FileIO._projectFileStubLoaded);
                    }
                }
            }
            if (Ensemble.Session.projectClipCount == 0) {
                //Fire callback. Project is empty (no tracks or media).
                Ensemble.MainMenu._listeners.projectFinishedLoading();
            }
        },

        _loadMultipleClips: function (clipArr, payload, callback) {
            /// <summary>Loads all the Clip objects in the given array and calls the specified callback upon completion. Assumes that each Clip already exists within a Track object and does not assign the loaded Clips to any Tracks.</summary>
            (function () {
                if (clipArr.length > 0) {
                    let clips = clipArr;
                    let extra = payload;
                    let cb = callback;
                    Ensemble.FileIO._multiClipLoadTotal = clips.length;
                    Ensemble.FileIO._multiClipLoadCb = cb;
                    for (let i = 0; i < clipArr.length; i++) {
                        if (clipArr[i].type == Ensemble.Editor.Clip.ClipType.lens) Ensemble.FileIO._multipleClipLoadCompletionChecker(clipArr[i]);
                        else Ensemble.FileIO._loadFileFromStub(clips[i], null, Ensemble.FileIO._multiClipLoadFinish, true);
                    }
                }
                else {
                    Ensemble.FileIO._multiClipLoadBuffer = [];
                    Ensemble.FileIO._multiClipLoadTotal = 0;
                    Ensemble.FileIO._multiClipLoadCb = null;

                    callback(clipArr);
                }
            })();
        },

        _multiClipLoadFinish: function (payload, metadata) {
            let clip = payload.payload;
            clip.setPlayer(payload.player);
            clip.setMetadata(metadata);

            Ensemble.FileIO._multipleClipLoadCompletionChecker(clip);
        },

        _multipleClipLoadCompletionChecker: function (clip) {
            Ensemble.FileIO._multiClipLoadBuffer.push(clip);
            if (Ensemble.FileIO._multiClipLoadBuffer.length == Ensemble.FileIO._multiClipLoadTotal) {
                // complete! Fire the callback.
                let clipArr = Ensemble.FileIO._multiClipLoadBuffer;
                let cb = Ensemble.FileIO._multiClipLoadCb;

                Ensemble.FileIO._multiClipLoadBuffer = [];
                Ensemble.FileIO._multiClipLoadTotal = 0;
                Ensemble.FileIO._multiClipLoadCb = null;

                cb(clipArr);
            }
        },

        _loadFileFromStub: function (clip, payload, callback, loadClip) {
            /// <summary>Loads an EnsembleFile from disk for the given clip stub.</summary>
            /// <param name="clip" type="Ensemble.Editor.Clip">The clip whose stub to load.</param>
            /// <param name="payload" type="Object">A value to be passed to the callback upon load completion.</param>
            /// <param name="callback" type="Function">A function to execute when the file has been loaded.</param>
            /// <param name="loadClip" type="Boolean">Optional. If true, goes on and loads the clip as well before firing the callback.</param>
            (function () {
                let clipObj = clip,
                    payloadObj = payload,
                    cb = callback,
                    continueLoad = loadClip;

                if (clipObj.file.token.length > 0) {
                    Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.getFileAsync(clipObj.file.token).done(function (loadedFile) {
                        console.log("Loading file stub for clip with ID " + payloadObj + "...");
                        let newFile = Ensemble.FileIO._mergeFileStub(loadedFile);
                        newFile.token = clipObj.file.token;
                        clipObj.file = newFile;
                        if (continueLoad) {
                            Ensemble.FileIO.loadClip(clipObj.file, clipObj, cb, null, null, true);
                        }
                        else cb(clipObj, payloadObj);
                    });
                }
                else {
                    Windows.Storage.StorageFile.getFileFromPathAsync(clipObj.file.path).done(function (loadedFile) {
                        console.log("Loading file stub for clip with ID " + payloadObj + "...");
                        let newFile = Ensemble.FileIO._mergeFileStub(loadedFile);
                        clipObj.file = newFile;

                        if (continueLoad) {
                            Ensemble.FileIO.loadClip(clipObj.file, clipObj, cb, null, null, true);
                        }
                        else cb(clipObj, payloadObj);
                    });
                }
            })();            
        },

        _mergeFileStub: function (loadedFile) {
            let newFile = new Ensemble.EnsembleFile(loadedFile);
            newFile.mime = loadedFile.contentType;
            newFile.dateCreated = loadedFile.dateCreated;
            newFile.displayName = loadedFile.displayName;
            newFile.displayType = loadedFile.displayType;
            newFile.fileType = loadedFile.fileType.toLowerCase();
            newFile._uniqueId = loadedFile.folderRelativeId;
            newFile._winProperties = loadedFile.properties;
            newFile.fullName = loadedFile.name;
            newFile.path = loadedFile.path;
            if (newFile.mime.indexOf("audio") > -1) {
                newFile.icon = "&#xE189;";
                newFile.eo1type = "audio";
            }
            else if (newFile.mime.indexOf("video") > -1) {
                newFile.icon = "&#xE116;";
                newFile.eo1type = "video";
            }
            else if (newFile.mime.indexOf("image") > -1) {
                newFile.icon = "&#xE114;";
                newFile.eo1type = "picture";
            }
            else {
                console.log("File is of invalid MIME type.");
            }
            return newFile;
        },

        _projectFileStubLoaded: function (clip, payload) {
            (function () {
                let clipObj = clip;
                let payloadObj = payload;
                Ensemble.FileIO._projectLoadBuffer[clipObj.id] = clip;
                console.log("File stub for clip with ID " + clipObj.id + " loaded!");
                console.log("Loading file properties for clip with ID " + clipObj.id + "...");
                // load media properties
                Ensemble.FileIO.retrieveMediaProperties(clipObj.file, clipObj.id, Ensemble.FileIO._projectFilePropertiesLoaded);
            })();
        },

        _projectFilePropertiesLoaded: function (id, properties) {
            /// <param name="id" type="Number">The ID of the clip whose properties were just loaded.</param>
            /// <param name="properties" type="Object">An object containing the clip's media properties.</param>
            let clip = Ensemble.FileIO._projectLoadBuffer[id];
            clip.file._winProperties = properties;

            clip.file.bitrate = properties.bitrate;
            clip.file.duration = properties.duration;
            clip.file.height = properties.height;
            clip.file.title = properties.title;
            clip.file.width = properties.width;

            console.log("Loading player for clip with ID " + id + "...");
            Ensemble.FileIO.loadClip(clip.file, clip.id, Ensemble.FileIO._projectFilePlayerLoaded);
        },

        _projectFilePlayerLoaded: function (payloadObj) {
            (function () {
                let payload = payloadObj,
                    file = payload.file,
                    id = payload.payload,
                    player = payload.player;
                Ensemble.FileIO._projectLoadBuffer[id].setPlayer(player);
                console.log("Finished loading clip with ID " + id + ".");
                Ensemble.FileIO._projectProjectLoadCompletionChecker();
            })();
        },

        _projectProjectLoadCompletionChecker: function () {
            Ensemble.FileIO._projectClipsFullyLoaded++;
            if (Ensemble.FileIO._projectClipsFullyLoaded === Ensemble.Session.projectClipCount) {
                console.info("Finished loading all clips!");
                Ensemble.Editor.TimelineMGR.refreshClipVolumeModifiers();
                requestAnimationFrame(function () {
                    Ensemble.MainMenu._listeners.projectFinishedLoading();
                });
            }
        },

        _loadTrackFromXML: function (xmlTrack) {
            /// <summary>Generates a Track object from the given XML track root.</summary>
            /// <param name="xmlTrack" type="XMLDoc">The root of the Track in the XML file.</param>
            /// <returns type="Ensemble.Editor.Track">A finished track object.</returns>
            let createdTrack = new Ensemble.Editor.Track(parseInt(xmlTrack.getAttribute("trackId")), xmlTrack.getAttribute("trackName"), parseFloat(xmlTrack.getAttribute("trackVolume")));
            let clipParents = xmlTrack.getElementsByTagName("Clip");
            for (let i = 0; i < clipParents.length; i++) {
                createdTrack.clips.push(Ensemble.FileIO._loadClipFromXML(clipParents[i]));
            }
            return createdTrack;
        },

        _loadClipFromXML: function (xmlClip) {
            /// <summary>Generates a Clip object from the given XML clip root.</summary>
            /// <param name="xmlClip" type="XMLDoc">The root of the Clip in the XML file.</param>
            /// <returns type="Ensemble.Editor.Clip">A finished Clip object, but without its media loaded.</returns>
            let createdClip = new Ensemble.Editor.Clip(parseInt(xmlClip.getAttribute("id"), 10));
            createdClip.type = xmlClip.getAttribute("type");
            createdClip.name = xmlClip.getAttribute("name");
            createdClip.volume = parseFloat(xmlClip.getAttribute("volume"), 10);
            createdClip.startTime = parseInt(xmlClip.getAttribute("start"), 10);
            createdClip.duration = parseInt(xmlClip.getAttribute("duration"), 10);
            createdClip.startTrim = parseInt(xmlClip.getAttribute("startTrim"), 10);
            createdClip.endTrim = parseInt(xmlClip.getAttribute("endTrim"), 10);
            createdClip.xcoord = parseInt(xmlClip.getAttribute("xcoord"), 10);
            createdClip.ycoord = parseInt(xmlClip.getAttribute("ycoord"), 10);
            createdClip.width = parseInt(xmlClip.getAttribute("width"), 10);
            createdClip.height = parseInt(xmlClip.getAttribute("height"), 10);
            createdClip.aspect = xmlClip.getAttribute("aspect") || "";
            createdClip.file = {
                path: xmlClip.getAttribute("path"),
                token: xmlClip.getAttribute("token")
            };
            createdClip.preExisting = true;
            if (createdClip.type == Ensemble.Editor.Clip.ClipType.lens) createdClip.effectDetails = JSON.parse(xmlClip.getAttribute("effectDetails"));
            return createdClip;
        },

        loadClip: function (ensembleFile, payload, complete, progress, error, continueLoad) {
            /// <summary>Loads the media represented by the given EnsembleFile and passes the resulting Ensemble.Editor.Clip object and payload to the given callback.</summary>
            /// <param name="ensembleFile" type="Ensemble.EnsembleFile">The EnsembleFile to load.</param>
            /// <param name="payload" type="Object">A set of arbitrary data that will be passed to the specified callback upon loading completion.</param>
            /// <param name="complete" type="Function">The callback to execute after loading is complete.</param>
            /// <param name="progress" type="Function">The callback to execute on loading progress.</param>
            /// <param name="error" type="Function">The callback to execute if an error is encountered while loading the clip.</param>
            /// <param name="continueLoad" type="Boolean">Optional. If true, metadata load will be triggered instead of firing the callback.</param>
            
            (function () {
                var file = ensembleFile;
                var data = payload;
                var callback = complete;

                var fileURI = URL.createObjectURL(file._src, { oneTimeOnly: false });

                var srcElement = null;
                switch (file.eo1type) {
                    case "video":
                        srcElement = document.createElement("video");
                        //srcElement.oncanplaythrough = function () { console.log("Video clip finished loading!"); };
                        srcElement.oncanplaythrough = Ensemble.FileIO._clipFinishedLoading;
                        srcElement.onerror = Ensemble.FileIO._clipLoadError;
                        break;
                    case "audio":
                        srcElement = document.createElement("audio");
                        //srcElement.oncanplaythrough = function () { console.log("Audio clip finished loading!"); };
                        srcElement.oncanplaythrough = Ensemble.FileIO._clipFinishedLoading;
                        srcElement.onerror = Ensemble.FileIO._clipLoadError;
                        break;
                    case "picture":
                        srcElement = document.createElement("img");
                        //srcElement.onload = function () { console.log("Image loaded!"); };
                        srcElement.onload = Ensemble.FileIO._clipFinishedLoading;
                        srcElement.onerror = Ensemble.FileIO._clipLoadError;
                        break;
                }

                let clipUniqueImportId = file._uniqueId + "time" + performance.now();

                Ensemble.FileIO._clipLoadBuffer[clipUniqueImportId] = {
                    file: file,
                    player: srcElement,
                    payload: data,
                    complete: callback,
                    progress: progress,
                    error: error,
                    continueLoad: continueLoad
                };
                srcElement.setAttribute("data-eo1-uniqueid", clipUniqueImportId);
                srcElement.className = "editor-media-item";
                srcElement.id = clipUniqueImportId;
                console.log("Setting src for EnsembleFile with uniqueId " + clipUniqueImportId + "...");
                document.getElementsByClassName("editor-media-container")[0].appendChild(srcElement);
                srcElement.src = fileURI;
            })();
        },

        _clipFinishedLoading: function (eventObj) {
            (function () {
                let event = eventObj;
                let clipUniqueId = event.currentTarget.getAttribute("data-eo1-uniqueid");
                let bufferItem = Ensemble.FileIO._clipLoadBuffer[clipUniqueId];

                let ensembleFile = bufferItem.file;
                let payload = bufferItem.payload;
                let callback = bufferItem.complete;
                let srcPlayer = event.currentTarget;
                let continueLoad = bufferItem.continueLoad;

                srcPlayer.onerror = null;

                delete Ensemble.FileIO._clipLoadBuffer[clipUniqueId];

                let cbVal = {
                    file: ensembleFile,
                    payload: payload,
                    player: srcPlayer,
                    continueLoad: continueLoad
                }


                if (continueLoad) {
                    // trigger a metadata load.
                    Ensemble.FileIO.retrieveMediaProperties(ensembleFile, cbVal, callback);
                }

                else callback(cbVal);
            })();
        },

        _clipLoadError: function (event) {
            var clipUniqueId = event.currentTarget.getAttribute("data-eo1-uniqueid");
            var bufferItem = Ensemble.FileIO._clipLoadBuffer[clipUniqueId];

            var ensembleFile = bufferItem.file;
            var payload = bufferItem.payload;
            var callback = bufferItem.error;

            delete Ensemble.FileIO._clipLoadBuffer[clipUniqueId];

            console.error("Error loading clip: " + ensembleFile.displayName);
        },

        enumerateLocalProjects: function (callback) {
            /// <summary>Enumerates all available projects in the project directory.</summary>
            /// <param name="callback" type="Function">The callback to be fired after all projects have been enumerated.</param>
            var dataArray = [];
            Windows.Storage.ApplicationData.current.localFolder.getFolderAsync("Projects").then(function (projectDir) {
                var projectQueryOptions = new Windows.Storage.Search.QueryOptions(Windows.Storage.Search.CommonFileQuery.orderByName, [".eo1"]);
                var projectQuery = projectDir.createFileQueryWithOptions(projectQueryOptions);
                projectQuery.getFilesAsync().then(function (projectFiles) {
                    if (projectFiles.length == 0) callback([]);
                    else {
                        for (var i = 0; i < projectFiles.length; i++) {
                            (function () {
                                let currentFile = projectFiles[i],
                                    loadedFilename = projectFiles[i].name,
                                    loadedProjectName = projectFiles[i].displayName;
                                Windows.Storage.FileIO.readTextAsync(projectFiles[i]).then(function (contents) {
                                    var parser = new DOMParser();
                                    var xmlDoc = parser.parseFromString(contents, "text/xml");

                                    var ensembleProject = xmlDoc.firstChild;
                                            
                                    try {
                                        var loadedDateModified = new Date(parseInt(xmlDoc.getElementsByTagName("DateModified")[0].childNodes[0].nodeValue, 10));
                                    }
                                    catch (exception) {
                                        var loadedDateModified = "Unknown";
                                    }
                                    var loadedAspectRatio = xmlDoc.getElementsByTagName("AspectRatio")[0].childNodes[0].nodeValue;
                                    var loadedNumberOfClips = xmlDoc.getElementsByTagName("MediaClip").length;
                                    var loadedProjectLength = xmlDoc.getElementsByTagName("ProjectLength")[0].childNodes[0].nodeValue;
                                    let loadedThumbnailPath = xmlDoc.getElementsByTagName("ProjectThumb")[0].childNodes[0].nodeValue;

                                    dataArray.push(new Ensemble.Editor.ProjectFile(loadedProjectName, loadedFilename, loadedDateModified, loadedNumberOfClips, loadedAspectRatio, loadedProjectLength, loadedThumbnailPath, null, currentFile));
                                    dataArray[dataArray.length - 1].internal = true;

                                    if (dataArray.length == projectFiles.length) {
                                        dataArray.sort(function (a, b) {
                                            if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
                                            if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
                                            return 0;
                                        });
                                        callback(dataArray);
                                    }
                                });
                            })();
                        }
                    }
                });
            });
        },

        enumerateRecentProjects: function (callback) {
            /// <summary>Generates all recently edited projects.</summary>
            /// <param name="callback" type="Function">The callback to be fired after all projects have been enumerated.</param>
            let dataArray = [],
                errorArray = [],
                projectTokens = Ensemble.Settings.getRecentProjectTokens(),
                projectCount = projectTokens.length,
                mostRecentlyUsedList = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList;

            for (let i = 0; i < projectCount; i++) {
                (function () {
                    let iter = i;
                    mostRecentlyUsedList.getFileAsync(projectTokens[iter]).then(function (projectFile) {
                        let loadedFilename = projectFile.name,
                            loadedProjectName = projectFile.displayName;
                        Windows.Storage.FileIO.readTextAsync(projectFile).done(function (contents) {
                            let parser = new DOMParser(),
                                xmlDoc = parser.parseFromString(contents, "text/xml"),
                                ensembleProject = xmlDoc.firstChild,
                                loadedAspectRatio = xmlDoc.getElementsByTagName("AspectRatio")[0].childNodes[0].nodeValue,
                                loadedNumberOfClips = xmlDoc.getElementsByTagName("MediaClip").length,
                                loadedProjectLength = xmlDoc.getElementsByTagName("ProjectLength")[0].childNodes[0].nodeValue,
                                loadedThumbnailPath = xmlDoc.getElementsByTagName("ProjectThumb")[0].childNodes[0].nodeValue,
                                loadedDateModified = "";

                            try {
                                loadedDateModified = new Date(parseInt(xmlDoc.getElementsByTagName("DateModified")[0].childNodes[0].nodeValue, 10));
                            }
                            catch (exception) {
                                loadedDateModified = "Unknown";
                            }

                            dataArray.push(new Ensemble.Editor.ProjectFile(loadedProjectName, loadedFilename, loadedDateModified, loadedNumberOfClips, loadedAspectRatio, loadedProjectLength, loadedThumbnailPath, iter, projectFile));

                            Ensemble.FileIO._enumerateRecentProjectsCompletionTest(dataArray, errorArray, projectCount, callback);
                        });
                    }, function (error) {
                        console.error("Unable to lookup recent project.");
                        projectCount--;
                        errorArray.push(projectTokens[iter]);
                        Ensemble.FileIO._enumerateRecentProjectsCompletionTest(dataArray, errorArray, projectCount, callback);
                    });
                })();
            }
        },

        _enumerateRecentProjectsCompletionTest: function (dataArray, errorArray, count, callback) {
            if (dataArray.length == count) {
                dataArray.sort(function (a, b) {
                    if (a.extra < b.extra) return -1;
                    if (a.extra > b.extra) return 1;
                    return 0;
                });
                for (let i = 0; i < errorArray.length; i++) {
                    Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.remove(errorArray[i]);
                    Ensemble.Settings.removeRecentProject(errorArray[i]);
                }
                callback(dataArray);
            }
        },

        pruneDuplicateProjects: function (projects) {
            /// <summary>Returns a new array with no duplicate projects. Biased toward keeping "internal" (unsaved) project.</summary>
            /// <param name="projects" type="Array"></param>
            /// <returns type="Array"></returns>
            let prunedList = [],
                projectCount = projects.length;
            
            for (let i = 0; i < projectCount; i++) {
                let found = false;
                for (let k = 0; k < prunedList.length; k++) {
                    if (prunedList[k].src.isEqual(projects[i].src)) {
                        found = true;
                        if (projects[i].internal) prunedList[k] = projects[i];
                    }
                }
                if (!found) prunedList.push(projects[i]);
            }

            return prunedList;
        },

        pickItemsFromFolder: function (folder, callback) {
            /// <summary>Picks all supported files and folders within the given directory and passes them via callback.</summary>
            /// <param name="folder" type="Ensemble.EnsembleFolder">The folder within which to look up files.</param>
            /// <param name="callback" type="Function">The function call to execute upon completion.</param>
            Ensemble.FileIO._pickItemsCallback = callback;
            Ensemble.FileIO._clearTempItemsLookup();
            folder._src.getFoldersAsync().then(function (containedFolders) {
                console.log("Got a list of folders in the current folder.");
                folder._src.getFilesAsync().then(function (containedFiles) {
                    console.log("Got a list of media files in the current folder.");
                    for (var i = 0; i < containedFolders.length; i++) {
                        var newFolder = Ensemble.FileIO._createFolderFromSrc(containedFolders[i]);
                        Ensemble.FileIO._pickItemsTempFolders.push(newFolder);
                    }
                    console.log("Finished adding folders to the array to display.");
                    for (var i = 0; i < containedFiles.length; i++) {
                        var newFile = Ensemble.FileIO._createFileFromSrc(containedFiles[i]);
                        //Check that the file is supported.
                        if (newFile.mime.indexOf("audio") > -1 || newFile.mime.indexOf("video") > -1 || newFile.mime.indexOf("image") > -1) {
                            if (Ensemble.FileIO.supportedAudioTypes.indexOf(newFile.fileType) > -1 || Ensemble.FileIO.supportedVideoTypes.indexOf(newFile.fileType) > -1 || Ensemble.FileIO.supportedImageTypes.indexOf(newFile.fileType) > -1) {
                                Ensemble.FileIO._pickItemsTempFiles.push(newFile);
                            }
                        } 
                    }
                    console.log("Finished adding media files to the array to display.");
                    //Now that all files and folders have been added up, pull media information.
                    Ensemble.FileIO._pickItemsCallback(Ensemble.FileIO._pickItemsTempFiles, Ensemble.FileIO._pickItemsTempFolders);
                });
            });
        },

        _createFileFromSrc: function (file) {
            /// <returns type="Ensemble.EnsembleFile">An EnsembleFile representing the platform-dependent source.</returns>
            var newFile = new Ensemble.EnsembleFile(file);
            newFile.mime = file.contentType;
            newFile.dateCreated = file.dateCreated;
            newFile.displayName = file.displayName;
            newFile.displayType = file.displayType;
            newFile.fileType = file.fileType.toLowerCase();
            newFile._uniqueId = file.folderRelativeId;
            newFile._winProperties = file.properties;
            newFile.fullName = file.name;
            newFile.path = file.path;

            if (newFile.mime.indexOf("audio") > -1) {
                newFile.icon = "&#xE189;";
                newFile.eo1type = "audio";
            }
            else if (newFile.mime.indexOf("video") > -1) {
                newFile.icon = "&#xE116;";
                newFile.eo1type = "video";
            }
            else if (newFile.mime.indexOf("image") > -1) {
                newFile.icon = "&#xE114;";
                newFile.eo1type = "picture";
            }
            else {
                console.log("File is of invalid MIME type.");
            }

            return newFile;
        },

        _createFolderFromSrc: function (folder) {
            /// <returns type="Ensemble.EnsembleFile">An EnsembleFile representing the platform-dependent folder.</returns>
            var newFolder = new Ensemble.EnsembleFile(folder);
            newFolder.dateCreated = folder.dateCreated;
            newFolder.displayName = folder.displayName;
            newFolder.displayType = folder.displayType;
            newFolder._uniqueId = folder.folderRelativeId;
            newFolder._winProperties = folder.properties;
            newFolder.fullName = folder.name;
            newFolder.path = folder.path;

            newFolder.icon = "&#xE188;";
            newFolder.eo1type = "folder";
            return newFolder;
        },

        retrieveMediaProperties: function (ensembleFile, index, callback) {
            /// <summary>Retrieves the metadata for the given EnsembleFile at the given index value, and then executes the callback.</summary>
            /// <param name="ensembleFile" type="Ensemble.EnsembleFile">The file whose media properties to look up.</param>
            /// <param name="index" type="Number">The file's original index in the Media Browser list.</param>
            /// <param name="callback" type="Function">The callback to execute after retrieving the media properties. Will pass the index and the meta to the callback function.</param>
            if (ensembleFile != null) {
                switch (ensembleFile.eo1type) {
                    case "video":
                        ensembleFile._src.properties.getVideoPropertiesAsync().done(function (success) {
                            //console.log("Retrieved video properties for the item at index " + index + ".");
                            var returnVal = {
                                bitrate: success.bitrate,
                                duration: success.duration,
                                height: success.height,
                                width: success.width,
                                title: success.title
                            };

                            callback(index, returnVal, ensembleFile._uniqueId);
                        });
                        break;
                    case "audio":
                        ensembleFile._src.properties.getMusicPropertiesAsync().done(function (success) {
                            //console.log("Retrieved music properties.");
                            var returnVal = {
                                album: success.album,
                                albumArtist: success.albumArtist,
                                artist: success.artist,
                                bitrate: success.bitrate,
                                duration: success.duration,
                                genre: success.genre,
                                title: success.title
                            };
                            callback(index, returnVal, ensembleFile._uniqueId);
                        });
                        break;
                    case "picture":
                        ensembleFile._src.properties.getImagePropertiesAsync().done(function (success) {
                            //console.log("Retrieved image properties for file \"" + srcfile.name + ".\"");
                            var returnVal = {
                                dateTaken: success.dateTaken,
                                height: success.height,
                                width: success.width,
                                title: success.title,
                                duration: Ensemble.Settings.retrieveSetting("default-picture-duration") * 1000
                            };
                            callback(index, returnVal, ensembleFile._uniqueId);
                        });
                        break;
                    case "folder":
                        callback(index, null, ensembleFile._uniqueId);
                        break;
                }
            }

            
        },

        retrieveThumbnail: function (ensembleFile, index, callback) {
            /// <summary>Retrieves the metadata for the given EnsembleFile at the given index value, and then executes the callback.</summary>
            /// <param name="ensembleFile" type="Ensemble.EnsembleFile">The file whose thumbnail to look up.</param>
            /// <param name="index" type="Number">The file's original index in the Media Browser list.</param>
            /// <param name="callback" type="Function">The callback to execute after retrieving the thumbnail. Will pass the index and the thumb to the callback function.</param>
            if (ensembleFile != null) {
                switch (ensembleFile.eo1type) {
                    case "folder":
                        callback(index, null, ensembleFile._uniqueId);
                        break;
                    default:
                        ensembleFile._src.getScaledImageAsThumbnailAsync(Windows.Storage.FileProperties.ThumbnailMode.listView, 200).done(function (success) {
                            try {
                                callback(index, success, ensembleFile._uniqueId);
                            }
                            catch (exception) {
                                //Item does not have a thumbnail.
                                callback(index, '', ensembleFile._uniqueId);
                            }
                        });
                        break;
                            
                }
            }
        },

        retrieveMediaPreview: function (ensembleFile, callback, payload) {
            /// <summary>Loads a preview for the given Ensemble file.</summary>
            /// <param name="ensembleFile" type="Ensemble.EnsembleFile">The file for which to load a preview.</param>
            /// <param name="callback" type="Function">The callback to execute after the preview loaded. The callback will be passed both the Ensemble file and a URI referencing its media.</param>
            /// <param name="payload" type="Object">Optional. An object that will be passed to the callback with the retrieved data.</param>
            var returnVal = URL.createObjectURL(ensembleFile._src, { oneTimeOnly: true });
            callback(ensembleFile, returnVal, payload);
        },

        _clearTempItemsLookup: function () {
            Ensemble.FileIO._pickItemsTempFilesCount = 0;
            Ensemble.FileIO._pickItemsTempFiles = [];
            Ensemble.FileIO._pickItemsTempFolders = [];
        },

        _winRetrievePickItemsTempFilesMediaProperties: function () {
            /// <summary>Retrieves media properties for all of the temporary media items. </summary>
            if (Ensemble.FileIO._pickItemsTempFiles.length == 0) Ensemble.FileIO._winCompleteMediaPropertyLookup();
            for (var i = 0; i < Ensemble.FileIO._pickItemsTempFiles.length; i++) {
                switch (Ensemble.FileIO._pickItemsTempFiles[i].eo1type) {
                    case "video":
                        Ensemble.FileIO._winRetrieveVideoProperties(Ensemble.FileIO._pickItemsTempFiles[i]._src, i);
                        break;
                    case "audio":
                        Ensemble.FileIO._winRetrieveMusicProperties(Ensemble.FileIO._pickItemsTempFiles[i]._src, i);
                        break;
                    case "picture":
                        Ensemble.FileIO._winRetrieveImageProperties(Ensemble.FileIO._pickItemsTempFiles[i]._src, i);
                        break;
                }
            }
        },

        _winRetrieveVideoProperties: function (srcfile, index) {
            /// <summary>Retrieves media properties for all of the temporary media items. </summary>
            /// <param name="srcfile" type="Windows.Storage.StorageFile">The file whose properties to look up.</param>
            /// <param name="index" type="Number">The file's position in the overall list.</param>
            (function () {
                srcfile.properties.getVideoPropertiesAsync().done(function (success) {
                    //console.log("Retrieved video properties for the item at index " + index + ".");
                    var returnVal = {
                        bitrate: success.bitrate,
                        duration: success.duration,
                        height: success.height,
                        width: success.width,
                        title: success.title
                    };
                    
                    Ensemble.Editor.MediaBrowser.updateMediaFileMeta(index + Ensemble.FileIO._pickItemsTempFolders.length, returnVal);
                    Ensemble.FileIO._winCompleteMediaPropertyLookup();
                });
            })();
        },

        _winRetrieveMusicProperties: function (srcfile, index) {
            /// <summary>Retrieves media properties for all of the temporary media items. </summary>
            /// <param name="srcfile" type="Windows.Storage.StorageFile">The file whose properties to look up.</param>
            /// <param name="index" type="Number">The file's position in the overall list.</param>
            (function () {
                srcfile.properties.getMusicPropertiesAsync().done(function (success) {
                    //console.log("Retrieved music properties.");

                    var returnVal = {
                        album: success.album,
                        albumArtist: success.albumArtist,
                        artist: success.artist,
                        bitrate: success.bitrate,
                        duration: success.duration,
                        genre: success.genre,
                        title: success.title
                    };

                    Ensemble.Editor.MediaBrowser.updateMediaFileMeta(index + Ensemble.FileIO._pickItemsTempFolders.length, returnVal);
                    Ensemble.FileIO._winCompleteMediaPropertyLookup();
                });
            })();
        },

        _winRetrieveImageProperties: function (srcfile, index) {
            /// <summary>Retrieves media properties for all of the temporary media items. </summary>
            /// <param name="srcfile" type="Windows.Storage.StorageFile">The file whose properties to look up.</param>
            /// <param name="index" type="Number">The file's position in the overall list.</param>
            (function () {
                srcfile.properties.getImagePropertiesAsync().done(function (success) {
                    //console.log("Retrieved image properties for file \"" + srcfile.name + ".\"");
                    var returnVal = {
                        dateTaken: success.dateTaken,
                        height: success.height,
                        width: success.width,
                        title: success.title,
                    };
                    Ensemble.Editor.MediaBrowser.updateMediaFileMeta(index + Ensemble.FileIO._pickItemsTempFolders.length, returnVal);
                    Ensemble.FileIO._winCompleteMediaPropertyLookup();
                });
            })();
        },

        _winCompleteMediaPropertyLookup: function () {
            Ensemble.FileIO._pickItemsTempFilesCount++;
            if (Ensemble.FileIO._pickItemsTempFilesCount >= Ensemble.FileIO._pickItemsTempFiles.length) {
                //Lookup complete. Execute callback.
                //Ensemble.FileIO._pickItemsCallback(Ensemble.FileIO._pickItemsTempFiles, Ensemble.FileIO._pickItemsTempFolders);
                console.info("Metadata retrieval complete.");
                //Reset the temporary file-lookup references.
                Ensemble.FileIO._clearTempItemsLookup();
            }
        },

        _generateAccessToken: function (file, callback, payload) {
            Windows.Storage.StorageFile.getFileFromPathAsync(file.path).done(function (complete) {
                //No token necessary - the file is accessible via path (is in a known library).
                callback(file, payload);
            }, function (error) {
                if (Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.entries.length == Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.maximumItemsAllowed) {
                    Ensemble.FileIO._removeOldestAccessToken();
                }
                file.token = Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.add(file._src, new Date().getTime());
                callback(file, payload);
            })
        },

        _removeOldestAccessToken: function () {
            /// <summary>Removes the oldest file access token from the Windows FutureAccessList.</summary>
            let min = Infinity;
            let token = null;
            for (let i = 0; i < Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.entries.length; i++) {
                if (min > parseInt(Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.entries[i].metadata, 10)) {
                    min = parseInt(Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.entries[i].metadata, 10)
                    token = Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.entries[i].token;
                }
            }
            Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.remove(token);
        },

        getHomeDirectory: function (directoryName) {
            /// <summary>Returns the home directory of the given media type.</summary>
            /// <param name="directoryName" type="String">The string representing the home directory name. Must be one of the following: "video" "music" "picture"</param>
            /// <returns type="Ensemble.EnsembleFolder">An EnsembleFolder representing the given home directory.</returns>
            var returnVal = null;
            switch (directoryName) {
                case "video":
                    returnVal = new Ensemble.EnsembleFolder(Windows.Storage.KnownFolders.videosLibrary);
                    break;
                case "music":
                    returnVal = new Ensemble.EnsembleFolder(Windows.Storage.KnownFolders.musicLibrary);
                    break;
                case "picture":
                    returnVal = new Ensemble.EnsembleFolder(Windows.Storage.KnownFolders.picturesLibrary);
                    break;
            }
            return returnVal;
        },

        deleteProject: function (filename) {
            /// <summary>Permanently deletes the project with the given filename.</summary>
            /// <param name="filename" type="String">The filename of the project to be deleted.</param>
            var dataArray = [];
            Windows.Storage.ApplicationData.current.localFolder.getFolderAsync("Projects").then(function (projectDir) {
                projectDir.getFileAsync(filename).then(function (projectFile) {
                    projectFile.deleteAsync(Windows.Storage.StorageDeleteOption.permanentDelete).then(function (done) {
                        console.log("Deleted project file.");
                    });
                });
                projectDir.getFileAsync(filename + ".jpg").then(function (projectFile) {
                    projectFile.deleteAsync(Windows.Storage.StorageDeleteOption.permanentDelete).then(function (done) {
                        console.log("Deleted project thumbnail.");
                    });
                });
            });
        },

        deleteAllProjects: function () {
            /// <summary>Permanently deletes all projects and their accompanying thumbnails.</summary>
            console.log("Deleting all projects...");

            Windows.Storage.ApplicationData.current.localFolder.getFolderAsync("Projects").then(function (projectDir) {
                var projectQueryOptions = new Windows.Storage.Search.QueryOptions(Windows.Storage.Search.CommonFileQuery.orderByName, [".eo1", ".jpg"]);
                var projectQuery = projectDir.createFileQueryWithOptions(projectQueryOptions);
                projectQuery.getFilesAsync().then(function (projectFiles) {
                    if (projectFiles.length > 0) {
                        for (var i = 0; i < projectFiles.length; i++) {
                            projectFiles[i].deleteAsync(Windows.Storage.StorageDeleteOption.permanentDelete);
                        }
                        console.info("Deleted all projects.");
                    }
                    else console.log("No projects to delete.");
                });
            });
        },

        showMediaFilePicker: function (callback, payload) {
            let openPicker = new Windows.Storage.Pickers.FileOpenPicker();
            openPicker.viewMode = Windows.Storage.Pickers.PickerViewMode.list;
            openPicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.videosLibrary;
            openPicker.fileTypeFilter.replaceAll(Ensemble.FileIO.supportedAudioTypes.concat(Ensemble.FileIO.supportedImageTypes).concat(Ensemble.FileIO.supportedVideoTypes));
            openPicker.pickSingleFileAsync().then(function (file) {
                if (file) {
                    let newFile = Ensemble.FileIO._createFileFromSrc(file);
                    Ensemble.FileIO.retrieveMediaProperties(newFile, newFile, function (index, returnVal, uniqueId) {
                        console.log("Picked a file.");
                        for (prop in returnVal) {
                            index[prop] = returnVal[prop];
                        }

                        Ensemble.FileIO._generateAccessToken(index, function (fileWithToken, filePayload) {
                            callback(fileWithToken, filePayload);
                        }, payload);
                    });
                } else {
                    console.log("Did not pick a file.");
                }
            });
        },

        addOrReplaceRecentProject: function (projectFile) {
            /// <summary>Adds the specified project file to the recent projects list.</summary>
            /// <param name="projectFile" type="Windows.Storage.StorageFile">The project file to add.</param>
            Ensemble.Settings.addOrReplaceRecentProjectToken(Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.add(projectFile));
        },

        removeRecentProject: function (projectFile) {
            /// <summary>Removes the specified project file from the recent projects list.</summary>
            /// <param name="projectFile" type="Windows.Storage.StorageFile">The project file to remove.</param>
            let fileToken = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.add(projectFile);
            Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.remove(fileToken);
            Ensemble.Settings.removeRecentProject(fileToken);
        }
    });
})();