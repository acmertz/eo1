(function () {
    WinJS.Namespace.define("Ensemble.Utilities.TimelineLabelGenerator", {
        /// <summary>Provides tools for generating aspect ratio-proportional widths and heights.</summary>

        zoomLevels: [
            {
                interval: 5,
                sub: 1,
                freq: 5
            },
            {
                interval: 10,
                sub: 5,
                freq: 10
            },
            {
                interval: 20,
                sub: 5,
                freq: 10
            },
            {
                interval: 50,
                sub: 10,
                freq: 50
            },
            {
                interval: 100,
                sub: 50,
                freq: 100
            },
            {
                interval: 200,
                sub: 50,
                freq: 100
            },
            {
                interval: 500,
                sub: 100,
                freq: 500
            },
            {
                interval: 1000,
                sub: 500,
                freq: 1000
            },
            {
                interval: 5000,
                sub: 1000,
                freq: 5000
            },
            {
                interval: 15000,
                sub: 5000,
                freq: 15000
            },
            {
                interval: 30000,
                sub: 10000,
                freq: 30000
            },
            {
                interval: 60000,
                sub: 30000,
                freq: 60000
            },
            {
                interval: 120000,
                sub: 60000,
                freq: 120000
            }
        ]
    });
})();