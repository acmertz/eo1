(function () {
    WinJS.Namespace.define("Ensemble.Util.MouseTracker", {
        /// <summary>Provides tools for exposing pointer locations.</summary>

        x: 0,
        y: 0,

        startTracking: function (initialX, initialY) {
            /// <summary>Start tracking mouse position.</summary>
            /// <param name="initialX" type="Number">An optional starting X value.</param>
            /// <param name="initialY" type="Number">An optional starting Y value.</param>
            if (initialX) Ensemble.Util.MouseTracker.x = initialX;
            if (initialY) Ensemble.Util.MouseTracker.y = initialY;
            document.addEventListener("mousemove", Ensemble.Util.MouseTracker._updateMousePosition, false);
        },

        stopTracking: function () {
            /// <summary>Stops tracking mouse position.</summary>
            document.removeEventListener("mousemove", Ensemble.Util.MouseTracker._updateMousePosition);
        },

        _updateMousePosition: function (event) {
            Ensemble.Util.MouseTracker.x = event.clientX;
            Ensemble.Util.MouseTracker.y = event.clientY;
        }
    });
})();