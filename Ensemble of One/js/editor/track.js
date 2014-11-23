(function () {
    var Track = WinJS.Class.define(
        function (idVal, nameVal) {
            /// <summary>Manages a single media track within a project.</summary>
            /// <param name="idVal" type="Number">Optional. An ID to assign the Track. If no value is given, a new ID will be generated automatically.</param>
            /// <param name="nameVal" type="String">Optional. A name to assign the Track. If no value is given, "Untitled track" will become its name.</param>

            //Constructor
            this.clips = [];

            if (idVal != null) this.id = idVal;
            else this.id = Ensemble.Editor.TimelineMGR.generateNewTrackId();

            if (nameVal != null) this.name = nameVal;
            else this.name = "Untitled track";

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
            _empty: null

        },
        {
            //Static members
        }
    );

    WinJS.Namespace.define("Ensemble.Editor", {
        Track: Track
    });
})();