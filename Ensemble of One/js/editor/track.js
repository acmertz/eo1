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

            this._empty = [
                {
                    start: Number.NEGATIVE_INFINITY,
                    end: Number.POSITIVE_INFINITY
                }
            ];
        },
        {
            //Instance members
            clips: null,
            id: null,
            name: null,
            volume: null,
            _empty: null,

            setVolume: function (volumeToSet) {
                /// <summary>Sets the volume modifier of the track.</summary>
                /// <param name="volumeToSet" type="Number">The volume to assign the track.</param>
                this.volume = volumeToSet;
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