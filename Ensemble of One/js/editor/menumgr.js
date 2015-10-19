(function () {
    WinJS.Namespace.define("Ensemble.Editor.MenuMGR", {
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
            this.menuOpen = false;
            this.currentMenu = null;
            this.currentState = "none";

            let editorMenu = document.getElementsByClassName("app-page--editor-menu")[0];
            if (!$(editorMenu).hasClass("app-page--hidden")) {
                $(editorMenu).addClass("app-page--exit");
                editorMenu.addEventListener("animationend", Ensemble.Editor.MenuMGR._listeners.exitAnimationFinished);
            }
        },

        hideMenus: function () {
            /// <summary>Hides any active menus, but keeps the menu in the "Open" state. Useful for swapping menues.</summary>
            if (this.currentMenu) this.currentMenu.removeEventListener("transitionend", Ensemble.Editor.MenuMGR._listeners.importMenuEntered);
            $(".editor-menu").removeClass("editor-menu--visible");
            this.currentMenu = null;
        },

        closeMenu: function () {
            /// <summary>Closes the menu.</summary>
            $(Ensemble.Editor.MenuMGR.ui.clickEater).removeClass("ensemble-clickeater--active");
            Ensemble.Editor.MenuMGR.hideMenus();
            Ensemble.Editor.MenuMGR.menuOpen = false;
        },

        closeFileMenu: function () {
            $(Ensemble.Editor.MenuMGR.ui.clickEater).removeClass("ensemble-clickeater--active");
            $(".app-page--editor-menu").addClass("app-page--exit-left");
            document.getElementsByClassName("app-page--editor-menu")[0].addEventListener("animationend", Ensemble.Editor.MenuMGR._listeners.fileMenuExited);
        },

        closeMediaMenu: function () {
            $(Ensemble.Editor.MenuMGR.ui.clickEater).removeClass("ensemble-clickeater--active");

            let mediaBrowser = document.getElementsByClassName("app-page--media-browser")[0];
            $(mediaBrowser).addClass("app-page--exit-left");
            mediaBrowser.addEventListener("animationend", Ensemble.Editor.MenuMGR._listeners.importMenuExited);
        },

        isFileMenuOpen: function () {
            return !($(".app-page--editor-menu").hasClass("app-page--hidden"));
        },

        _reevaluateState: function () {
            // All commands are disabled unless explicitly enabled.
            $(".editor-toolbar-command").attr("disabled", true);
            $(".app-trigger--editor").attr("disabled", true);

            $(".app-trigger--close-project").removeAttr("disabled");
            $(".app-trigger--force-save").removeAttr("disabled");
            $(".app-trigger--save-as").removeAttr("disabled");
            if (Ensemble.HistoryMGR.canUndo()) $(".app-trigger--undo").removeAttr("disabled");
            if (Ensemble.HistoryMGR.canRedo()) $(".app-trigger--redo").removeAttr("disabled");

            $(".editor-toolbar-command--add-button").removeAttr("disabled");
            $(".editor-toolbar-command--browse-media").removeAttr("disabled");
            $(".editor-toolbar-command--create-filter").removeAttr("disabled");
            $(".editor-toolbar-command--record-video").removeAttr("disabled");
            $(".editor-toolbar-command--record-audio").removeAttr("disabled");

            if (Ensemble.Editor.SelectionMGR.selected.length == 1) {
                $(".editor-toolbar-command--clear-selection").removeAttr("disabled");
                $(".editor-toolbar-command--split-clip").removeAttr("disabled");
            }
        },

        ui: {
            clickEater: null,
            createLensFlyout: null,
            hamburgerFlyout: null,
            hamburgerButton: null
        },

        _refreshUI: function () {
            this.ui.clickEater = document.getElementsByClassName("ensemble-clickeater--editor-menu")[0];
            this.ui.createLensFlyout = document.getElementsByClassName("contextmenu--editor-create-lens")[0];
            this.ui.hamburgerFlyout = document.getElementsByClassName("flyout--editor-hamburger-button")[0];
            this.ui.hamburgerButton = document.getElementsByClassName("editor-hamburger-button")[0];

            this.ui.hamburgerButton.addEventListener("click", Ensemble.Editor.MenuMGR._listeners.hamburgerButtonClicked);
            document.getElementsByClassName("app-trigger--force-save")[0].addEventListener("click", Ensemble.Editor.MenuMGR._listeners.forceSaveClicked);
            document.getElementsByClassName("app-trigger--save-as")[0].addEventListener("click", Ensemble.Editor.MenuMGR._listeners.saveAsClicked);
            document.getElementsByClassName("app-trigger--close-project")[0].addEventListener("click", Ensemble.Editor.MenuMGR._listeners.closeProjectClicked);

            let toolbarCommands = document.getElementsByClassName("editor-toolbar-command");
            for (let i = 0; i < toolbarCommands.length; i++) {
                toolbarCommands[i].addEventListener("click", Ensemble.Editor.MenuMGR._listeners.menuCommandClick);
            }

            let menuCommands = document.getElementsByClassName("app-trigger--editor");
            for (let i = 0; i < menuCommands.length; i++) {
                menuCommands[i].addEventListener("click", Ensemble.Editor.MenuMGR._listeners.menuCommandClick);
            }
        },

        _cleanUI: function () {
            this.ui.hamburgerButton.removeEventListener("click", Ensemble.Editor.MenuMGR._listeners.hamburgerButtonClicked);
            document.getElementsByClassName("app-trigger--force-save")[0].removeEventListener("click", Ensemble.Editor.MenuMGR._listeners.forceSaveClicked);
            document.getElementsByClassName("app-trigger--save-as")[0].removeEventListener("click", Ensemble.Editor.MenuMGR._listeners.saveAsClicked);
            document.getElementsByClassName("app-trigger--close-project")[0].removeEventListener("click", Ensemble.Editor.MenuMGR._listeners.closeProjectClicked);

            this.ui.clickEater = null;
            this.ui.createLensFlyout = null;
            this.ui.hamburgerFlyout = null;
            this.ui.hamburgerButton = null;

            let toolbarCommands = document.getElementsByClassName("editor-toolbar-command");
            for (let i = 0; i < toolbarCommands.length; i++) {
                toolbarCommands[i].removeEventListener("click", Ensemble.Editor.MenuMGR._listeners.menuCommandClick);
            }

            let menuCommands = document.getElementsByClassName("app-trigger--editor");
            for (let i = 0; i < menuCommands.length; i++) {
                menuCommands[i].removeEventListener("click", Ensemble.Editor.MenuMGR._listeners.menuCommandClick);
            }
        },

        _listeners: {
            hamburgerButtonClicked: function (event) {
                Ensemble.Editor.MenuMGR.ui.hamburgerFlyout.winControl.show(event.currentTarget);
                //$(".app-page--editor-menu").removeClass("app-page--hidden");
                //$(".app-page--editor-menu").addClass("app-page--enter-left");
                //document.getElementsByClassName("app-page--editor-menu")[0].addEventListener("animationend", Ensemble.Editor.MenuMGR._listeners.fileMenuEntered);

                //Ensemble.Editor.MenuMGR.menuOpen = true;
                //$(Ensemble.Editor.MenuMGR.ui.clickEater).addClass("ensemble-clickeater--active");
                //Ensemble.Navigation.pushBackState(Ensemble.Editor.MenuMGR.closeFileMenu);
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

            exitAnimationFinished: function (event) {
                let editorMenu = document.getElementsByClassName("app-page--editor-menu")[0];
                $(editorMenu).removeClass("app-page--exit").addClass("app-page--hidden");;
                editorMenu.removeEventListener("animationend", Ensemble.Editor.MenuMGR._listeners.exitAnimationFinished);
            },

            clickEaterClicked: function (event) {
                Ensemble.Editor.MenuMGR.closeMenu();
            },

            menuCommandClick: function (event) {
                let command = event.currentTarget.dataset.editorCommand;

                if (command == "show-library") {
                    let mediaBrowser = document.getElementsByClassName("app-page--media-browser")[0];
                    $(mediaBrowser).removeClass("app-page--hidden");
                    $(mediaBrowser).addClass("app-page--enter-left");
                    mediaBrowser.addEventListener("animationend", Ensemble.Editor.MenuMGR._listeners.importMenuEntered)

                    Ensemble.Editor.MenuMGR.menuOpen = true;
                    $(Ensemble.Editor.MenuMGR.ui.clickEater).addClass("ensemble-clickeater--active");
                    Ensemble.Navigation.pushBackState(Ensemble.Editor.MenuMGR.closeMediaMenu);
                }

                else if (command == "browse-media") {
                    Ensemble.FileIO.showMediaFilePicker(Ensemble.Editor.MenuMGR._listeners.browseMediaReturned, {
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

                // ANIMATIONS/EFFECTS
                else if (command == "create-filter") {
                    console.log("Create a new filter.");
                    let allCommands = [],
                        trackCount = Ensemble.Editor.TimelineMGR.tracks.length;
                    for (let i = 0; i < trackCount; i++) {
                        //Create a new menu item for each track.
                        let menuItem = new WinJS.UI.MenuCommand();
                        menuItem.label = (i + 1) + ".) " + Ensemble.Editor.TimelineMGR.tracks[i].name;
                        menuItem.element.dataset.trackId = Ensemble.Editor.TimelineMGR.tracks[i].id;
                        menuItem.addEventListener("click", Ensemble.Editor.MenuMGR._listeners.addLensTrackSelected);
                        allCommands.push(menuItem);
                    }
                   Ensemble.Editor.MenuMGR.ui.createLensFlyout.winControl.commands = allCommands;
                   Ensemble.Editor.MenuMGR.ui.createLensFlyout.winControl.show(event.currentTarget, "autovertical");
                }
            },

            importMenuEntered: function (event) {
                event.currentTarget.removeEventListener("animationend", Ensemble.Editor.MenuMGR._listeners.importMenuEntered);
                $(event.currentTarget).removeClass("app-page--enter-left");
                Ensemble.Editor.MediaBrowser.refresh();
            },

            importMenuExited: function (event) {
                let mediaBrowser = document.getElementsByClassName("app-page--media-browser")[0];
                $(mediaBrowser).removeClass("app-page--exit-left").addClass("app-page--hidden");
                mediaBrowser.removeEventListener("animationend", Ensemble.Editor.MenuMGR._listeners.importMenuExited);
            },

            browseMediaReturned: function (file, payload) {
                Ensemble.Editor.MediaBrowser._currentPreview = file;
                Ensemble.Editor.MediaBrowser._addPreviewToProject(payload);
            },

            addLensTrackSelected: function (event) {
                let trackId = parseInt(event.currentTarget.dataset.trackId, 10),
                    createLensAction = new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.createLens, {
                        lensId: null,
                        destinationTrack: trackId,
                        destinationTime: Ensemble.Editor.PlaybackMGR.lastTime
                    });
                Ensemble.HistoryMGR.performAction(createLensAction);
            },

            fileMenuEntered: function (event) {
                $(".app-page--editor-menu").removeClass("app-page--enter-left");
                document.getElementsByClassName("app-page--editor-menu")[0].removeEventListener("animationend", Ensemble.Editor.MenuMGR._listeners.fileMenuEntered);
            },

            fileMenuExited: function (event) {
                $(".app-page--editor-menu").removeClass("app-page--exit-left");
                document.getElementsByClassName("app-page--editor-menu")[0].removeEventListener("animationend", Ensemble.Editor.MenuMGR._listeners.fileMenuExited);
                $(".app-page--editor-menu").addClass("app-page--hidden");
            }
        },
    });
})();