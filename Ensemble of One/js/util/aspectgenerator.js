(function () {
    WinJS.Namespace.define("Ensemble.Utilities.AspectGenerator", {
        /// <summary>Provides tools for generating aspect ratio-proportional widths and heights.</summary>

        generateHeight: function (aspect, width) {
            /// <summary>Given an aspect ratio and width, returns a proportional height.</summary>
            /// <param name="aspect" type="String">The aspect ratio. Must be in the following format: Number:Number</param>
            /// <param name=width" type="Number">The width to use in the calculation.</param>
            var splitAspect = aspect.split(":");
            return Math.floor(parseInt(splitAspect[1]) / parseInt(splitAspect[0]) * width);
        },

        generateWidth: function (aspect, height) {
            /// <summary>Given an aspect ratio and width, returns a proportional height.</summary>
            /// <param name="aspect" type="String">The aspect ratio. Must be in the following format: Number:Number</param>
            /// <param name=height" type="Number">The height to use in the calculation.</param>
            var splitAspect = aspect.split(":");
            return Math.ceil(parseInt(splitAspect[0]) / parseInt(splitAspect[1]) * height);
        }
    });
})();