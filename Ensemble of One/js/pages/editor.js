(function () {
    WinJS.Namespace.define("Ensemble.Pages.Editor", {
        /// <summary>Functions used to control the behavior of the Editor page.</summary>

        //// PRIVATE INSTANCE VARIABLES ////
        _uiSplitpointMousedownOffsetY: 0,
        _screenClickOffsetY: 0,

        //// PUBLIC INSTANCE VARIABLES ////
        currentMenuItem: null,
        currentMenuTab: null,

        //// PUBLIC METHODS ////

        showInitial: function () {
            /// <summary>Plays the Editor pagelaunch animation and attaches all event listeners.</summary>
            document.getElementById("editorPageContainer").style.visibility = "visible";
            this.layoutInterfaceToSplitpoint(Ensemble.Settings.getEditorDividerPosition() * window.innerHeight);
            var upperHalf = document.getElementById("editorUpperHalf");
            var lowerHalf = document.getElementById("editorLowerHalf")
            WinJS.UI.Animation.enterPage([upperHalf, lowerHalf], null).then(function () {
            });
            window.setTimeout(function () {
                $("#editorHorizontalDivider").removeClass("editorHorizontalDividerHidden");
                $("#editorHorizontalDivider").addClass("editorHorizontalDividerVisible")
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

        viewResized: function () {
            /// <summary>Adjusts the size of all display surfaces to match the change in window dimensions.</summary>

            //Main display canvas
            var leftClearance = Ensemble.Pages.Editor.UI.PageSections.menuButtons.clientWidth + Ensemble.Pages.Editor.UI.PageSections.upperHalf.customButtonsLeft.clientWidth;
            var maxWidth = window.innerWidth - (2 * leftClearance);
            var maxHeight = Ensemble.Pages.Editor.UI.PageSections.upperHalf.canvasContainer.clientHeight;

            var finalWidth = 0;
            var finalHeight = 0;

            if (maxHeight >  Ensemble.Utilities.AspectGenerator.generateHeight(Ensemble.Session.projectAspect, maxWidth)) {
                //Canvas area is taller than it is wide.
                //Calculate the canvas height from a predetermined width.
                finalWidth = maxWidth;
                finalHeight = Ensemble.Utilities.AspectGenerator.generateHeight(Ensemble.Session.projectAspect, finalWidth);
            }
            else {
                //Canvas area is wider than it is tall.
                //Calculate the canvas width from a predetermined height.
                finalHeight = maxHeight;
                finalWidth = Ensemble.Utilities.AspectGenerator.generateWidth(Ensemble.Session.projectAspect, finalHeight);
            }

            Ensemble.Pages.Editor.UI.PageSections.upperHalf.canvasAndControls.style.width = finalWidth + "px";
            Ensemble.Pages.Editor.UI.RenderSurfaces.mainCanvas.style.height = finalHeight + "px";

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

        uiSplitpointDragBegin: function (screenOffsetY, splitpointOffsetY) {
            /// <summary>Begins a drag operation on the main UI splitpoint.</summary>
            /// <param name="screenOffsetY" type="Number">The offset in pixels from the top of the screen that the mousedown occurred.</param>
            /// <param name="splitpointOffsetY" type="Number">The offset in pixels from the top of the splitpoint element that the mousedown occurred.</param>
            this._screenClickOffsetY = screenOffsetY;
            this._uiSplitpointMousedownOffsetY = splitpointOffsetY;
            $(Ensemble.Pages.Editor.UI.UserInput.Boundaries.topBottomSplit).addClass("zIndexTop");
            $(Ensemble.Pages.Editor.UI.UserInput.ClickEaters.splitpoint).removeClass("editorClickEaterFaded");
            Ensemble.Pages.Editor.UI.UserInput.Boundaries.topBottomSplit.removeEventListener("mousedown", this._topBottomSplitMouseDown, false);
            document.addEventListener("mousemove", this._topBottomSplitDragMove, false);
            document.addEventListener("mouseup", this._topBottomSplitDragEnd, false);
            this.uiSplitpointDraggedTo(screenOffsetY);
        },

        uiSplitpointDraggedTo: function (yPosition) {
            /// <summary>Begins a drag operation on the main UI splitpoint.</summary>
            /// <param name="yPosition" type="Number">The new Y coordinate of the splitpoint.</param>

            // TODO: support vendor-specific transform functions
            Ensemble.Pages.Editor.UI.UserInput.Boundaries.topBottomSplit.style.transform = "translateY(" + (yPosition - this._screenClickOffsetY - this._uiSplitpointMousedownOffsetY) + "px)";
        },

        uiSplitpointDragEnd: function (yPosition) {
            /// <summary>Finshes a drag operation on the main UI splitpoint.</summary>
            /// <param name="yPosition" type="Number">The final Y coordinate of the splitpoint.</param>
            document.removeEventListener("mousemove", this._topBottomSplitDragMove, false);
            document.removeEventListener("mouseup", this._topBottomSplitDragEnd, false);
            Ensemble.Pages.Editor.UI.UserInput.Boundaries.topBottomSplit.addEventListener("mousedown", this._topBottomSplitMouseDown, false);

            $(Ensemble.Pages.Editor.UI.UserInput.Boundaries.topBottomSplit).removeClass("zIndexTop");
            $(Ensemble.Pages.Editor.UI.UserInput.ClickEaters.splitpoint).addClass("editorClickEaterFaded");

            this.layoutInterfaceToSplitpoint(yPosition);
            Ensemble.Settings.setEditorDividerPosition(yPosition / window.innerHeight);
        },

        layoutInterfaceToSplitpoint: function (yPosition) {
            /// <summary>Sets the UI splitpoint to the specified position and lays out the UI around it.</summary>
            /// <param name="yPosition" type="Number">The Y coordinate in pixels representing the splitpoint's position.</param>

            // TODO: support vendor-specific transform functions
            Ensemble.Pages.Editor.UI.UserInput.Boundaries.topBottomSplit.style.transform = "";
            var topFlex = yPosition / window.innerHeight;
            var bottomFlex = (window.innerHeight - (yPosition + Ensemble.Pages.Editor.UI.UserInput.Boundaries.topBottomSplit.clientHeight)) / window.innerHeight;

            Ensemble.Pages.Editor.UI.PageSections.upperHalf.entireSection.style.flex = topFlex;
            Ensemble.Pages.Editor.UI.PageSections.lowerHalf.entireSection.style.flex = bottomFlex;
            this.viewResized();
        },

        menuShowProjectTab: function () {
            /// <summary>Hides the currently active menu tab and shows the Project tab in its place.</summary>
            this._menuHeaderFocusTab(document.getElementById("editorMenuTabProject"), document.getElementById("editorMenuContentProject"));
            $("#editorMenuTabEdit").addClass("editorMenuRightAdjacentTab");
        },

        menuShowEditTab: function () {
            /// <summary>Hides the currently active menu tab and shows the Edit tab in its place.</summary>
            this._menuHeaderFocusTab(document.getElementById("editorMenuTabEdit"), document.getElementById("editorMenuContentEdit"));
            $("#editorMenuTabProject").addClass("editorMenuLeftAdjacentTab");
            $("#editorMenuTabClip").addClass("editorMenuRightAdjacentTab");
        },

        menuShowClipTab: function () {
            /// <summary>Hides the currently active menu tab and shows the Clip tab in its place.</summary>
            this._menuHeaderFocusTab(document.getElementById("editorMenuTabClip"), document.getElementById("editorMenuContentClip"));
            $("#editorMenuTabEdit").addClass("editorMenuLeftAdjacentTab");
            $("#editorMenuTabTrack").addClass("editorMenuRightAdjacentTab");
        },

        menuShowTrackTab: function () {
            /// <summary>Hides the currently active menu tab and shows the Track tab in its place.</summary>
            this._menuHeaderFocusTab(document.getElementById("editorMenuTabTrack"), document.getElementById("editorMenuContentTrack"));
            $("#editorMenuTabClip").addClass("editorMenuLeftAdjacentTab");
            $("#editorMenuTabExport").addClass("editorMenuRightAdjacentTab");
        },

        menuShowExportTab: function () {
            /// <summary>Hides the currently active menu tab and shows the Export tab in its place.</summary>
            this._menuHeaderFocusTab(document.getElementById("editorMenuTabExport"), document.getElementById("editorMenuContentExport"));
            $("#editorMenuTabTrack").addClass("editorMenuLeftAdjacentTab");
        },



        //// PRIVATE METHODS ////

        _attachListeners: function () {
            var editorButtons = Ensemble.Pages.Editor.UI.UserInput.Buttons;
            editorButtons.actionMenu.addEventListener("click", this._menuButtonOnClickListener, false);

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

            Ensemble.Pages.Editor.UI.UserInput.Boundaries.topBottomSplit.addEventListener("mousedown", this._topBottomSplitMouseDown, false);

            window.addEventListener("resize", this.viewResized, false);
        },

        _detachListeners: function () {
            var editorButtons = Ensemble.Pages.Editor.UI.UserInput.Buttons;
            editorButtons.actionMenu.removeEventListener("click", this._menuButtonOnClickListener, false);
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

        _topBottomSplitMouseDown: function (event) {
            console.log("Mouse down on UI splitpoint at screen Y coordinate of " + event.clientY + " and top offset of " + event.offsetY);
            Ensemble.Pages.Editor.uiSplitpointDragBegin(event.clientY, event.offsetY);
        },

        _topBottomSplitDragMove: function (event) {
            Ensemble.Pages.Editor.uiSplitpointDraggedTo(event.clientY);
        },

        _topBottomSplitDragEnd: function (event) {
            Ensemble.Pages.Editor.uiSplitpointDragEnd(event.clientY);
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