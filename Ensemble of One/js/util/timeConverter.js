(function () {
    WinJS.Namespace.define("Ensemble.Utilities.TimeConverter", {
        /// <summary>Provides tools for generating aspect ratio-proportional widths and heights.</summary>

        convertTime: function (milliseconds, shortForm) {
            /// <summary>Returns a user-readable time string, converted from the given number of milliseconds.</summary>
            /// <param name="milliseconds" type="Number">A value in milliseconds, to be converted.</param>
            /// <param name="shortForm" type="Boolean">Optional. Omit any leading zeros.</param>
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
        },

        timelineTime: function (milliseconds) {
            //Break the time up into the individual parts, adding leading zeros.
            let ms = (Math.floor(milliseconds % 1000)).toString();
            let sec = (Math.floor((milliseconds / 1000) % 60)).toString();
            let min = (Math.floor(((milliseconds / 1000) / 60))).toString();
            let hour = (Math.floor(((milliseconds / 1000) / 60) / 60)).toString();

            let timeStr = "";
            if (hour > 0) timeStr = timeStr + hour + "h";
            if (min > 0) timeStr = timeStr + min + "m";
            if (sec > 0) timeStr = timeStr + sec + "s";
            if (ms > 0) timeStr = timeStr + ms + "ms";

            return timeStr;
        },

        verboseTime: function (milliseconds) {
            /// <summary>Returns a user-readable time string of the form "X minutes, X seconds."</summary>
            /// <param name="milliseconds" type="Number">A value in milliseconds, to be converted.</param>
            
            //Break the time up into the individual parts.
            var ms = Math.floor(milliseconds % 1000);
            var sec = Math.floor((milliseconds / 1000) % 60);
            var min = Math.floor(((milliseconds / 1000) / 60) % 60);
            var hour = Math.floor((((milliseconds / 1000) / 60) / 60) % 60);
            var day = Math.floor(((((milliseconds / 1000) / 60) / 60) / 60) % 24);

            var timeStr = "";

            var dayStr = "";
            if (day > 0) dayStr = day.toString() + " day";
            if (day > 1) dayStr = dayStr + "s";

            var hrStr = "";
            if (hour > 0) hrStr = hour.toString() + " hour";
            if (hour > 1) hrStr = hrStr + "s";

            var minStr = "";
            if (min > 0) minStr = min.toString() + " minute";
            if (min > 1) minStr = minStr + "s"

            var secStr = "";
            if (sec > 0) secStr = sec.toString() + " second";
            if (sec > 1) secStr = secStr + "s";

            var msStr = "";
            if (ms > 0) msStr = ms.toString() + " millisecond";
            if (ms > 1) msStr = msStr + "s";


            //Generate the return value
            if (1 > sec) {
                if (msStr.length > 0) return msStr;
                return "0 seconds";
            }

            var returnVal = dayStr + " " + hrStr + " " + minStr + " " + secStr;
            if (hour > 0 | min > 0 | sec > 0) {
                if (day > 1) returnVal = returnVal.replace("days", "days,");
                else returnVal = returnVal.replace("day", "day,");
            }
            if (min > 0 | sec > 0) {
                if (hour > 1) returnVal = returnVal.replace("hours", "hours,");
                else returnVal = returnVal.replace("hour", "hour,");
            }
            if (sec > 0) {
                if (min > 1) returnVal = returnVal.replace("minutes", "minutes,");
                else returnVal = returnVal.replace("minute", "minute,");
            }

            //Trim leading spaces
            returnVal = returnVal.trim();

            return returnVal;
        }
    });
})();