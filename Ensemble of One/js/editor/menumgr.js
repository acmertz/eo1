﻿(function () {
    WinJS.Namespace.define("Ensemble.Editor.MenuMGR", {
        /// <summary>Manages the functionality of the Editor menu and all its commands.</summary>

        menuOpen: false,
        currentMenu: null,
        currentState: "none",

        init: function () {
            this._refreshUI();
            this._reevaluateState();
            $(".editor-toolbar--home").removeClass("editor-toolbar--hidden").addClass("editor-toolbar--visible");
        },

        unload: function () {
            this._cleanUI();
            this.menuOpen = false;
            this.currentMenu = null;
            this.currentState = "none";

            let editorMenu = document.getElementsByClassName("app-page--editor-menu")[0];
            if (!$(editorMenu).hasClass("app-page--hidden")) {
                $(editorMenu).addClass("app-page--exit-right");
                editorMenu.addEventListener("animationend", Ensemble.Editor.MenuMGR._listeners.exitAnimationFinished);
            }
        },

        hideMenus: function () {
            /// <summary>Hides any active menus, but keeps the menu in the "Open" state. Useful for swapping menues.</summary>
            if (this.currentMenu) this.currentMenu.removeEventListener("transitionend", Ensemble.Editor.MenuMGR._listeners.importMenuTransitioned);
            $(".editor-menu").removeClass("editor-menu--visible");
            //$(".editor-menubar__tab--active").removeClass("editor-menubar__tab--active");
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

            $(".app-page--editor").removeClass("app-page--displace-right-320").addClass("app-page--close-displace-right-320");
            document.getElementsByClassName("app-page--editor")[0].addEventListener("animationend", Ensemble.Editor.MenuMGR._listeners.projectMenuExited)
        },

        closeMediaMenu: function () {
            $(Ensemble.Editor.MenuMGR.ui.clickEater).removeClass("ensemble-clickeater--active");

            $(".app-page--editor").removeClass("app-page--displace-right-600").addClass("app-page--close-displace-right-600");
            document.getElementsByClassName("app-page--editor")[0].addEventListener("animationend", Ensemble.Editor.MenuMGR._listeners.importMenuExited)
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

            $(".editor-toolbar-command--import-media").removeAttr("disabled");
            $(".editor-toolbar-command--browse-media").removeAttr("disabled");
            $(".editor-toolbar-command--create-filter").removeAttr("disabled");
            $(".editor-toolbar-command--record-video").removeAttr("disabled");

            if (Ensemble.Editor.SelectionMGR.selected.length == 1) {
                $(".editor-toolbar-command--clear-selection").removeAttr("disabled");
                $(".editor-toolbar-command--split-clip").removeAttr("disabled");
            }
        },

        ui: {
            clickEater: null,
            projectThumb: null,
            createLensFlyout: null
        },

        _refreshUI: function () {
            this.ui.clickEater = document.getElementsByClassName("ensemble-clickeater--editor-menu")[0];
            this.ui.projectThumb = document.getElementsByClassName("editor-project-details__thumb")[0];
            this.ui.createLensFlyout = document.getElementsByClassName("contextmenu--editor-create-lens")[0];

            let menuBarButtons = document.getElementsByClassName("editor-menubar__tab");
            for (let i = 0; i < menuBarButtons.length; i++) {
                menuBarButtons[i].addEventListener("pointerdown", Ensemble.Editor.MenuMGR._listeners.menubarButtonClicked);
            }

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
            this.ui.clickEater = null;
            this.ui.projectThumb = null;
            this.ui.createLensFlyout = null;

            let menuBarButtons = document.getElementsByClassName("editor-menubar__tab");
            for (let i = 0; i < menuBarButtons.length; i++) {
                menuBarButtons[i].removeEventListener("pointerdown", Ensemble.Editor.MenuMGR._listeners.menubarButtonClicked);
            }

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
            exitAnimationFinished: function (event) {
                let editorMenu = document.getElementsByClassName("app-page--editor-menu")[0];
                $(editorMenu).removeClass("app-page--exit-right").addClass("app-page--hidden");;
                editorMenu.removeEventListener("animationend", Ensemble.Editor.MenuMGR._listeners.exitAnimationFinished);
            },

            menubarButtonClicked: function (event) {
                let targetToolbarId = event.currentTarget.dataset.ensembleMenu;
                let targetToolbar = document.getElementsByClassName("editor-toolbar--" + event.currentTarget.dataset.ensembleMenu)[0];
                if (targetToolbarId == "file") {
                    Ensemble.Editor.MenuMGR.ui.projectThumb.src = Ensemble.Session.projectThumb;

                    $(".app-page--editor-menu").removeClass("app-page--hidden");
                    $(".app-page--editor").addClass("app-page--displace app-page--displace-right-320");

                    Ensemble.Editor.MenuMGR.menuOpen = true;
                    $(Ensemble.Editor.MenuMGR.ui.clickEater).addClass("ensemble-clickeater--active");
                    Ensemble.Navigation.pushBackState(Ensemble.Editor.MenuMGR.closeFileMenu);
                }
                else {
                    let activeToolbar = document.getElementsByClassName("editor-toolbar--visible")[0];
                    let activeToolbarId = null;
                    if (activeToolbar) {
                        activeToolbarId = activeToolbar.dataset.ensembleMenu;
                        $(activeToolbar).removeClass("editor-toolbar--visible").addClass("editor-toolbar--hidden");
                        $(".editor-menubar__tab--" + activeToolbarId).removeClass("editor-menubar__tab--active");
                    }
                    
                    if (targetToolbarId != activeToolbarId) {
                        $(targetToolbar).removeClass("editor-toolbar--hidden").addClass("editor-toolbar--visible");
                        $(".editor-menubar__tab--" + targetToolbarId).addClass("editor-menubar__tab--active");
                    }
                    Ensemble.Pages.Editor.viewResized();
                }
            },

            clickEaterClicked: function (event) {
                Ensemble.Editor.MenuMGR.closeMenu();
            },

            menuCommandClick: function (event) {
                let command = event.currentTarget.dataset.editorCommand;

                if (command == "show-library") {
                    $(".app-page--media-browser").removeClass("app-page--hidden");
                    $(".app-page--editor").addClass("app-page--displace app-page--displace-right-600");
                    document.getElementsByClassName("app-page--editor")[0].addEventListener("animationend", Ensemble.Editor.MenuMGR._listeners.importMenuTransitioned)

                    Ensemble.Editor.MenuMGR.menuOpen = true;
                    $(Ensemble.Editor.MenuMGR.ui.clickEater).addClass("ensemble-clickeater--active");
                    Ensemble.Navigation.pushBackState(Ensemble.Editor.MenuMGR.closeMediaMenu);
                }

                else if (command == "browse-media") {
                    Ensemble.FileIO.showMediaFilePicker(Ensemble.Editor.MenuMGR._listeners.browseMediaReturned, {
                        currentTarget: event.currentTarget
                    });
                }

                // HOME
                else if (command == "undo") Ensemble.HistoryMGR.undoLast();
                else if (command == "redo") Ensemble.HistoryMGR.redoNext();
                else if (command == "close-project") Ensemble.Pages.Editor.unload();
                else if (command == "force-save") Ensemble.FileIO.saveProject();
                else if (command == "save-as") Ensemble.FileIO.requestSaveAs();

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
                    Ensemble.Editor.PopinMGR.requestPopin(Ensemble.Editor.PopinMGR.PopinTypes.cameraCapture);
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

            importMenuTransitioned: function (event) {
                event.currentTarget.removeEventListener("animationend", Ensemble.Editor.MenuMGR._listeners.importMenuTransitioned);
                Ensemble.Editor.MediaBrowser.refresh();
            },

            importMenuExited: function (event) {
                document.getElementsByClassName("app-page--editor")[0].removeEventListener("animationend", Ensemble.Editor.MenuMGR._listeners.importMenuExited);
                $(".app-page--media-browser").addClass("app-page--hidden");
                $(".app-page--editor").removeClass("app-page--displace app-page--close-displace-right-600");
            },

            projectMenuExited: function (event) {
                document.getElementsByClassName("app-page--editor")[0].removeEventListener("animationend", Ensemble.Editor.MenuMGR._listeners.projectMenuExited);
                $(".app-page--editor-menu").addClass("app-page--hidden");
                $(".app-page--editor").removeClass("app-page--displace app-page--close-displace-right-320");
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
            }
        },
    });
})();