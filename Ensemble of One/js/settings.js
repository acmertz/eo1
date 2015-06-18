﻿(function () {
    WinJS.Namespace.define("Ensemble.Settings", {
        /// <summary>Provides platform-agnostic interfaces for the storage and retrieval of application settings.</summary>
        defaults: [
            { name: "sticky-edges-clip", value: true },
            { name: "sticky-edges-canvas", value: true }
        ],

        init: function () {
            let allSettings = document.getElementsByClassName("app-setting");
            for (let i = 0; i < allSettings.length; i++) {
                let listenerType = "";
                switch (allSettings[i].dataset.settingType) {
                    case "toggle":
                        listenerType = "change";
                        break;
                    case "instant":
                        listenerType = "click";
                        break;
                }
                allSettings[i].addEventListener(listenerType, Ensemble.Settings._listeners.userChangedSetting);
            }

            let allTriggers = document.getElementsByClassName("app-trigger--settings");
            for (let i = 0; i < allTriggers.length; i++) {
                allTriggers[i].addEventListener("click", Ensemble.Settings._listeners.settingsTriggerClicked);
            }

            Ensemble.Settings.setDefaults(false);
        },

        setDefaults: function (force) {
            /// <summary>Sets all uninitialized settings to their defaults.</summary>
            /// <param name="force" type="Boolean">Optional. Forces a total reset of all settings. All user customization will be lost.</param>
            for (let i = 0; i < Ensemble.Settings.defaults.length; i++) {
                if (Windows.Storage.ApplicationData.current.roamingSettings.values[Ensemble.Settings.defaults[i].name] == undefined || force) {
                    Windows.Storage.ApplicationData.current.roamingSettings.values[Ensemble.Settings.defaults[i].name] = Ensemble.Settings.defaults[i].value;
                }
            }
        },

        retrieveSetting: function (name) {
            /// <summary>Retrieves the value of the named app setting.</summary>
            /// <param name="name" type="String">The name of the setting to lookup.</param>
            /// <returns>The value of the setting.</returns>
            return Windows.Storage.ApplicationData.current.roamingSettings.values[name];

        },

        refreshSettingsDialog: function () {
            /// <summary>Retrieves all known settings from storage and updates the settings dialog to match.</summary>

            let allSettings = document.getElementsByClassName("app-setting");

            for (let i = 0; i < allSettings.length; i++) {
                let retrievedValue = Windows.Storage.ApplicationData.current.roamingSettings.values[allSettings[i].dataset.appSetting];
                switch (allSettings[i].dataset.settingType) {
                    case "toggle":
                        allSettings[i].winControl.checked = retrievedValue;
                        break;
                }
            }
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
        },

        closeSettingsPane: function () {
            let settingsPane = document.getElementsByClassName("app-page--app-settings")[0];
            $(settingsPane).addClass("app-page--exit-down");
            settingsPane.addEventListener("animationend", Ensemble.Settings._listeners.settingsPaneExitFinished);
        },

        _listeners: {
            userChangedSetting: function (event) {
                let valueToSave = null;
                switch (event.currentTarget.dataset.settingType) {
                    case "toggle":
                        valueToSave = event.currentTarget.winControl.checked;
                        break;
                    case "instant":
                        break;
                }

                if (valueToSave != null) Windows.Storage.ApplicationData.current.roamingSettings.values[event.currentTarget.dataset.appSetting] = valueToSave;
                else {
                    let dialogTitle = "";
                    let dialogMsg = "";
                    let dialogCommands = [];
                    let dialogDefault = 0;
                    let dialogCancel = 1;
                    switch (event.currentTarget.dataset.appSetting) {
                        case "reset-settings":
                            dialogTitle = "Reset all settings?";
                            dialogMsg = "This will reset all settings to their factory defaults and apply a fresh layer of new-app scent to everything. No takebacks — are you sure you want to reset your settings?";
                            dialogCommands = [
                                {
                                    label: "Reset settings",
                                    handler: Ensemble.Settings._listeners.userResetSettings
                                },
                                {
                                    label: "Cancel",
                                    handler: null
                                }
                            ];
                            break;
                        case "delete-all-projects":
                            dialogTitle = "Delete all projects?";
                            dialogMsg = "This will delete all projects saved within Ensemble of One. This only affects projects saved within the app — if you copied your project to another location (a flash drive or SD card, for instance) or chose \"Save as\" from the Editor, we won't touch it. This can't be undone, so don't continue unless you're absolutely sure.";
                            dialogCommands = [
                                {
                                    label: "Delete all projects",
                                    handler: Ensemble.Settings._listeners.userDeleteAllProjects
                                },
                                {
                                    label: "Cancel",
                                    handler: null
                                }
                            ]
                            break;
                    }
                    Ensemble.OSDialogMGR.showDialog(dialogTitle, dialogMsg, dialogCommands, dialogDefault, dialogCancel);
                }
            },

            userResetSettings: function () {
                Ensemble.Settings.setDefaults(true);
                Ensemble.Settings.refreshSettingsDialog();
                console.info("User reset all application settings.");
            },

            userDeleteAllProjects: function () {
                Ensemble.FileIO.deleteAllProjects();
                console.info("User deleted all projects.");
            },

            settingsTriggerClicked: function (event) {
                let settingsPane = document.getElementsByClassName("app-page--app-settings")[0];
                $(settingsPane).removeClass("app-page--hidden");
                $(settingsPane).addClass("app-page--enter-up");
                event.currentTarget.blur();
                settingsPane.addEventListener("animationend", Ensemble.Settings._listeners.settingsPaneEntranceFinished);
                Ensemble.Navigation.pushBackState(Ensemble.Settings.closeSettingsPane);
            },

            settingsPaneEntranceFinished: function (event) {
                let settingsPane = document.getElementsByClassName("app-page--app-settings")[0];
                settingsPane.removeEventListener("animationend", Ensemble.Settings._listeners.settingsPaneEntranceFinished);
                $(settingsPane).removeClass("app-page--enter-up");
            },

            settingsPaneExitFinished: function (event) {
                let settingsPane = document.getElementsByClassName("app-page--app-settings")[0];
                settingsPane.removeEventListener("animationend", Ensemble.Settings._listeners.settingsPaneExitFinished);
                $(settingsPane).removeClass("app-page--exit-down").addClass("app-page--hidden");
            }
        }
    });
})();