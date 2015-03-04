(function () {
    WinJS.Namespace.define("Ensemble.Editor.TimelineZoomMGR", {
        /// <summary>Provides tools for generating aspect ratio-proportional widths and heights.</summary>
        currentLevel: 8,

        reset: function () {
            /// <summary>Resets the zoom level back to the default.</summary>
            this.currentLevel = 8;
        },

        canZoomIn: function () {
            /// <summary>Returns whether or not the timeline can zoom in.</summary>
            /// <returns type="Boolean"></returns>
            if (this.currentLevel > 0) return true;
            return false;
        },

        canZoomOut: function () {
            /// <summary>Returns whether or not the timeline can zoom out.</summary>
            /// <returns type="Boolean"></returns>
            if (this.zoomLevels.length - 1 > this.currentLevel) return true;
            return false;
        },

        zoomIn: function () {
            /// <summary>Zooms the timeline in.</summary>
            if (this.currentLevel > 0) this.currentLevel--;
        },

        zoomOut: function () {
            /// <summary>Zooms the timeline out.</summary>
            if (this.zoomLevels.length - 1 > this.currentLevel) this.currentLevel++;
        },

        zoomLevels: [
            {
                ratio: 1,
                interval: 1000,
                mark: 100,
                sub: 500
            },
            {
                ratio: 2,
                interval: 1000,
                mark: 250,
                sub: 500
            },
            {
                ratio: 4,
                interval: 1000,
                mark: 250,
                sub: 500
            },
            {
                ratio: 8,
                interval: 1000,
                mark: 500,
                sub: 500
            },
            {
                ratio: 16,
                interval: 5000,
                mark: 500,
                sub: 1000
            },
            {
                ratio: 32,
                interval: 5000,
                mark: 1000,
                sub: 1000
            },
            {
                ratio: 64,
                interval: 10000,
                mark: 2500,
                sub: 5000
            },
            {
                ratio: 128,
                interval: 30000,
                mark: 5000,
                sub: 15000
            },
            {
                ratio: 256,
                interval: 60000,
                mark: 15000,
                sub: 30000 //should be default
            },
            {
                ratio: 512,
                interval: 60000,
                mark: 15000,
                sub: 30000
            },
            {
                ratio: 1024,
                interval: 120000,
                mark: 30000,
                sub: 60000
            },
            {
                ratio: 2048,
                interval: 600000,
                mark: 60000,
                sub: 300000
            },
            {
                ratio: 4096,
                interval: 900000,
                mark: 300000,
                sub: 300000
            },
            {
                ratio: 8192,
                interval: 1800000,
                mark: 600000,
                sub: 600000
            },
            {
                ratio: 16384,
                interval: 3600000,
                mark: 900000,
                sub: 1800000
            },
            {
                ratio: 32768,
                interval: 7200000,
                mark: 1800000,
                sub: 3600000
            }
        ]
    });
})();