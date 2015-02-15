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
                }
                else {
                    if (this._type == Ensemble.Events.Action.ActionType.importClip) returnVal = true;
                }
                return returnVal;
            },

            performAction: function () {
                /// <summary>Performs the task associated with the Action.</summary>
                switch (this._type) {
                    case Ensemble.Events.Action.ActionType.createTrack:
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
                        break;
                    case Ensemble.Events.Action.ActionType.renameTrack:
                        Ensemble.Editor.TimelineMGR.renameTrack(this._payload.trackId, this._payload.newName);
                        //Ensemble.Editor.TimelineMGR.getTrackById(this._payload.affectedId).name = this._payload.newName;
                        break;
                    case Ensemble.Events.Action.ActionType.trackVolumeChanged:
                        Ensemble.Editor.TimelineMGR.changeTrackVolume(this._payload.trackId, this._payload.newVolume);
                        break;
                    case Ensemble.Events.Action.ActionType.moveTrack:
                        Ensemble.Editor.TimelineMGR.moveTrackWithId(this._payload.trackId, this._payload.origin, this._payload.destination);
                        break;
                    case Ensemble.Events.Action.ActionType.removeTrack:
                        var removalObj = Ensemble.Editor.TimelineMGR.removeTrack(this._payload.trackId);
                        this._payload.trackObj = removalObj.track;
                        this._payload.originalLocation = removalObj.index;
                        break;
                    case Ensemble.Events.Action.ActionType.importClip:
                        Ensemble.FileIO._loadFileFromStub(this._payload.clipObj, null, Ensemble.HistoryMGR._importActionCompleted, true);
                        //Ensemble.FileIO.loadClip(this._payload.clipObj, null, cb);
                        //Ensemble.Editor.TimelineMGR.addClipToTrack(this._payload.clipObj, this._payload.destinationTrack, this._payload.destinationTime);
                        break;
                    default:
                        console.error("Unknown Action!");
                }
            },

            undo: function () {
                /// <summary>Reverts the changes caused by this Action.</summary>
                switch (this._type) {
                    case Ensemble.Events.Action.ActionType.createTrack:
                        console.log("Undoing new track creation...");
                        Ensemble.Editor.TimelineMGR.removeTrack(this._payload.trackId);
                        break;
                    case Ensemble.Events.Action.ActionType.renameTrack:
                        console.log("Undoing new track rename...");
                        Ensemble.Editor.TimelineMGR.renameTrack(this._payload.trackId, this._payload.oldName);
                        break;
                    case Ensemble.Events.Action.ActionType.trackVolumeChanged:
                        console.log("Undoing track volume change...");
                        Ensemble.Editor.TimelineMGR.changeTrackVolume(this._payload.trackId, this._payload.oldVolume);
                        break;
                    case Ensemble.Events.Action.ActionType.moveTrack:
                        console.log("Undoing track move...");
                        Ensemble.Editor.TimelineMGR.moveTrackWithId(this._payload.trackId, this._payload.destination, this._payload.origin);
                        break;
                    case Ensemble.Events.Action.ActionType.removeTrack:
                        console.log("Undoing track removal...");
                        // Load all clips.
                        Ensemble.FileIO._loadMultipleClips(this._payload.trackObj.clips, null, Ensemble.HistoryMGR._undoRemoveTrackComplete);
                        break;
                    case Ensemble.Events.Action.ActionType.importClip:
                        console.log("Undoing clip import...");
                        let removedClip = Ensemble.Editor.TimelineMGR.removeClip(this._payload.clipId);
                        this._payload = {
                            clipObj: removedClip.clip,
                            clipId: removedClip.clip.id,
                            destinationTime: removedClip.clip.startTime,
                            destinationTrack: removedClip.trackId
                        };
                        break;
                    default:
                        console.error("Unknown Action!");
                }
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
                        clip.duration = eFile.duration;
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

                        let dimensions = Ensemble.Editor.Renderer.generateClipInitialPosition(player.videoWidth, player.videoHeight);
                        clip.width = player.width = dimensions.width;
                        clip.height = player.height = dimensions.height;
                        clip.xcoord = dimensions.xcoord;
                        clip.ycoord = dimensions.ycoord;
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
                importClip: "importClip"
            }
        }
    );

    WinJS.Namespace.define("Ensemble.Events", {
        Action: Action
    });
})();