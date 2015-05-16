(function () {
    WinJS.Namespace.define("Ensemble.Editor.UI", {
        /// <summary>Tracks and maintains all the UI elements found on the Editor page.</summary>
        relink: function () {
            /// <summary>Renews all UI references and makes sure they're alive.</summary>

            this.PageSections.upperHalf.entireSection = document.getElementsByClassName("editor-section--upper")[0];
            this.PageSections.upperHalf.canvasAndControls = document.getElementById("editorCanvasContainer");
            this.PageSections.upperHalf.canvasContainer = document.getElementsByClassName("editor-canvas-container")[0];

            this.PageSections.lowerHalf.timeline = document.getElementById("timeline-track-container");
            this.PageSections.lowerHalf.timelineHeaders = document.getElementsByClassName("timeline-track-header-container--standard")[0];
            this.PageSections.lowerHalf.timelineDetails = document.getElementsByClassName("timeline-track-widget-container--standard")[0];
            this.PageSections.lowerHalf.timelineTracks = document.getElementById("editorTimelineTracks");
            this.PageSections.lowerHalf.timelineHeaderDetailPlaceholder = document.getElementsByClassName("timeline-track-widget-container--placeholder")[0];
            this.PageSections.divider = document.getElementById("editorHorizontalDivider");

            this.PageSections.menu.actionMenu.project.nameDisplay = document.getElementById("editorProjectNameDisplay");
            this.PageSections.menu.actionMenu.project.durationDisplay = document.getElementById("editorMenuDurationDisplay");
            this.PageSections.menu.actionMenu.project.numberOfTracksDisplay = document.getElementById("editorMenuNumberOfTracksDisplay");
            this.PageSections.menu.actionMenu.project.numberOfClipsDisplay = document.getElementById("editorMenuNumberOfClipsDisplay");
            this.PageSections.menu.actionMenu.project.aspectRatioDisplay = document.getElementById("editorMenuAspectRatioDisplay");

            this.PageSections.menu.mediaMenu.entireSection = document.getElementById("editorMediaMenu");
            this.PageSections.menu.mediaMenu.local.mediaList = document.getElementById("editorMenuMediaBrowserFileList");
            this.PageSections.menu.mediaMenu.local.pathDisplay = document.getElementById("editorMediaBrowserCurrentPathContainer");
            this.PageSections.menu.mediaMenu.local.loadingIndicator = document.getElementById("editorMediaBrowserLoadingProgress");
            this.PageSections.menu.effectsMenu.entireSection = document.getElementById("editorEffectsMenu");

            this.TextFields.removeTrackConfirmationName = document.getElementById("remove-track-confirmation__name");

            this.Graphics.mediaBrowserPreviewVideo = document.getElementById("mediaBrowserPreviewVideo");
            this.Graphics.mediaBrowserPreviewMusic = document.getElementById("mediaBrowserPreviewAudio");
            this.Graphics.mediaBrowserPreviewPic = document.getElementById("mediaBrowserPreviewPicture");

            this.RenderSurfaces.mainCanvas = document.getElementsByClassName("editor-canvas")[0];

            this.UserInput.Buttons.mediaBrowserLocation = document.getElementById("editorMediaBrowserLocationButton");
            this.UserInput.Buttons.mediaBrowserHome = document.getElementById("editorMediaBrowserHomeButton");
            this.UserInput.Buttons.mediaBrowserUpOneLevel = document.getElementById("editorMediaBrowserUpOneLevelButton");
            this.UserInput.Buttons.mediaBrowserRefresh = document.getElementById("editorMediaBrowserRefreshButton");
            this.UserInput.Buttons.mediaBrowserLocationVideos = document.getElementById("editorMediaBrowserLocationVideosLibrary");
            this.UserInput.Buttons.mediaBrowserLocationMusic = document.getElementById("editorMediaBrowserLocationMusicLibrary");
            this.UserInput.Buttons.mediaBrowserLocationPictures = document.getElementById("editorMediaBrowserLocationPicturesLibrary");
            this.UserInput.Buttons.moveTrackToTop = document.getElementById("editorMoveTrackTop");
            this.UserInput.Buttons.moveTrackUp = document.getElementById("editorMoveTrackUp");
            this.UserInput.Buttons.moveTrackDown = document.getElementById("editorMoveTrackDown");
            this.UserInput.Buttons.moveTrackToBottom = document.getElementById("editorMoveTrackBottom");
            this.UserInput.Buttons.confirmRemoveTrack = document.getElementById("remove-track-confirmation__button");

            this.UserInput.Boundaries.topBottomSplit = document.getElementById("editorHorizontalDivider");

            this.UserInput.ClickEaters.mediaPreview = document.getElementById("editorMediaBrowserPreviewClickEater");

            this.UserInput.Flyouts.mediaBrowserLocation = document.getElementById("editorMediaBrowserLocationFlyout");
            this.UserInput.Flyouts.moveTrack = document.getElementById("editorMoveTrackFlyout");
            this.UserInput.Flyouts.trackVolume = document.getElementById("editorTrackVolumeFlyout");
            this.UserInput.Flyouts.trackRemove = document.getElementById("editorTrackDeleteFlyout");
            this.UserInput.Flyouts.mediaBrowserAddToProject = document.getElementById("mediaBrowserAddToProjectFlyout");

            console.log("Relinked all Editor UI references.");
        },

        PageSections: {
            /// <summary>Dialogs, flyouts, and popups used to display information and get user input.</summary>
            upperHalf: {
                //The entire upper half of the page.
                entireSection: null,
                canvasAndControls: null,
                canvasContainer: null
            },
            lowerHalf: {
                //The entire lower half of the page.
                timeline: null,
                timelineHeaders: null,
                timelineDetails: null,
                timelineTracks: null,
                timelineHeaderDetailPlaceholder: null
            },
            //Horizontal divider bar that separates the top half of the page from the lower half.
            divider: null,
            //Free-floating menu buttons that toggle the visibility of the Editor menu.
            menuButtons: null,
            //Transient, light-dismiss menu dialog that appears in the top left corner of the screen.
            menu: {
                entireSection: null,
                actionMenu: {
                    entireSection: null,
                    project: {
                        entireSection: null,
                        nameDisplay: null,
                        durationDisplay: null,
                        numberOfTracksDisplay: null,
                        numberOfClipsDisplay: null,
                        aspectRatioDisplay: null
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

        Graphics: {
            mediaBrowserPreviewVideo: null,
            mediaBrowserPreviewMusic: null,
            mediaBrowserPreviewPic: null
        },

        RenderSurfaces: {
            mainCanvas: null
        },

        UserInput: {
            Buttons: {
                mediaBrowserLocation: null,
                mediaBrowserHome: null,
                mediaBrowserUpOneLevel: null,
                mediaBrowserRefresh: null,
                mediaBrowserLocationVideos: null,
                mediaBrowserLocationMusic: null,
                mediaBrowserLocationPictures: null,
                moveTrackToTop: null,
                moveTrackUp: null,
                moveTrackDown: null,
                moveTrackToBottom: null,
                confirmRemoveTrack: null
            },
            Boundaries: {
                topBottomSplit: null
            },
            ClickEaters: {
                mediaPreview: null
            },
            Flyouts: {
                mediaBrowserLocation: null,
                moveTrack: null,
                trackVolume: null,
                trackRemove: null,
                mediaBrowserAddToProject: null
            }
        }
    });
})();