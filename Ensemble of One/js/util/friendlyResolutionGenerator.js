(function () {
    WinJS.Namespace.define("Ensemble.Utilities.FriendlyResolutionGenerator", {
        /// <summary>Provides tools for generating aspect ratio-proportional widths and heights.</summary>

        turnFriendly: function (width, height) {
            /// <summary>Given a width and height, returns a user-friendly string (if one exists) to represent the dimensions.</summary>
            /// <param name="width" type="Number">The height of the video.</param>
            /// <param name=height" type="Number">The width of the video.</param>
            /// <returns type="String">A string representing the resolution.</returns>
            if (width == 7680 && height == 4320) return "4320p";
            if (width == 3840 && height == 2160) return "2160p";
            if (width == 1920 && height == 1080) return "1080p";
            if (width == 1280 && height == 720) return "720p";
            if ((width == 852 || width == 720 || width == 704 || width == 640) && height == 480) return "480p";
            if (width == 640 && height == 360) return "360p";
            return (width.toString() + " x " + height.toString());
        }
    });
})();