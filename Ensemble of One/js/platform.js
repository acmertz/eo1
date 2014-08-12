﻿(function () {
    WinJS.Namespace.define("Ensemble.Platform", {
        /// <summary>Exposes information about the platform on which the application is currently running.</summary>

        //Indicates the app's current platform. Currently only "win8" is supported.
        currentPlatform: null,

        setCurrentPlatform: function (platform) {
            /// <summary>Sets the platform to be used for the current app session.</summary>
            /// <param name="platform" type="String">The platform string. Must be one of win8, android, or ios.</param>
            var valid = false;
            switch (platform) {
                case "win8":
                    valid = true;
                    break;
                case "android":
                    valid = true;
                    break;
                case "ios":
                    valid = true;
                    break;
            }
            if (valid) {
                if (this.currentPlatform == null) this.currentPlatform = platform;
                else throw new Error("Current platform cannot be changed once the app is running.");
            }
            else {
                throw new Error("\"" + platform + "\" is not a valid platform string.");
            }
        }
    });
})();