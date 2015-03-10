(function () {
    var Track = WinJS.Class.define(
        function (idVal, nameVal, volumeVal) {
            /// <summary>Manages a single media track within a project.</summary>
            /// <param name="idVal" type="Number">Optional. An ID to assign the Track. If no value is given, a new ID will be generated automatically.</param>
            /// <param name="nameVal" type="String">Optional. A name to assign the Track. If no value is given, "Untitled track" will become its name.</param>
            /// <param name="volumeVal" type="Number">Optional. A volume level to assign the track. If no value is given, the track will have a volume of 1.</param>

            //Constructor
            this.clips = [];

            if (idVal != null) this.id = idVal;
            else this.id = Ensemble.Editor.TimelineMGR.generateNewTrackId();

            if (nameVal != null) this.name = nameVal;
            else this.name = "Untitled track";

            if (volumeVal != null) this.volume = volumeVal;
            else this.volume = 1;

        },
        {
            //Instance members
            clips: null,
            id: null,
            name: null,
            volume: null,

            setVolume: function (volumeToSet) {
                /// <summary>Sets the volume modifier of the track.</summary>
                /// <param name="volumeToSet" type="Number">The volume to assign the track.</param>
                this.volume = volumeToSet;
            },

            insertClip: function (clipObj) {
                /// <summary>Adds the given Clip to the Track. Assumes that an appropriate time has already been assigned to the Track by the TimelineMGR.</summary>
                /// <param name="clipObj" type="Ensemble.Editor.Clip">The Clip to add.</param>
                if (this.clips.length > 0) {
                    if (this.clips[0].startTime > clipObj.startTime) {
                        this.clips.splice(0, 0, clipObj);
                    }
                    else {
                        for (let i = 0; i < this.clips.length; i++) {
                            if (clipObj.startTime > this.clips[i].startTime) {
                                this.clips.splice(i + 1, 0, clipObj);
                            }
                        }
                    }
                    return;
                }
                this.clips.push(clipObj);
            },

            getClipById: function (idval) {
                /// <summary>Returns the clip with the given ID, provided it exists.</summary>
                /// <param name="idval" type="Number">The ID of the clip for which to search.</param>
                /// <returns type="Ensemble.Editor.Clip">The matching Clip.</returns>
                for (var i = 0; i < this.clips.length; i++) {
                    if (this.clips[i].id == idval) return this.clips[i];
                }
                return null;
            },

            clipCollisionAt: function (time, duration) {
                /// <summary>Returns whether or not a clip with the given duration would fit in the track at the given time.</summary>
                /// <param name="time" type="Number">A number in milliseconds representing the time where the clip would start.</param>
                /// <param name="duration" type="Number">A number in mlliseconds representing the duration of the clip.</param>
                /// <returns type="Object">An object containing three members: boolean "collision", string "reason", and Clip ID "offending".</returns>
                if (this.clips.length > 0) {
                    for (var i = 0; i < this.clips.length; i++) {
                        if (this.clips[i].startTime < time) {
                            if (time < this.clips[i].startTime + this.clips[i].duration) {
                                // new clip beginning intersects old clip
                                return {
                                    collision: true,
                                    reason: Ensemble.Editor.Clip.CollisionType.clipBeginning,
                                    offending: this.clips[i].id
                                };
                            }
                        }

                        if (this.clips[i].startTime < time + duration) {
                            if (time + duration < this.clips[i] + this.clips[i].duration) {
                                // new clip end intersects old clip
                                return {
                                    collision: true,
                                    reason: Ensemble.Editor.Clip.CollisionType.clipEnd,
                                    offending: this.clips[i].id
                                };
                            }
                        }

                        if (time < this.clips[i].startTime) {
                            if (this.clips[i].startTime + this.clips[i].duration < time + duration) {
                                // new clip encloses old
                                return {
                                    collision: true,
                                    reason: Ensemble.Editor.Clip.CollisionType.clipContains,
                                    offending: this.clips[i].id
                                };
                            }
                        }

                    }
                }
                return {
                    collision: false,
                    reason: null,
                    offending: null
                };
            },

            freeSlotsAfter: function (offending, newClip) {
                /// <summary>Returns an array of start times that would be suitable for the new clip.</summary>
                /// <param name="offending" type="Ensemble.Editor.Clip">The existing clip, around which the new one will be positioned.</param>
                /// <param name="newClip" type="Ensemble.Editor.Clip">The new clip, with a potentially inappropriate time.</param>
                /// <returns type="Array">An array of suitable times for the new clip.</returns>
                let searchStart = null;
                for (let i = 0; i < this.clips.length; i++) {
                    if (this.clips[i].id == offending.id) {
                        searchStart = i;
                        break;
                    }
                }

                let validTimes = [];
                for (let i = searchStart; i < this.clips.length - 1; i++) {
                    let existingEndTime = this.clips[i].startTime + this.clips[i].duration;
                    let requiredEndTime = existingEndTime + newClip.duration;
                    if (this.clips[i + 1].startTime >= requiredEndTime) validTimes.push(existingEndTime);
                }

                validTimes.push(this.clips[this.clips.length - 1].startTime + this.clips[this.clips.length - 1].duration);

                return validTimes;
            },

            freeSlotsBefore: function (offending, newClip) {
                /// <summary>Returns an array of start times that would be suitable for the new clip.</summary>
                /// <param name="offending" type="Ensemble.Editor.Clip">The existing clip, around which the new one will be positioned.</param>
                /// <param name="newClip" type="Ensemble.Editor.Clip">The new clip, with a potentially inappropriate time.</param>
                /// <returns type="Array">An array of suitable times for the new clip.</returns>
                let searchStart = null;
                for (let i = this.clips.length - 1; i >= 0; i--) {
                    if (this.clips[i].id == offending.id) {
                        searchStart = i;
                        break;
                    }
                }

                let validTimes = [];
                for (let i = searchStart; i > 0; i--) {
                    let existingEndTime = this.clips[i - 1].startTime + this.clips[i - 1].duration;
                    let requiredEndTime = existingEndTime + newClip.duration;
                    if (this.clips[i].startTime >= requiredEndTime) validTimes.push(existingEndTime);
                }

                if (this.clips[0].startTime >= newClip.duration) validTimes.push(this.clips[0].startTime - newClip.duration);

                return validTimes;
            }
        },
        {
            //Static members
        }
    );

    WinJS.Namespace.define("Ensemble.Editor", {
        Track: Track
    });
})();