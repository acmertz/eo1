(function () {
    var Track = WinJS.Class.define(
        function (idVal) {
            /// <summary>Manages a single media track within a project.</summary>
            /// <param name="idVal" type="Number">Optional. An ID to assign the Track. If no value is given, a new ID will be generated automatically.</param>

            //Constructor
            this.clips = [];
            if (idVal != null) this.id = idVal;
            else this.id = Ensemble.Editor.TimelineMGR.generateNewTrackId();
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