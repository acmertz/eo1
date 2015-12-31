(function () {
    WinJS.Namespace.define("Ensemble.Util.AspectGenerator", {
        /// <summary>Provides tools for generating aspect ratio-proportional widths and heights.</summary>

        generateHeight: function (aspect, width) {
            /// <summary>Given an aspect ratio and width, returns a proportional height.</summary>
            /// <param name="aspect" type="String">The aspect ratio. Must be in the following format: Number:Number</param>
            /// <param name="width" type="Number">The width to use in the calculation.</param>
            var splitAspect = aspect.split(":");
            return Math.floor(parseInt(splitAspect[1]) / parseInt(splitAspect[0]) * width);
        },

        generateWidth: function (aspect, height) {
            /// <summary>Given an aspect ratio and width, returns a proportional height.</summary>
            /// <param name="aspect" type="String">The aspect ratio. Must be in the following format: Number:Number</param>
            /// <param name="height" type="Number">The height to use in the calculation.</param>
            var splitAspect = aspect.split(":");
            return Math.ceil(parseInt(splitAspect[0]) / parseInt(splitAspect[1]) * height);
        },

        calcAspect: function (width, height) {
            /// <summary>Given a width and height, returns the aspect ratio.</summary>
            /// <param name="width" type="Number">The width.</param>
            /// <param name="height" type="Number">The height.</param>
            /// <returns type="String">The aspect ratio of the given dimensions; for example, "16:9"</returns>
            let g = Ensemble.Util.AspectGenerator.gcd(width, height);
            return width / g + ":" + height / g;
        },

        gcd: function (a, b) {
            /// <summary>Returns the greatest common denominator of the given numbers.</summary>
            /// <param name="a" type="Number"></param>
            /// <param name="b" type="Number"></param>
            /// <returns type="Number"></returns>
            return (b == 0) ? a : Ensemble.Util.AspectGenerator.gcd (b, a%b);
        }
    });
})();