﻿(function () {
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


            isCompound: function () {
                /// <summary>Indicates whether or not the Action is a compound Action (causes other Actions to occur automatically; i.e., removing a Track also removes all instances of MediaClip that it contains).</summary>
                /// <returns type="Boolean">A Boolean value indicating whether or not the Action is compound.</returns>
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
                    default:
                        console.error("Unknown Action!");
                }
                
                //Save project.
                setTimeout(function () {
                    Ensemble.FileIO.saveProject();
                }, 0);
            },

            undo: function () {
                /// <summary>Reverts the changes caused by this Action.</summary>
                switch (this._type) {
                    case Ensemble.Events.Action.ActionType.createTrack:
                        console.log("Undoing new track creation...");
                        Ensemble.Editor.TimelineMGR.removeTrack(this._payload.trackId);
                        break;
                    default:
                        console.error("Unknown Action!");
                }

                //Save project.
                setTimeout(function () {
                    Ensemble.FileIO.saveProject();
                }, 0);
            }
        },
        {
            //Static members
            ActionType: {
                createTrack: "createTrack"
            }
        }
    );

    WinJS.Namespace.define("Ensemble.Events", {
        Action: Action
    });
})();