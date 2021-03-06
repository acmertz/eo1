﻿(function () {
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
                for (let i = 0; i < this.clips.length; i++) {
                    this.clips[i].setVolumeModifier(volumeToSet);
                }
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
                                break;
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
                /// <returns type="Object">An object containing three members: boolean "collision", Number Array "offending" (containing clip IDs), and String Array "reason."</returns>
                let returnVal = {
                    collision: false,
                    offending: [],
                    reason: []
                }
                if (this.clips.length > 0) {
                    for (var i = 0; i < this.clips.length; i++) {
                        if (this.clips[i].startTime <= time) {
                            if (time <= this.clips[i].startTime + this.clips[i].duration) {
                                // new clip beginning intersects old clip
                                returnVal.collision = true;
                                returnVal.offending.push(this.clips[i].id);
                                returnVal.reason.push(Ensemble.Editor.Clip.CollisionType.clipBeginning);
                            }
                        }

                        if (this.clips[i].startTime <= time + duration) {
                            if (time + duration <= this.clips[i].startTime + this.clips[i].duration) {
                                // new clip end intersects old clip
                                returnVal.collision = true;
                                returnVal.offending.push(this.clips[i].id);
                                returnVal.reason.push(Ensemble.Editor.Clip.CollisionType.clipEnd);
                            }
                        }

                        if (time <= this.clips[i].startTime) {
                            if (this.clips[i].startTime + this.clips[i].duration <= time + duration) {
                                // new clip encloses old
                                returnVal.collision = true;
                                returnVal.offending.push(this.clips[i].id);
                                returnVal.reason.push(Ensemble.Editor.Clip.CollisionType.clipContains);
                            }
                        }

                    }
                }
                return returnVal;
            },

            closestFreeSlot: function (time, duration, omit, skipBefore, skipAfter) {
                /// <summary>Returns the time closest to the given value that could contain the clip with the given duration.</summary>
                /// <param name="time" type="Number">The target time.</param>
                /// <param name="duration" type="Number">The duration of the clip.</param>
                /// <param name="omit" type="Number">The ID of a clip to omit from the search.</param>
                /// <param name="skipBefore" type="Boolean">Optional. When true, skips checking for a slot before the given time.</param>
                /// <param name="skipAfter" type="Boolean">Optional. When true, skips checking for a slot after the given time.</param>
                let computedTime = time;

                // first, check to see if there's actually a collision.
                let collision = false;
                for (let i = 0; i < this.clips.length; i++) {
                    if (this.clips[i].timeCollision(omit, time, time + duration)) {
                        collision = true;
                        break;
                    }
                }

                if (collision) {
                    let prunedClipList = [];
                    for (let i = 0; i < this.clips.length; i++) {
                        if (this.clips[i].id != omit) prunedClipList.push(this.clips[i]);
                    }

                    let emptySlots = [];
                    if (prunedClipList[0].startTime > 0) {
                        if (prunedClipList[0].startTime > duration) {
                            emptySlots.push({
                                start: 0,
                                end: prunedClipList[0].startTime
                            });
                        }
                    }

                    let min = Infinity;
                    for (let i = 0; i < prunedClipList.length; i++) {
                        if (prunedClipList.length > i + 1) {
                            let tempStart = prunedClipList[i].startTime + prunedClipList[i].duration;
                            let tempEnd = prunedClipList[i + 1].startTime;
                            if (tempEnd - tempStart > duration) emptySlots.push({
                                    start: tempStart,
                                    end: prunedClipList[i + 1].startTime
                                });
                        }
                    }
                    emptySlots.push({
                        start: prunedClipList[prunedClipList.length - 1].startTime + prunedClipList[prunedClipList.length - 1].duration,
                        end: Infinity
                    })

                    // emptySlots is now an array containing all positions that could hold the clip. Now find the one that's closest
                    
                    let closestAfter = null;
                    let closestBefore = null;

                    if (!skipAfter) {
                        for (let i = 0; i < emptySlots.length; i++) {
                            if (emptySlots[i].start > time) {
                                closestAfter = emptySlots[i].start;
                                break;
                            }
                        }
                    }

                    if (!skipBefore) {
                        for (let i = 0; i < emptySlots.length; i++) {
                            if (emptySlots[i].start > time && i > 0) {
                                closestBefore = emptySlots[i - 1].end;
                                break;
                            }
                        }
                    }

                    if (closestBefore == null || Math.abs(closestBefore - time) > Math.abs(closestAfter - time)) {
                        computedTime = closestAfter;
                    }
                    else {
                        computedTime = closestBefore - duration;
                    }
                }

                return computedTime;
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