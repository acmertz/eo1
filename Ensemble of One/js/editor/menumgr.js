(function () {
    WinJS.Namespace.define("Ensemble.Editor.MenuMGR", {
        /// <summary>Manages the functionality of the Editor menu and all its commands.</summary>

        menuOpen: false,
        currentMenu: null,
        currentState: "none",

        init: function () {
            this._refreshUI();
            this.setMenuState(this.menuState.defaultMenu);
        },

        unload: function () {
            this._cleanUI();
            this.menuOpen = false;
            this.currentMenu = null;
            this.currentState = "none";
            $(".editor-menu").removeClass(".editor-menu--visible");
        },

        setMenuState: function (state) {
            /// <summary>Sets the state of the menu items to reflect which commands are currently valid.</summary>
            /// <param name="state" type="String">The state to set.</param>
            if (state in this.menuState) {
                this.currentState = state;
                this._reevaluateState();
            }
        },

        showMenu: function (menuElement, menubarCommand) {
            /// <summary>Shows the given menu.</summary>
            /// <param name="menuElement" type="Element">The HTML element representing the menu.</param>
            this.hideMenus();
            this._reevaluateState();
            if (menubarCommand.dataset.ensembleMenu == "import") menuElement.addEventListener("transitionend", Ensemble.Editor.MenuMGR._listeners.importMenuTransitioned);
            $(menuElement).addClass("editor-menu--visible");
            $(menubarCommand).addClass("editor-menubar__command--active");
            this.currentMenu = menuElement;
        },

        hideMenus: function () {
            /// <summary>Hides any active menus, but keeps the menu in the "Open" state. Useful for swapping menues.</summary>
            if (this.currentMenu) this.currentMenu.removeEventListener("transitionend", Ensemble.Editor.MenuMGR._listeners.importMenuTransitioned);
            $(".editor-menu").removeClass("editor-menu--visible");
            $(".editor-menubar__command--active").removeClass("editor-menubar__command--active");
            this.currentMenu = null;
        },

        closeMenu: function () {
            /// <summary>Closes the menu.</summary>
            $(Ensemble.Editor.MenuMGR.ui.clickEater).removeClass("editor-menu-clickeater--active");
            Ensemble.Editor.MenuMGR.hideMenus();
            Ensemble.Editor.MenuMGR.menuOpen = false;
            Ensemble.KeyboardMGR.editorDefault();
        },

        _reevaluateState: function () {
            // All commands are disabled unless explicitly enabled.
            $(".editor-menu__command").addClass("editor-command--disabled");

            $(".editor-command__exit").removeClass("editor-command--disabled");
            if (Ensemble.HistoryMGR.canUndo()) $(".editor-command__undo").removeClass("editor-command--disabled");
            if (Ensemble.HistoryMGR.canRedo()) $(".editor-command__redo").removeClass("editor-command--disabled");

            if (Ensemble.Editor.SelectionMGR.selected.length > 0) {
                $(".editor-command__trim-clip").removeClass("editor-command--disabled");
                $(".editor-command__remove-clip").removeClass("editor-command--disabled");
                $(".editor-command__clear-selection").removeClass("editor-command--disabled");
            }
        },

        ui: {
            clickEater: null
        },

        _refreshUI: function () {
            this.ui.clickEater = document.getElementsByClassName("editor-menu-clickeater")[0];

            this.ui.clickEater.addEventListener("click", Ensemble.Editor.MenuMGR._listeners.clickEaterClicked);

            let menuBarButtons = document.getElementsByClassName("editor-menubar__command");
            for (let i = 0; i < menuBarButtons.length; i++) {
                menuBarButtons[i].addEventListener("click", Ensemble.Editor.MenuMGR._listeners.menubarButtonClicked);
            }

            let menuCommands = document.getElementsByClassName("editor-menu__command");
            for (let i = 0; i < menuCommands.length; i++) {
                menuCommands[i].addEventListener("pointerdown", Ensemble.Editor.MenuMGR._listeners.menuCommandPointerDown);
                menuCommands[i].addEventListener("click", Ensemble.Editor.MenuMGR._listeners.menuCommandClick);
            }
        },

        _cleanUI: function () {
            this.ui.clickEater.removeEventListener("click", Ensemble.Editor.MenuMGR._listeners.clickEaterClicked);

            this.ui.clickEater = null;

            let menuBarButtons = document.getElementsByClassName("editor-menubar__command");
            for (let i = 0; i < menuBarButtons.length; i++) {
                menuBarButtons[i].removeEventListener("click", Ensemble.Editor.MenuMGR._listeners.menubarButtonClicked);
            }

            let menuCommands = document.getElementsByClassName("editor-menu__command");
            for (let i = 0; i < menuCommands.length; i++) {
                menuCommands[i].removeEventListener("pointerdown", Ensemble.Editor.MenuMGR._listeners.menuCommandPointerDown);
                menuCommands[i].removeEventListener("click", Ensemble.Editor.MenuMGR._listeners.menuCommandClick);
            }
        },

        _listeners: {
            menubarButtonClicked: function (event) {
                let targetMenu = document.getElementsByClassName("editor-menu--" + event.currentTarget.dataset.ensembleMenu)[0];
                if (Ensemble.Editor.MenuMGR.currentMenu == targetMenu) {
                    Ensemble.Editor.MenuMGR.closeMenu();
                }
                else {
                    Ensemble.Editor.MenuMGR.showMenu(targetMenu, event.currentTarget);
                    Ensemble.Editor.MenuMGR.menuOpen = true;
                    $(Ensemble.Editor.MenuMGR.ui.clickEater).addClass("editor-menu-clickeater--active");
                    Ensemble.KeyboardMGR.editorMenu();
                }
            },

            mouseEnteredMenubarCommand: function (event) {
                console.log("Mouse entered menubar command!");
                let targetMenu = document.getElementsByClassName("editor-menu--" + event.currentTarget.dataset.ensembleMenu)[0];
                Ensemble.Editor.MenuMGR.showMenu(targetMenu);
            },

            menuCommandPointerDown: function (event) {
                WinJS.UI.Animation.pointerDown(event.currentTarget);
                event.currentTarget.addEventListener("pointerup", Ensemble.Editor.MenuMGR._listeners.menuCommandPointerUp);
            },

            menuCommandPointerUp: function (event) {
                WinJS.UI.Animation.pointerUp(event.currentTarget);
                event.currentTarget.removeEventListener("pointerup", Ensemble.Editor.MenuMGR._listeners.menuCommandPointerUp);
            },

            clickEaterClicked: function (event) {
                Ensemble.Editor.MenuMGR.closeMenu();
            },

            menuCommandClick: function (event) {
                let command = event.currentTarget.dataset.editorCommand;

                // HOME
                if (command == "undo") setTimeout(function () { Ensemble.HistoryMGR.undoLast() }, 0);
                else if (command == "redo") setTimeout(function () { Ensemble.HistoryMGR.redoNext() }, 0);
                else if (command == "exit") setTimeout(function () { Ensemble.Pages.Editor.unload() }, 0);

                // CLIP
                else if (command = "trim-clip") {
                    Ensemble.Editor.TimelineMGR.showTrimControls(Ensemble.Editor.SelectionMGR.selected[0]);
                }
                else if (command == "remove-clip") {
                    let removeAction = new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.removeClip, {
                        clipIds: Ensemble.Editor.SelectionMGR.selected
                    });
                    Ensemble.Editor.SelectionMGR.clearSelection();
                    Ensemble.Editor.SelectionMGR.clearHovering();
                    Ensemble.HistoryMGR.performAction(removeAction);
                }
                else if (command == "clear-selection") setTimeout(function () {
                    Ensemble.Editor.TimelineMGR.rejectTrim();
                    Ensemble.Editor.SelectionMGR.clearSelection();
                    Ensemble.Editor.CalloutMGR.hide();
                }, 0);

                Ensemble.Editor.MenuMGR.closeMenu();
            },

            importMenuTransitioned: function (event) {
                event.currentTarget.removeEventListener("transitionend", Ensemble.Editor.MenuMGR._listeners.importMenuTransitioned);
                Ensemble.MediaBrowser.refresh();
            }
        },

        menuState: {
            defaultMenu: "defaultMenu",
            clipSelected: "clipSelected"
        }
    });
})();