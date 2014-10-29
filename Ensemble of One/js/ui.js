(function () {
    WinJS.Namespace.define("Ensemble.Pages.Editor.UI", {
        /// <summary>Tracks and maintains all the UI elements found on the Editor page.</summary>
        relink: function () {
            /// <summary>Renews all UI references and makes sure they're alive.</summary>

            this.PageSections.upperHalf.entireSection = document.getElementById("editorUpperHalf");
            this.PageSections.upperHalf.canvasAndControls = document.getElementById("editorCanvasContainer");
            this.PageSections.upperHalf.canvasContainer = document.getElementById("editorCanvasContent");
            this.PageSections.upperHalf.controlContainer = document.getElementById("editorPlayControls");
            this.PageSections.upperHalf.customButtonsLeft = document.getElementById("editorCustomButtonsLeft");
            this.PageSections.upperHalf.customButtonsRight = document.getElementById("editorCustomButtonsRight");

            this.PageSections.lowerHalf.entireSection = document.getElementById("editorLowerHalf");
            this.PageSections.divider = document.getElementById("editorHorizontalDivider");
            this.PageSections.menuButtons = document.getElementById("editorMenuButtons");
            this.PageSections.menu.entireSection = document.getElementById("editorMenuDialog");
            this.PageSections.menu.actionMenu.entireSection = document.getElementById("editorActionMenu");
            this.PageSections.menu.mediaMenu.entireSection = document.getElementById("editorMediaMenu");
            this.PageSections.menu.mediaMenu.local.mediaList = document.getElementById("editorMenuMediaBrowserFileList");
            this.PageSections.menu.mediaMenu.local.pathDisplay = document.getElementById("editorMediaBrowserCurrentPathContainer");
            this.PageSections.menu.mediaMenu.local.loadingIndicator = document.getElementById("editorMediaBrowserLoadingProgress");
            this.PageSections.menu.effectsMenu.entireSection = document.getElementById("editorEffectsMenu");

            this.RenderSurfaces.mainCanvas = document.getElementById("editorCanvas");

            this.UserInput.Buttons.customButton1 = document.getElementById("editorCustomButton1");
            this.UserInput.Buttons.customButton2 = document.getElementById("editorCustomButton2");
            this.UserInput.Buttons.customButton3 = document.getElementById("editorCustomButton3");
            this.UserInput.Buttons.customButton4 = document.getElementById("editorCustomButton4");
            this.UserInput.Buttons.customButton5 = document.getElementById("editorCustomButton5");
            this.UserInput.Buttons.customButton6 = document.getElementById("editorCustomButton6");
            this.UserInput.Buttons.playPause = document.getElementById("editorPlaypauseButton");
            this.UserInput.Buttons.skipBack = document.getElementById("editorSkipBackButton");
            this.UserInput.Buttons.skipForward = document.getElementById("editorSkipForwardButton");
            this.UserInput.Buttons.fullscreen = document.getElementById("editorFullscreenButton");
            this.UserInput.Buttons.actionMenu = document.getElementById("editorMenuButton");
            this.UserInput.Buttons.mediaMenu = document.getElementById("editorMediaButton");
            this.UserInput.Buttons.effectsMenu = document.getElementById("editorEffectsButton");
            this.UserInput.Buttons.mediaBrowserLocation = document.getElementById("editorMediaBrowserLocationButton");
            this.UserInput.Buttons.mediaMenuTabLocal = document.getElementById("editorMenuTabMediaLocal");
            this.UserInput.Buttons.mediaMenuTabCamera = document.getElementById("editorMenuTabMediaCamera");
            this.UserInput.Buttons.mediaMenuTabMic = document.getElementById("editorMenuTabMediaMic");
            this.UserInput.Buttons.mediaBrowserHome = document.getElementById("editorMediaBrowserHomeButton");
            this.UserInput.Buttons.mediaBrowserUpOneLevel = document.getElementById("editorMediaBrowserUpOneLevelButton");
            this.UserInput.Buttons.mediaBrowserRefresh = document.getElementById("editorMediaBrowserRefreshButton");
            this.UserInput.Buttons.mediaBrowserLocationVideos = document.getElementById("editorMediaBrowserLocationVideosLibrary");
            this.UserInput.Buttons.mediaBrowserLocationMusic = document.getElementById("editorMediaBrowserLocationMusicLibrary");
            this.UserInput.Buttons.mediaBrowserLocationPictures = document.getElementById("editorMediaBrowserLocationPicturesLibrary");

            this.UserInput.Boundaries.topBottomSplit = document.getElementById("editorHorizontalDivider");

            this.UserInput.ClickEaters.menu = document.getElementById("editorMenuClickEater");
            this.UserInput.ClickEaters.splitpoint = document.getElementById("topBottomSplitpointClickEater");

            this.UserInput.Flyouts.mediaBrowserLocation = document.getElementById("editorMediaBrowserLocationFlyout");

            this.UserInput.Buttons.timelineScrollUp = document.getElementById("editorTimelineScrollUpButton");
            this.UserInput.Buttons.timelineScrollDown = document.getElementById("editorTimelineScrollDownButton");
            this.UserInput.Buttons.timelineZoomIn = document.getElementById("editorTimelineZoomInButton");
            this.UserInput.Buttons.timelineZoomOut = document.getElementById("editorTimelineZoomOutButton");

            console.log("Relinked all Editor UI references.");
        },

        Popups: {
            /// <summary>Dialogs, flyouts, and popups used to display information and get user input.</summary>
        },

        PageSections: {
            /// <summary>Dialogs, flyouts, and popups used to display information and get user input.</summary>
            upperHalf: {
                //The entire upper half of the page.
                entireSection: null,
                canvasAndControls: null,
                canvasContainer: null,
                controlContainer: null,
                customButtonsLeft: null,
                customButtonsRight: null,
            },
            lowerHalf: {
                //The entire lower half of the page.
                entireSection: null
            },
            //Horizontal divider bar that separates the top half of the page from the lower half.
            divider: null,
            //Free-floating menu buttons that toggle the visibility of the Editor menu.
            menuButtons: null,
            //Transient, light-dismiss menu dialog that appears in the top left corner of the screen.
            menu: {
                entireSection: null,
                actionMenu: {
                    entireSection: null
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

        },

        Graphics: {

        },

        RenderSurfaces: {
            mainCanvas: null
        },

        UserInput: {
            Buttons: {
                customButton1: null,
                customButton2: null,
                customButton3: null,
                customButton4: null,
                customButton5: null,
                customButton6: null,
                playPause: null,
                skipBack: null,
                skipForward: null,
                fullscreen: null,
                timelineScrollUp: null,
                timelineScrollDown: null,
                timelineZoomIn: null,
                timelineZoomOut: null,
                actionMenu: null,
                mediaMenu: null,
                effectsMenu: null,
                mediaBrowserLocation: null,
                mediaMenuTabLocal: null,
                mediaMenuTabCamera: null,
                mediaMenuTabMic: null,
                mediaBrowserHome: null,
                mediaBrowserUpOneLevel: null,
                mediaBrowserRefresh: null,
                mediaBrowserLocationVideos: null,
                mediaBrowserLocationMusic: null,
                mediaBrowserLocationPictures: null
            },
            Boundaries: {
                topBottomSplit: null
            },
            ClickEaters: {
                menu: null,
                splitpoint: null
            },
            Flyouts: {
                mediaBrowserLocation: null
            }
        }
    });
})();