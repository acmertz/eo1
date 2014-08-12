(function () {
    WinJS.Namespace.define("Ensemble.Pages.Editor", {
        /// <summary>Functions used to control the behavior of the Editor page.</summary>

        //// PRIVATE INSTANCE VARIABLES ////
        

        //// PUBLIC INSTANCE VARIABLES ////
        currentMenuItem: null,
        currentMenuTab: null,

        //// PUBLIC METHODS ////

        showInitial: function () {
            /// <summary>Plays the Editor pagelaunch animation and attaches all event listeners.</summary>
            document.getElementById("editorPageContainer").style.visibility = "visible";
            var upperHalf = document.getElementById("editorUpperHalf");
            var lowerHalf = document.getElementById("editorLowerHalf")
            WinJS.UI.Animation.enterPage([upperHalf, lowerHalf], null).then(function () {
            });
            window.setTimeout(function () {
                $("#editorHorizontalDivider").removeClass("editorHorizontalDividerHidden");
            }, 500);
            

            this.currentMenuItem = document.getElementById("editorMenuContentProject");
            this.currentMenuTab = document.getElementById("editorMenuTabProject");
            this._attachListeners();
        },

        hide: function () {
            /// <summary>Plays the Editor page hide animation and detaches all event listeners.</summary>
            console.log("Hiding the Main Menu.");
            window.clearInterval(this._projectLoadTimer);

            // Hide the current page
            $("#mainMenuPageContainer").addClass("pageContainerHidden");
            window.setTimeout(function () {
                WinJS.UI.Animation.exitContent(document.getElementById("imgMainLogo")).done(function () {
                    document.getElementById("mainMenuPageContainer").style.display = "none";
                    Ensemble.Pages.Editor.showInitial();
                });
            }, 500)

            this._detachListeners();
        },

        showActionMenu: function () {
            /// <summary>Shows the Editor page menu and activates its click eater.</summary>
            document.getElementById("editorMenuClickEater").style.display = "inline";

            var menuDialog = document.getElementById("editorMenuDialog");
            menuDialog.style.visibility = "visible";

            Ensemble.Pages.Editor.currentMenuItem.style.display = "inline";
            Ensemble.Pages.Editor.currentMenuItem.style.opacity = 1;

            WinJS.UI.Animation.enterContent(menuDialog);
        },

        hideActionMenu: function () {
            /// <summary>Hides the Editor page menu and deactivates its click eater.</summary>
            document.getElementById("editorMenuClickEater").style.display = "none";

            var menuDialog = document.getElementById("editorMenuDialog");
            WinJS.UI.Animation.fadeOut(menuDialog).done(function () {
                menuDialog.style.visibility = "hidden";
                var menuItems = document.getElementsByClassName("editorMenuContentItem");
                for (var i = 0; i < menuItems.length; i++) {
                    menuItems[i].style.opacity = 0;
                    menuItems[i].style.display = "none";
                }
            });
        },

        menuShowProjectTab: function () {
            /// <summary>Hides the currently active menu tab and shows the Project tab in its place.</summary>
            this._menuHeaderFocusTab(document.getElementById("editorMenuTabProject"), document.getElementById("editorMenuContentProject"));
            $("#editorMenuTabEdit").addClass("editorMenuRightAdjacentTab");
            document.getElementById("editorMenuDialogTabs").style.backgroundColor = "white";
        },

        menuShowEditTab: function () {
            /// <summary>Hides the currently active menu tab and shows the Edit tab in its place.</summary>
            this._menuHeaderFocusTab(document.getElementById("editorMenuTabEdit"), document.getElementById("editorMenuContentEdit"));
            $("#editorMenuTabProject").addClass("editorMenuLeftAdjacentTab");
            $("#editorMenuTabClip").addClass("editorMenuRightAdjacentTab");
            document.getElementById("editorMenuDialogTabs").style.backgroundColor = "rgb(230,230,230)";
        },

        menuShowClipTab: function () {
            /// <summary>Hides the currently active menu tab and shows the Clip tab in its place.</summary>
            this._menuHeaderFocusTab(document.getElementById("editorMenuTabClip"), document.getElementById("editorMenuContentClip"));
            $("#editorMenuTabEdit").addClass("editorMenuLeftAdjacentTab");
            $("#editorMenuTabTrack").addClass("editorMenuRightAdjacentTab");
            document.getElementById("editorMenuDialogTabs").style.backgroundColor = "rgb(230,230,230)";
        },

        menuShowTrackTab: function () {
            /// <summary>Hides the currently active menu tab and shows the Track tab in its place.</summary>
            this._menuHeaderFocusTab(document.getElementById("editorMenuTabTrack"), document.getElementById("editorMenuContentTrack"));
            $("#editorMenuTabClip").addClass("editorMenuLeftAdjacentTab");
            $("#editorMenuTabExport").addClass("editorMenuRightAdjacentTab");
            document.getElementById("editorMenuDialogTabs").style.backgroundColor = "rgb(230,230,230)";
        },

        menuShowExportTab: function () {
            /// <summary>Hides the currently active menu tab and shows the Export tab in its place.</summary>
            this._menuHeaderFocusTab(document.getElementById("editorMenuTabExport"), document.getElementById("editorMenuContentExport"));
            $("#editorMenuTabTrack").addClass("editorMenuLeftAdjacentTab");
            document.getElementById("editorMenuDialogTabs").style.backgroundColor = "rgb(230,230,230)";
        },



        //// PRIVATE METHODS ////

        _attachListeners: function () {
            var menuButton = document.getElementById("editorMenuButton");
            menuButton.addEventListener("click", this._menuButtonOnClickListener, false);

            var menuHeaderProject = document.getElementById("editorMenuTabProject");
            menuHeaderProject.addEventListener("click", this._menuHeaderProjectOnClick, false);

            var menuHeaderEdit = document.getElementById("editorMenuTabEdit");
            menuHeaderEdit.addEventListener("click", this._menuHeaderEditOnClick, false);

            var menuHeaderClip = document.getElementById("editorMenuTabClip");
            menuHeaderClip.addEventListener("click", this._menuHeaderClipOnClick, false);

            var menuHeaderTrack = document.getElementById("editorMenuTabTrack");
            menuHeaderTrack.addEventListener("click", this._menuHeaderTrackOnClick, false);

            var menuHeaderExport = document.getElementById("editorMenuTabExport");
            menuHeaderExport.addEventListener("click", this._menuHeaderExportOnClick, false);

            var menuClickEater = document.getElementById("editorMenuClickEater");
            menuClickEater.addEventListener("click", this._menuClickEaterOnClickListener, false);
        },

        _detachListeners: function () {
            var menuButton = document.getElementById("editorMenuButton");
            menuButton.removeEventListener("click", this._menuButtonOnClickListener, false);
        },

        _menuButtonOnClickListener: function () {
            var menuDialog = document.getElementById("editorMenuDialog");
            if (menuDialog.style.visibility == "hidden" || menuDialog.style.visibility == "") {
                Ensemble.Pages.Editor.showActionMenu();
            }
            else {
                Ensemble.Pages.Editor.hideActionMenu();
            }
        },

        _menuClickEaterOnClickListener: function () {
            Ensemble.Pages.Editor.hideActionMenu();
        },

        _menuHeaderProjectOnClick: function () {
            Ensemble.Pages.Editor.menuShowProjectTab();
        },

        _menuHeaderEditOnClick: function () {
            Ensemble.Pages.Editor.menuShowEditTab();
        },

        _menuHeaderClipOnClick: function () {
            Ensemble.Pages.Editor.menuShowClipTab();
        },

        _menuHeaderTrackOnClick: function () {
            Ensemble.Pages.Editor.menuShowTrackTab();
        },

        _menuHeaderExportOnClick: function () {
            Ensemble.Pages.Editor.menuShowExportTab();
        },

        _menuHeaderFocusTab: function (tabToFocus, itemToShow) {
            /// <summary>Focuses the indicated tab and blurs the tab that was previously focused.</summary>
            /// <param name="tabToFocus" type="HTML Element">The tab to focus.</param>
            /// <param name="itemToShow" type="HTML Element">The menu item to show.</param>

            var allTabs = document.getElementsByClassName("editorMenuTabHeader");
            for (var i = 0; i < allTabs.length; i++) {
                $(allTabs[i]).removeClass("editorMenuRightAdjacentTab");
                $(allTabs[i]).removeClass("editorMenuLeftAdjacentTab");
            }

            $(Ensemble.Pages.Editor.currentMenuTab).removeClass("editorMenuTabFocused");
            $(Ensemble.Pages.Editor.currentMenuTab).addClass("editorMenuTabBlurred");

            Ensemble.Pages.Editor.currentMenuTab = tabToFocus;

            $(Ensemble.Pages.Editor.currentMenuTab).removeClass("editorMenuTabBlurred");
            $(Ensemble.Pages.Editor.currentMenuTab).addClass("editorMenuTabFocused");

            WinJS.UI.Animation.exitContent(Ensemble.Pages.Editor.currentMenuItem).done(function () {
                Ensemble.Pages.Editor.currentMenuItem.style.display = "none";
                Ensemble.Pages.Editor.currentMenuItem = itemToShow;
                Ensemble.Pages.Editor.currentMenuItem.style.display = "inline";
                WinJS.UI.Animation.enterContent(Ensemble.Pages.Editor.currentMenuItem);
            });
        }
    });
})();