(function () {
    var Renderer = WinJS.Class.define(
        function (displaySurface) {
            /// <summary>Renders playback frames to any active display surfaces within the Editor.</summary>
            /// <param name="displaySurface" type="Canvas">The surface to be used for rendering frames.</param>
            //Constructor
            this._canvas = displaySurface;
        },
        {
            //Instance members
            _canvas: null
        },
        {
            //Static members
        }
    );

    WinJS.Namespace.define("Ensemble.Editor", {
        Renderer: Renderer
    });
})();