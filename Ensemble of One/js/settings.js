﻿(function () {
    WinJS.Namespace.define("Ensemble.Settings", {
        /// <summary>Provides platform-agnostic interfaces for the storage and retrieval of application settings.</summary>

        refreshSettingsDialog: function () {
            /// <summary>Retrieves all known settings from storage and updates the settings dialog to match.</summary>

            var settingsToUpdate = [];

            switch (Ensemble.Platform.currentPlatform) {
                case "win8":
                    //settingsToUpdate.push({id: settingsIds[0], value: Windows.Storage.ApplicationData.current.roamingSettings.values["editorTimelineRowsVisible"]})
                    break;
                case "android":
                    break;
                case "ios":
                    break;
            }

            for (var i = 0; i < settingsToUpdate.length; i++) {
                document.getElementById(settingsToUpdate[i].id).value = settingsToUpdate[i].value;
            }
        },

        setEditorDividerPosition: function (yPercentage) {
            /// <summary>Stores the position of the Editor's UI divider in application settings.</summary>
            /// <param name="yPercentage" type="Number">A percentage value representing the divider's Y position on the screen.</param>

            switch (Ensemble.Platform.currentPlatform) {
                case "win8":
                    Windows.Storage.ApplicationData.current.roamingSettings.values["editorDividerPosition"] = yPercentage;
                    break;
                case "android":
                    break;
                case "ios":
                    break;
            }
        },

        getEditorDividerPosition: function () {
            /// <summary>Retrieves the position of the Editor's UI divider from application settings.</summary>
            /// <returns type="Number">A percentage value representing the divider's Y position on the screen.</returns>

            var returnVal = null;
            switch (Ensemble.Platform.currentPlatform) {
                case "win8":
                    returnVal = Windows.Storage.ApplicationData.current.roamingSettings.values["editorDividerPosition"];
                    break;
                case "android":
                    break;
                case "ios":
                    break;
            }

            if ((returnVal == null) || (returnVal == undefined)) returnVal = 0.5;
            return returnVal;
        }
    });
})();