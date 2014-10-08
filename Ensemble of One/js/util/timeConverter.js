(function () {
    WinJS.Namespace.define("Ensemble.Utilities.TimeConverter", {
        /// <summary>Provides tools for generating aspect ratio-proportional widths and heights.</summary>

        convertTime: function (milliseconds, shortForm) {
            /// <summary>Returns a user-readable time string, converted from the given number of milliseconds.</summary>
            /// <param name="milliseconds" type="Number">A value in milliseconds, to be converted.</param>
            /// <param name=shortForm" type="Boolean">Optional. Omit any leading zeros.</param>
            /// <returns type="String">A string representing the time.</returns>

            //Break the time up into the individual parts, adding leading zeros.
            var ms = "00" + (Math.floor(milliseconds % 1000)).toString();
            var sec = "0" + (Math.floor((milliseconds / 1000) % 60)).toString();
            var min = "0" + (Math.floor(((milliseconds / 1000) / 60))).toString();
            var hour = "0" + (Math.floor(((milliseconds / 1000) / 60) / 60)).toString();
            //Remove leading zeros as necessary.
            ms = ms.substr(ms.length - 3);
            sec = sec.substr(sec.length - 2);
            min = min.substr(min.length - 2);
            hour = hour.substr(hour.length - 2);
            //Return the resulting string.
            var returnStr = min + ":" + sec + "." + ms;
            if (shortForm == undefined || (hour != "00" && !shortForm)) returnStr = hour + ":" + returnStr;
            return returnStr;
        }
    });
})();