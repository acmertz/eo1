(function () {
    WinJS.Namespace.define("Ensemble.Editor.ToolbarMGR", {
        /// <summary>Manages the functionality of the Editor menu and all its commands.</summary>

        menuOpen: false,
        currentMenu: null,
        currentState: "none",

        init: function () {
            this._refreshUI();
            this._reevaluateState();
        },

        unload: function () {
            this._cleanUI();
        },

        _reevaluateState: function () {
            // All commands are disabled unless explicitly enabled.
            $(".editor-toolbar-command").attr("disabled", true);
            $(".app-trigger--editor").attr("disabled", true);

            document.getElementsByClassName("app-trigger--close-project")[0].removeAttribute("disabled");
            document.getElementsByClassName("app-trigger--force-save")[0].removeAttribute("disabled");
            document.getElementsByClassName("app-trigger--save-as")[0].removeAttribute("disabled");
            if (Ensemble.HistoryMGR.canUndo()) document.getElementsByClassName("app-trigger--undo")[0].removeAttribute("disabled");
            if (Ensemble.HistoryMGR.canRedo()) document.getElementsByClassName("app-trigger--redo")[0].removeAttribute("disabled");

            document.getElementsByClassName("editor-toolbar-command--browse-media")[0].removeAttribute("disabled");
            document.getElementsByClassName("editor-toolbar-command--record-video")[0].removeAttribute("disabled");
            document.getElementsByClassName("editor-toolbar-command--record-audio")[0].removeAttribute("disabled");

            if (Ensemble.Editor.SelectionMGR.selected.length == 1) {
                document.getElementsByClassName("editor-toolbar-command--clear-selection")[0].removeAttribute("disabled");
                document.getElementsByClassName("editor-toolbar-command--split-clip")[0].removeAttribute("disabled");
            }
        },

        ui: {
            hamburgerFlyout: null,
            hamburgerButton: null
        },

        _refreshUI: function () {
            this.ui.hamburgerFlyout = document.getElementsByClassName("flyout--editor-hamburger-button")[0];
            this.ui.hamburgerButton = document.getElementsByClassName("editor-hamburger-button")[0];

            this.ui.hamburgerButton.addEventListener("click", Ensemble.Editor.ToolbarMGR._listeners.hamburgerButtonClicked);
            document.getElementsByClassName("app-trigger--force-save")[0].addEventListener("click", Ensemble.Editor.ToolbarMGR._listeners.forceSaveClicked);
            document.getElementsByClassName("app-trigger--save-as")[0].addEventListener("click", Ensemble.Editor.ToolbarMGR._listeners.saveAsClicked);
            document.getElementsByClassName("app-trigger--close-project")[0].addEventListener("click", Ensemble.Editor.ToolbarMGR._listeners.closeProjectClicked);

            let toolbarCommands = document.getElementsByClassName("editor-toolbar-command");
            for (let i = 0; i < toolbarCommands.length; i++) {
                toolbarCommands[i].addEventListener("click", Ensemble.Editor.ToolbarMGR._listeners.toolbarCommandClick);
            }

            let menuCommands = document.getElementsByClassName("app-trigger--editor");
            for (let i = 0; i < menuCommands.length; i++) {
                menuCommands[i].addEventListener("click", Ensemble.Editor.ToolbarMGR._listeners.toolbarCommandClick);
            }
        },

        _cleanUI: function () {
            this.ui.hamburgerButton.removeEventListener("click", Ensemble.Editor.ToolbarMGR._listeners.hamburgerButtonClicked);
            document.getElementsByClassName("app-trigger--force-save")[0].removeEventListener("click", Ensemble.Editor.ToolbarMGR._listeners.forceSaveClicked);
            document.getElementsByClassName("app-trigger--save-as")[0].removeEventListener("click", Ensemble.Editor.ToolbarMGR._listeners.saveAsClicked);
            document.getElementsByClassName("app-trigger--close-project")[0].removeEventListener("click", Ensemble.Editor.ToolbarMGR._listeners.closeProjectClicked);

            this.ui.hamburgerFlyout = null;
            this.ui.hamburgerButton = null;

            let toolbarCommands = document.getElementsByClassName("editor-toolbar-command");
            for (let i = 0; i < toolbarCommands.length; i++) {
                toolbarCommands[i].removeEventListener("click", Ensemble.Editor.ToolbarMGR._listeners.toolbarCommandClick);
            }

            let menuCommands = document.getElementsByClassName("app-trigger--editor");
            for (let i = 0; i < menuCommands.length; i++) {
                menuCommands[i].removeEventListener("click", Ensemble.Editor.ToolbarMGR._listeners.toolbarCommandClick);
            }
        },

        _listeners: {
            hamburgerButtonClicked: function (event) {
                Ensemble.Editor.ToolbarMGR.ui.hamburgerFlyout.winControl.show(event.currentTarget);
            },

            forceSaveClicked: function (event) {
                Ensemble.FileIO.saveProject();
            },

            saveAsClicked: function (event) {
                Ensemble.FileIO.requestSaveAs();
            },

            closeProjectClicked: function (event) {
                Ensemble.Pages.Editor.unload();
            },

            toolbarCommandClick: function (event) {
                let command = event.currentTarget.dataset.editorCommand;

                if (command == "browse-media") {
                    Ensemble.FileIO.showMediaFilePicker(Ensemble.Editor.ToolbarMGR._listeners.browseMediaReturned, {
                        currentTarget: event.currentTarget
                    });
                }

                else if (command == "add-item") {
                    let action = new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.createTrack);
                    Ensemble.HistoryMGR.performAction(action);
                }

                // HOME
                else if (command == "undo") Ensemble.HistoryMGR.undoLast();
                else if (command == "redo") Ensemble.HistoryMGR.redoNext();

                // CLIP
                else if (command == "split-clip") {
                    let splitAction = new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.splitClip, {
                        clipIds: Ensemble.Editor.SelectionMGR.selected,
                        newIds: [],
                        time: Ensemble.Editor.PlaybackMGR.lastTime
                    });
                    Ensemble.Editor.SelectionMGR.clearSelection();
                    Ensemble.Editor.SelectionMGR.clearHovering();
                    Ensemble.HistoryMGR.performAction(splitAction);
                }
                else if (command == "clear-selection") setTimeout(function () {
                    Ensemble.Editor.SelectionMGR.clearSelection();
                }, 0);

                    // MEDIA CAPTURE
                else if (command == "record-video") {
                    Ensemble.Editor.PanelMGR.requestPanel(Ensemble.Editor.PanelMGR.PanelTypes.cameraCapture);
                }
                else if (command == "record-audio") {
                    Ensemble.Editor.PanelMGR.requestPanel(Ensemble.Editor.PanelMGR.PanelTypes.micCapture);
                }
            },

            browseMediaReturned: function (file, payload) {
                Ensemble.Editor.MediaBrowser._currentPreview = file;
                Ensemble.Editor.MediaBrowser._addPreviewToProject(payload);
            }
        },
    });
})();