(function () {
    var Track = WinJS.Class.define(
        function () {
            /// <summary>Manages a single media track within a project.</summary>
            //Constructor
            this._clips = [];
            this._empty = [
                {
                    start: Number.NEGATIVE_INFINITY,
                    end: Number.POSITIVE_INFINITY
                }
            ];
        },
        {
            //Instance members
            _clips: null,
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