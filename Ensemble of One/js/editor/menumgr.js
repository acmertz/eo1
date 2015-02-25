(function () {
    WinJS.Namespace.define("Ensemble.Editor.MenuMGR", {
        /// <summary>Manages the history state of the current project.</summary>

        menuOpen: false,
        currentMenu: null,

        init: function () {
            this._refreshUI();
        },

        unload: function () {
            this._cleanUI();
            this.menuOpen = false;
            this.currentMenu = null;
            $(".editor-menu").removeClass(".editor-menu--visible");
        },

        showMenu: function (menuElement) {
            /// <summary>Shows the given menu.</summary>
            /// <param name="menuElement" type="Element">The HTML element representing the menu.</param>
            this.hideMenus();
            $(menuElement).addClass("editor-menu--visible");
            this.currentMenu = menuElement;

            let menuBarButtons = document.getElementsByClassName("editor-menubar__command");
            for (let i = 0; i < menuBarButtons.length; i++) {
                menuBarButtons[i].addEventListener("pointerenter", Ensemble.Editor.MenuMGR._listeners.mouseEnteredMenubarCommand);
            }
        },

        hideMenus: function () {
            /// <summary>Hides any active menus.</summary>
            $(".editor-menu").removeClass("editor-menu--visible");
            this.currentMenu = null;

            let menuBarButtons = document.getElementsByClassName("editor-menubar__command");
            for (let i = 0; i < menuBarButtons.length; i++) {
                menuBarButtons[i].removeEventListener("pointerenter", Ensemble.Editor.MenuMGR._listeners.mouseEnteredMenubarCommand);
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
            }
        },

        _listeners: {
            menubarButtonClicked: function (event) {
                console.log("Menubar button clicked: " + event.currentTarget.dataset.ensembleMenu);
                let targetMenu = document.getElementsByClassName("editor-menu--" + event.currentTarget.dataset.ensembleMenu)[0];
                if (!Ensemble.Editor.MenuMGR.menuOpen) {
                    Ensemble.Editor.MenuMGR.showMenu(targetMenu);
                    Ensemble.Editor.MenuMGR.menuOpen = true;
                    $(Ensemble.Editor.MenuMGR.ui.clickEater).addClass("editor-menu-clickeater--active");
                    
                }
                else if (Ensemble.Editor.MenuMGR.currentMenu == targetMenu) {
                    $(Ensemble.Editor.MenuMGR.ui.clickEater).removeClass("editor-menu-clickeater--active");
                    Ensemble.Editor.MenuMGR.hideMenus();
                    Ensemble.Editor.MenuMGR.menuOpen = false;
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
                $(Ensemble.Editor.MenuMGR.ui.clickEater).removeClass("editor-menu-clickeater--active");
                Ensemble.Editor.MenuMGR.hideMenus();
                Ensemble.Editor.MenuMGR.menuOpen = false;
            }
        }
    });
})();