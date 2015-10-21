(function () {
    var Action = WinJS.Class.define(
        function (actionType, payload) {
            /// <summary>An object used to represent a single user interaction with the application.</summary>
            /// <param name="actionType" type="Ensemble.Events.Action.ActionType">A string representing the type of action to perform.</param>
            /// <param name="payload" type="Object">An optional payload for the Action, containing information relative to the task this Action represents.</param>
            
            //Constructor
            this._type = actionType;
            this._payload = payload;

        },
        {
            //Instance members
            _compound: null,
            _type: null,
            _payload:  null,


            isCompound: function (undoing) {
                /// <summary>Indicates whether or not the Action is a compound Action (causes other Actions to occur automatically; i.e., removing a Track also removes all instances of MediaClip that it contains).</summary>
                /// <param name="undoing" type="Boolean">A Boolean indicating that the Action is going to be undone (the answer may vary depending on whether the action will be performed or undone).</param>
                /// <returns type="Boolean">A Boolean value indicating whether or not the Action is compound.</returns>
                let returnVal = false;
                if (undoing) {
                    if (this._type == Ensemble.Events.Action.ActionType.removeTrack) returnVal = true;
                    if (this._type == Ensemble.Events.Action.ActionType.removeClip) returnVal = true;
                }
                else {
                    if (this._type == Ensemble.Events.Action.ActionType.importClip) returnVal = true;
                }
                return returnVal;
            },

            performAction: function () {
                /// <summary>Performs the task associated with the Action.</summary>
                if (this._type == Ensemble.Events.Action.ActionType.createTrack) {
                    console.log("Creating new track...");
                    if (this._payload) {
                        Ensemble.Editor.TimelineMGR.createTrack(null, this._payload.trackId);
                    }
                    else {
                        var affectedId = Ensemble.Editor.TimelineMGR.createTrack();
                        this._payload = {
                            trackId: affectedId
                        };
                    }
                }

                else if (this._type == Ensemble.Events.Action.ActionType.renameTrack) {
                    Ensemble.Editor.TimelineMGR.renameTrack(this._payload.trackId, this._payload.newName);
                }

                else if (this._type == Ensemble.Events.Action.ActionType.trackVolumeChanged) {
                    Ensemble.Editor.TimelineMGR.changeTrackVolume(this._payload.trackId, this._payload.newVolume);
                }

                else if (this._type == Ensemble.Events.Action.ActionType.moveTrack) {
                    Ensemble.Editor.TimelineMGR.moveTrackWithId(this._payload.trackId, this._payload.origin, this._payload.destination);
                }

                else if (this._type == Ensemble.Events.Action.ActionType.removeTrack) {
                    var removalObj = Ensemble.Editor.TimelineMGR.removeTrack(this._payload.trackId);
                    this._payload.trackObj = removalObj.track;
                    this._payload.originalLocation = removalObj.index;
                }

                else if (this._type == Ensemble.Events.Action.ActionType.importClip) {
                    Ensemble.FileIO._loadFileFromStub(this._payload.clipObj, null, Ensemble.HistoryMGR._importActionCompleted, true);
                }

                else if (this._type == Ensemble.Events.Action.ActionType.removeClip) {
                    let removedClips = [];
                    let trackLocations = [];
                    for (let i = 0; i < this._payload.clipIds.length; i++) {
                        let removedClip = Ensemble.Editor.TimelineMGR.removeClip(this._payload.clipIds[i]);
                        removedClips.push(removedClip.clip);
                        trackLocations.push(removedClip.trackId);
                    }
                    this._payload = {
                        clipObjs: removedClips,
                        trackLocations: trackLocations
                    };
                }

                else if (this._type == Ensemble.Events.Action.ActionType.moveClip) {
                    let destTracks = this._payload.destinationTracks;
                    let destTimes = this._payload.destinationTimes;
                    let origTracks = this._payload.originalTracks;
                    let origTimes = this._payload.originalTimes;
                    let ids = this._payload.clipIds;
                    for (let i = 0; i < ids.length; i++) {
                        Ensemble.Editor.TimelineMGR.moveClip(ids[i], destTracks[i], destTimes[i]);
                    }
                }

                else if (this._type == Ensemble.Events.Action.ActionType.trimClip) {
                    Ensemble.Editor.TimelineMGR.trimClip(this._payload.clipId, this._payload.newStartTime, this._payload.newDuration, this._payload.newStartTrim, this._payload.newEndTrim);
                }

                else if (this._type == Ensemble.Events.Action.ActionType.splitClip) {
                    this._payload.newIds = Ensemble.Editor.TimelineMGR.splitClip(this._payload.clipIds, this._payload.time, this._payload.newIds);
                }

                else if (this._type == Ensemble.Events.Action.ActionType.positionClip) {
                    let ids = this._payload.clipIds;
                    let newX = this._payload.newX;
                    let newY = this._payload.newY;
                    let newWidth = this._payload.newWidth;
                    let newHeight = this._payload.newHeight;

                    for (let i = 0; i < ids.length; i++) {
                        Ensemble.Editor.TimelineMGR.positionClip(ids[i], newX[i], newY[i], newWidth[i], newHeight[i]);
                    }
                    Ensemble.Editor.Renderer.requestFrame();
                }

                else if (this._type == Ensemble.Events.Action.ActionType.renameClip) {
                    Ensemble.Editor.TimelineMGR.renameClip(this._payload.clipId, this._payload.newName);
                }

                else if (this._type == Ensemble.Events.Action.ActionType.clipVolumeChanged) {
                    Ensemble.Editor.TimelineMGR.changeClipVolume(this._payload.clipId, this._payload.newVolume);
                }

                else if (this._type == Ensemble.Events.Action.ActionType.createLens) {
                    // create lens
                    let newLens = new Ensemble.Editor.Clip(this._payload.lensId);

                    this._payload.lensId = newLens.id;

                    newLens.type = Ensemble.Editor.Clip.ClipType.lens;
                    newLens.duration = Ensemble.Settings.retrieveSetting("default-picture-duration") * 1000;
                    newLens.preExisting = false;

                    newLens.name = "Untitled lens";
                    newLens.width = Ensemble.Session.projectResolution.width;
                    newLens.height = Ensemble.Session.projectResolution.height;
                    newLens.xcoord = 0;
                    newLens.ycoord = 0;
                    newLens.effectDetails = Ensemble.Editor.EffectMGR.generateDefaultValues(this._payload.lensType);
                    Ensemble.Editor.TimelineMGR.addClipToTrack(newLens, this._payload.destinationTrack, this._payload.destinationTime);
                }

                else console.error("Unknown Action!");
            },

            undo: function () {
                /// <summary>Reverts the changes caused by this Action.</summary>
                if (this._type == Ensemble.Events.Action.ActionType.createTrack) {
                    console.log("Undoing new track creation...");
                    Ensemble.Editor.TimelineMGR.removeTrack(this._payload.trackId);
                }

                else if (this._type == Ensemble.Events.Action.ActionType.renameTrack) {
                    console.log("Undoing new track rename...");
                    Ensemble.Editor.TimelineMGR.renameTrack(this._payload.trackId, this._payload.oldName);
                }

                else if (this._type == Ensemble.Events.Action.ActionType.trackVolumeChanged) {
                    console.log("Undoing track volume change...");
                    Ensemble.Editor.TimelineMGR.changeTrackVolume(this._payload.trackId, this._payload.oldVolume);
                }

                else if (this._type == Ensemble.Events.Action.ActionType.moveTrack) {
                    console.log("Undoing track move...");
                    Ensemble.Editor.TimelineMGR.moveTrackWithId(this._payload.trackId, this._payload.destination, this._payload.origin);
                }

                else if (this._type == Ensemble.Events.Action.ActionType.removeTrack) {
                    console.log("Undoing track removal...");
                    Ensemble.FileIO._loadMultipleClips(this._payload.trackObj.clips, null, Ensemble.HistoryMGR._undoRemoveTrackComplete);
                }

                else if (this._type == Ensemble.Events.Action.ActionType.importClip) {
                    console.log("Undoing clip import...");
                    let removedClip = Ensemble.Editor.TimelineMGR.removeClip(this._payload.clipId);
                    this._payload = {
                        clipObj: removedClip.clip,
                        clipId: removedClip.clip.id,
                        destinationTime: removedClip.clip.startTime,
                        destinationTrack: removedClip.trackId
                    };
                }

                else if (this._type == Ensemble.Events.Action.ActionType.removeClip) {
                    console.log("Undoing clip removal...");
                    Ensemble.FileIO._loadMultipleClips(this._payload.clipObjs, null, Ensemble.HistoryMGR._undoRemoveClipComplete);
                }

                else if (this._type == Ensemble.Events.Action.ActionType.moveClip) {
                    console.log("Undoing clip move.");
                    let destTracks = this._payload.destinationTracks;
                    let destTimes = this._payload.destinationTimes;
                    let origTracks = this._payload.originalTracks;
                    let origTimes = this._payload.originalTimes;
                    let ids = this._payload.clipIds;
                    for (let i = 0; i < ids.length; i++) {
                        Ensemble.Editor.TimelineMGR.moveClip(ids[i], origTracks[i], origTimes[i]);
                    }
                }

                else if (this._type == Ensemble.Events.Action.ActionType.trimClip) {
                    Ensemble.Editor.TimelineMGR.trimClip(this._payload.clipId, this._payload.oldStartTime, this._payload.oldDuration, this._payload.oldStartTrim, this._payload.oldEndTrim);
                }

                else if (this._type == Ensemble.Events.Action.ActionType.splitClip) {
                    Ensemble.Editor.TimelineMGR.concatClip(this._payload.clipIds, this._payload.newIds);
                }

                else if (this._type == Ensemble.Events.Action.ActionType.positionClip) {
                    let ids = this._payload.clipIds;
                    let oldX = this._payload.oldX;
                    let oldY = this._payload.oldY;
                    let oldWidth = this._payload.oldWidth;
                    let oldHeight = this._payload.oldHeight;

                    for (let i = 0; i < ids.length; i++) {
                        Ensemble.Editor.TimelineMGR.positionClip(ids[i], oldX[i], oldY[i], oldWidth[i], oldHeight[i]);
                    }
                    Ensemble.Editor.Renderer.requestFrame();
                }

                else if (this._type == Ensemble.Events.Action.ActionType.renameClip) {
                    Ensemble.Editor.TimelineMGR.renameClip(this._payload.clipId, this._payload.oldName);
                }

                else if (this._type == Ensemble.Events.Action.ActionType.clipVolumeChanged) {
                    Ensemble.Editor.TimelineMGR.changeClipVolume(this._payload.clipId, this._payload.oldVolume);
                }

                else if (this._type == Ensemble.Events.Action.ActionType.createLens) {
                    // undo lens creation
                    Ensemble.Editor.TimelineMGR.removeClip(this._payload.lensId);
                }

                else console.error("Unknown Action!");
            },

            finish: function (params) {
                /// <summary>Finishes a multi-part, asynchronous Action.</summary>
                if (this._type == Ensemble.Events.Action.ActionType.importClip) {
                    // file and player
                    let clip = this._payload.clipObj;

                    let eFile = params.file;
                    let destinationTrack = this._payload.destinationTrack;
                    let destinationTime = this._payload.destinationTime;
                    let player = params.player;

                    if (!clip.preExisting) {
                        clip.duration = eFile.duration - clip.startTrim;
                        clip.name = eFile.title || eFile.displayName;
                        clip.file = eFile;
                        switch (eFile.eo1type) {
                            case "video":
                                clip.type = Ensemble.Editor.Clip.ClipType.video;
                                break;
                            case "audio":
                                clip.type = Ensemble.Editor.Clip.ClipType.audio;
                                break;
                            case "picture":
                                clip.type = Ensemble.Editor.Clip.ClipType.picture;
                                break;
                        }

                        if (clip.isRenderable()) {
                            let dimensions = null;
                            if (clip.type == Ensemble.Editor.Clip.ClipType.picture) dimensions = Ensemble.Editor.Renderer.generateClipInitialPosition(player.naturalWidth, player.naturalHeight);
                            else dimensions = Ensemble.Editor.Renderer.generateClipInitialPosition(player.videoWidth, player.videoHeight);
                            clip.width = player.width = dimensions.width;
                            clip.height = player.height = dimensions.height;
                            clip.xcoord = dimensions.xcoord;
                            clip.ycoord = dimensions.ycoord;
                        }
                    }
                    clip.setPlayer(player);
                    Ensemble.Editor.TimelineMGR.addClipToTrack(clip, destinationTrack, destinationTime);
                    Ensemble.HistoryMGR.refreshMessage();
                }
            },

            finishUndo: function (params) {
                if (this._type == Ensemble.Events.Action.ActionType.removeTrack) {
                    this._payload.trackObj.clips = params;
                    Ensemble.Editor.TimelineMGR.addTrackAtIndex(this._payload.trackObj, this._payload.originalLocation);
                    Ensemble.HistoryMGR.refreshMessage();
                }

                else if (this._type == Ensemble.Events.Action.ActionType.removeClip) {
                    console.log("Ready to reinsert removed clips.");
                    for (let i = 0; i < params.length; i++) {
                        //find the clip in the payload.
                        let clipIndex = -1;
                        for (let k = 0; k < this._payload.clipObjs.length; k++) {
                            if (this._payload.clipObjs[k].id == params[i].id) {
                                clipIndex = k;
                                break;
                            }
                        }
                        Ensemble.Editor.TimelineMGR.addClipToTrack(params[i], this._payload.trackLocations[clipIndex], params[i].startTime);
                    }
                    let idList = [];
                    for (let i = 0; i < this._payload.clipObjs.length; i++) {
                        idList.push(this._payload.clipObjs[i].id);
                    }
                    this._payload = {
                        clipIds: idList
                    }
                    Ensemble.HistoryMGR.refreshMessage();
                }
            },

            getMessage: function () {
                /// <summary>Generates a user-friendly message that describes the action.</summary>
                if (this._type == Ensemble.Events.Action.ActionType.createTrack) {
                    return "Created track";
                }
                else if (this._type == Ensemble.Events.Action.ActionType.renameTrack) {
                    return "Renamed track \"" + this._payload.oldName + "\" to \"" + this._payload.newName + "\"";
                }
                else if (this._type == Ensemble.Events.Action.ActionType.trackVolumeChanged) {
                    return "Changed track volume from " + (this._payload.oldVolume * 100) + " to " + (this._payload.newVolume * 100);
                }
                else if (this._type == Ensemble.Events.Action.ActionType.moveTrack) {
                    return "Moved track from position " + this._payload.origin + " to " + this._payload.destination;
                }
                else if (this._type == Ensemble.Events.Action.ActionType.removeTrack) {
                    return "Removed track \"" + this._payload.trackObj.name + "\"";
                }
                else if (this._type == Ensemble.Events.Action.ActionType.importClip) {
                    return "Imported clip \"" + Ensemble.Editor.TimelineMGR.getClipById(this._payload.clipId).name + "\"";
                }
                else if (this._type == Ensemble.Events.Action.ActionType.removeClip) {
                    return "Removed clip.";
                }
                else if (this._type == Ensemble.Events.Action.ActionType.moveClip) {
                    return "Moved clip.";
                }
                else if (this._type == Ensemble.Events.Action.ActionType.splitClip) {
                    return "Split clip.";
                }
                else if (this._type == Ensemble.Events.Action.ActionType.positionClip) {
                    return "Positioned/resized clip.";
                }
                else if (this._type == Ensemble.Events.Action.ActionType.renameClip) {
                    return "Renamed clip.";
                }
                else if (this._type == Ensemble.Events.Action.ActionType.clipVolumeChanged) {
                    return "Changed clip volume.";
                }
                else if (this._type == Ensemble.Events.Action.ActionType.trimClip) {
                    return "Trimmed clip.";
                }
                else if (this._type == Ensemble.Events.Action.ActionType.createLens) {
                    return "Created lens.";
                }
                else {
                    return "Unknown action";
                }
            }
        },
        {
            //Static members
            ActionType: {
                createTrack: "createTrack",
                renameTrack: "renameTrack",
                trackVolumeChanged: "trackVolumeChanged",
                moveTrack: "moveTrack",
                removeTrack: "removeTrack",
                importClip: "importClip",
                removeClip: "removeClip",
                moveClip: "moveClip",
                trimClip: "trimClip",
                splitClip: "splitClip",
                positionClip: "positionClip",
                renameClip: "renameClip",
                clipVolumeChanged: "clipVolumeChanged",
                createLens: "createLens"
            }
        }
    );

    WinJS.Namespace.define("Ensemble.Events", {
        Action: Action
    });
})();