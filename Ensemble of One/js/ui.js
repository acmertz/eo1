(function () {
    WinJS.Namespace.define("Ensemble.Editor.UI", {
        /// <summary>Tracks and maintains all the UI elements found on the Editor page.</summary>
        relink: function () {
            /// <summary>Renews all UI references and makes sure they're alive.</summary>

            this.PageSections.upperHalf.canvasContainer = document.getElementsByClassName("editor-canvas-container")[0];

            this.PageSections.lowerHalf.timeline = document.getElementById("timeline-track-container");
            this.PageSections.lowerHalf.timelineHeaders = document.getElementsByClassName("timeline-track-header-container--standard")[0];
            this.PageSections.lowerHalf.timelineDetails = document.getElementsByClassName("timeline-track-widget-container--standard")[0];
            this.PageSections.lowerHalf.timelineTracks = document.getElementById("editorTimelineTracks");

            this.PageSections.menu.mediaMenu.entireSection = document.getElementById("editorMediaMenu");
            this.PageSections.menu.mediaMenu.local.mediaList = document.getElementById("editorMenuMediaBrowserFileList");
            this.PageSections.menu.mediaMenu.local.pathDisplay = document.getElementById("editorMediaBrowserCurrentPathContainer");
            this.PageSections.menu.mediaMenu.local.loadingIndicator = document.getElementById("editorMediaBrowserLoadingProgress");
            this.PageSections.menu.effectsMenu.entireSection = document.getElementById("editorEffectsMenu");

            this.TextFields.removeTrackConfirmationName = document.getElementById("remove-track-confirmation__name");

            this.UserInput.Buttons.mediaBrowserLocation = document.getElementById("editorMediaBrowserLocationButton");
            this.UserInput.Buttons.mediaBrowserHome = document.getElementById("editorMediaBrowserHomeButton");
            this.UserInput.Buttons.mediaBrowserUpOneLevel = document.getElementById("editorMediaBrowserUpOneLevelButton");
            this.UserInput.Buttons.mediaBrowserRefresh = document.getElementById("editorMediaBrowserRefreshButton");
            this.UserInput.Buttons.moveTrackToTop = document.getElementById("editorMoveTrackTop");
            this.UserInput.Buttons.moveTrackUp = document.getElementById("editorMoveTrackUp");
            this.UserInput.Buttons.moveTrackDown = document.getElementById("editorMoveTrackDown");
            this.UserInput.Buttons.moveTrackToBottom = document.getElementById("editorMoveTrackBottom");
            this.UserInput.Buttons.confirmRemoveTrack = document.getElementById("remove-track-confirmation__button");

            this.UserInput.Flyouts.mediaBrowserLocation = document.getElementById("flyout--editor-media-browser-location");
            this.UserInput.Flyouts.moveTrack = document.getElementById("flyout--editor-move-track");
            this.UserInput.Flyouts.trackRemove = document.getElementById("flyout--editor-track-delete");
            this.UserInput.Flyouts.mediaBrowserAddToProject = document.getElementById("flyout--editor-media-browser-add-to-project");

            console.log("Relinked all Editor UI references.");
        },

        PageSections: {
            /// <summary>Dialogs, flyouts, and popups used to display information and get user input.</summary>
            upperHalf: {
                //The entire upper half of the page.
                canvasContainer: null
            },
            lowerHalf: {
                //The entire lower half of the page.
                timeline: null,
                timelineHeaders: null,
                timelineDetails: null,
                timelineTracks: null
            },
            //Transient, light-dismiss menu dialog that appears in the top left corner of the screen.
            menu: {
                actionMenu: {
                    entireSection: null,
                    project: {
                        entireSection: null
                    }
                },
                mediaMenu: {
                    entireSection: null,
                    local: {
                        pathDisplay: null,
                        mediaList: null,
                        loadingIndicator: null
                    }
                },
                effectsMenu: {
                    entireSection: null
                }
            }
        },

        TextFields: {
            removeTrackConfirmationName: null
        },

        UserInput: {
            Buttons: {
                mediaBrowserLocation: null,
                mediaBrowserHome: null,
                mediaBrowserUpOneLevel: null,
                mediaBrowserRefresh: null,
                moveTrackToTop: null,
                moveTrackUp: null,
                moveTrackDown: null,
                moveTrackToBottom: null,
                confirmRemoveTrack: null
            },
            Flyouts: {
                mediaBrowserLocation: null,
                moveTrack: null,
                trackRemove: null,
                mediaBrowserAddToProject: null
            }
        }
    });
})();