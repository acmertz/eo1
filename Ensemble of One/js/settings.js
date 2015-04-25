(function () {
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
        },

        getDefaultResolution: function (aspect) {
            /// <summary>Returns an object in the form of {width, height} containing the default project dimensions for a project with the given aspect ratio.</summary>
            /// <param name="aspect" type="String">The aspect ratio.</param>
            /// <returns type="Object">An object containing the width and height of the default project.</returns>
            switch (aspect) {
                case "16:9":
                    return {
                        width: 2560,
                        height: 1440
                    }
                    break;
                case "16:10":
                    return {
                        width: 2560,
                        height: 1600
                    }
                    break;
                case "2.39:1":
                    return {
                        width: 3824,
                        height: 1600
                    }
                    break;
                case "4:3":
                    return {
                        width: 2560,
                        height: 1920
                    }
                    break;
            }
        }
    });
})();