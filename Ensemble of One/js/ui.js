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

            this.UserInput.Boundaries.topBottomSplit = document.getElementById("editorHorizontalDivider");

            this.UserInput.ClickEaters.menu = document.getElementById("editorMenuClickEater");
            this.UserInput.ClickEaters.splitpoint = document.getElementById("topBottomSplitpointClickEater");

            this.UserInput.Buttons.timelineScrollUp = document.getElementById("editorTimelineScrollUpButton");
            this.UserInput.Buttons.timelineScrollDown = document.getElementById("editorTimelineScrollDownButton");
            this.UserInput.Buttons.timelineZoomIn = document.getElementById("editorTimelineZoomInButton");
            this.UserInput.Buttons.timelineZoomOut = document.getElementById("editorTimelineZoomOutButton");

            console.log("Relinked all Editor UI references.");
        },

        Popups: {
            /// <summary>Dialogs, flyouts, and popups used to display information and get user input.</summary>
        },

        ClickEaters: {
            /// <summary>Invisible surfaces used to light-dismiss popups and other dialogs.</summary>
            actionMenu: null
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
            menuButtons: null
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
                effectsMenu: null
            },
            Boundaries: {
                topBottomSplit: null
            },
            ClickEaters: {
                menu: null,
                splitpoint: null
            }
        }
    });
})();