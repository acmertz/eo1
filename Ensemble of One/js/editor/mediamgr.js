(function () {
    var MediaMGR = WinJS.Class.define(
        function () {
            /// <summary>Provides tools for managing all the MediaClip objects in a project.</summary>
            //Constructor
            this._index = new Ensemble.Editor.Index();
            this._timeline = new Ensemble.Editor.TimelineMGR();
        },
        {
            //Instance members

            //Timing index for managing playback.
            _index: null,
            //Timeline display for managing layers.
            _timeline: null,
        },
        {
            //Static members
        }
    );

    WinJS.Namespace.define("Ensemble.Editor", {
        MediaMGR: MediaMGR
    });
})();