(function () {
    var Index = WinJS.Class.define(
        function () {
            /// <summary>Manages the timing and grouping of MediaClip instances.</summary>
            //Constructor
            this.indexData = [];
        },
        {
            //Instance members
            //An array containing all of the IndexSegments that represent timing information within the project.
            indexData: null
        },
        {
            //Static members
        }
    );

    WinJS.Namespace.define("Ensemble.Editor", {
        Index: Index
    });
})();