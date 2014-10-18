﻿(function () {
    WinJS.Namespace.define("Ensemble.Pages.Editor", {
        /// <summary>Functions used to control the behavior of the Editor page.</summary>

        //// PRIVATE INSTANCE VARIABLES ////
        _uiSplitpointMousedownOffsetY: 0,
        _screenClickOffsetY: 0,

        //// PUBLIC INSTANCE VARIABLES ////
        currentActionMenuItem: null,
        currentActionMenuTab: null,
        currentMediaMenuItem: null,
        currentMediaMenuTab: null,
        currentEffectsMenuItem: null,
        currentEffectsMenuTab: null,
        menuOpen: false,
        currentSubmenu: null,

        //// PUBLIC METHODS ////

        showInitial: function () {
            /// <summary>Plays the Editor pagelaunch animation and attaches all event listeners.</summary>
            document.getElementById("editorPageContainer").style.visibility = "visible";
            this.layoutInterfaceToSplitpoint(Ensemble.Settings.getEditorDividerPosition() * window.innerHeight);

            $(Ensemble.Pages.Editor.UI.PageSections.upperHalf.entireSection).addClass("editorUpperHalfVisible");

            window.setTimeout(function () {
                $(Ensemble.Pages.Editor.UI.PageSections.lowerHalf.entireSection).addClass("editorLowerHalfVisible");
            }, 100);
            

            //WinJS.UI.Animation.enterPage([upperHalf, lowerHalf], null).then(function () {
            //});

            window.setTimeout(function () {
                $(Ensemble.Pages.Editor.UI.UserInput.Boundaries.topBottomSplit).removeClass("editorHorizontalDividerHidden");
                $(Ensemble.Pages.Editor.UI.UserInput.Boundaries.topBottomSplit).addClass("editorHorizontalDividerVisible")
            }, 500);
            

            this.currentActionMenuItem = document.getElementById("editorMenuContentProject");
            this.currentActionMenuTab = document.getElementById("editorMenuTabProject");
            this.currentMediaMenuItem = document.getElementById("editorMediaMenuContentLocal");
            this.currentMediaMenuTab = Ensemble.Pages.Editor.UI.UserInput.Buttons.mediaMenuTabLocal;
            this.currentEffectsMenuItem = document.getElementById("editorEffectsMenuContentEffects");
            this.currentEffectsMenuTab = null;
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
            Ensemble.Pages.Editor.UI.UserInput.ClickEaters.menu.style.display = "inline";
            $(Ensemble.Pages.Editor.UI.UserInput.Buttons.actionMenu).addClass("editorMenuToggleFocused");

            var menuDialog = Ensemble.Pages.Editor.UI.PageSections.menu.entireSection;

            Ensemble.Pages.Editor.UI.PageSections.menu.actionMenu.entireSection.style.display = "flex";
            Ensemble.Pages.Editor.UI.PageSections.menu.actionMenu.entireSection.style.opacity = 1;

            Ensemble.Pages.Editor.currentActionMenuItem.style.display = "inline";
            Ensemble.Pages.Editor.currentActionMenuItem.style.opacity = 1;

            //WinJS.UI.Animation.enterContent(menuDialog);
            $(menuDialog).removeClass("editorMenuDialogHidden");
            $(menuDialog).addClass("editorMenuDialogVisible");

            this.menuOpen = true;
            this.currentSubmenu = Ensemble.Pages.Editor.UI.PageSections.menu.actionMenu.entireSection;
        },

        hideActionMenu: function () {
            /// <summary>Hides the Editor page menu and deactivates its click eater.</summary>
            document.getElementById("editorMenuClickEater").style.display = "none";

            var menuDialog = Ensemble.Pages.Editor.UI.PageSections.menu.entireSection;
            $(menuDialog).removeClass("editorMenuDialogVisible");
            $(menuDialog).addClass("editorMenuDialogHidden");
            window.setTimeout(function (event) {
                var menuItems = document.getElementsByClassName("editorMenuContentItem");
                for (var i = 0; i < menuItems.length; i++) {
                    menuItems[i].style.opacity = 0;
                    menuItems[i].style.display = "none";
                }
                Ensemble.Pages.Editor.hideAllSubmenus();
            }, 300);
            this.menuOpen = false;           
        },

        showMediaMenu: function () {
            /// <summary>Shows the Media Menu, hiding any other menus if necessary.</summary>
            Ensemble.Pages.Editor.UI.UserInput.ClickEaters.menu.style.display = "inline";
            $(Ensemble.Pages.Editor.UI.UserInput.Buttons.mediaMenu).addClass("editorMenuToggleFocused");

            var menuDialog = Ensemble.Pages.Editor.UI.PageSections.menu.entireSection;

            this.hideAllSubmenus();

            Ensemble.Pages.Editor.UI.PageSections.menu.mediaMenu.entireSection.style.display = "flex";
            Ensemble.Pages.Editor.UI.PageSections.menu.mediaMenu.entireSection.style.opacity = 1;

            var menuInstance = Ensemble.Pages.Editor.UI.PageSections.menu.mediaMenu.entireSection.getElementsByClassName("editorMenuContentItem")[0];
            menuInstance.style.opacity = 1;
            menuInstance.style.display = "flex";

            //WinJS.UI.Animation.enterContent(menuDialog);
            $(menuDialog).removeClass("editorMenuDialogHidden");
            $(menuDialog).addClass("editorMenuDialogVisible");
            Ensemble.Pages.Editor.refreshMediaBrowser();

            this.menuOpen = true;
            this.currentSubmenu = Ensemble.Pages.Editor.UI.PageSections.menu.mediaMenu.entireSection;
        },

        showEffectsMenu: function () {
            /// <summary>Shows the Media Menu, hiding any other menus if necessary.</summary>
            Ensemble.Pages.Editor.UI.UserInput.ClickEaters.menu.style.display = "inline";
            $(Ensemble.Pages.Editor.UI.UserInput.Buttons.effectsMenu).addClass("editorMenuToggleFocused");

            var menuDialog = Ensemble.Pages.Editor.UI.PageSections.menu.entireSection;

            this.hideAllSubmenus();

            Ensemble.Pages.Editor.UI.PageSections.menu.effectsMenu.entireSection.style.display = "flex";
            Ensemble.Pages.Editor.UI.PageSections.menu.effectsMenu.entireSection.style.opacity = 1;

            var menuInstance = Ensemble.Pages.Editor.UI.PageSections.menu.effectsMenu.entireSection.getElementsByClassName("editorMenuContentItem")[0];
            menuInstance.style.opacity = 1;
            menuInstance.style.display = "inline";

            //WinJS.UI.Animation.enterContent(menuDialog);
            $(menuDialog).removeClass("editorMenuDialogHidden");
            $(menuDialog).addClass("editorMenuDialogVisible");

            this.menuOpen = true;
            this.currentSubmenu = Ensemble.Pages.Editor.UI.PageSections.menu.effectsMenu.entireSection;
        },

        hideAllSubmenus: function () {
            var subMenus = document.getElementsByClassName("editorSubMenu");
            for (var i = 0; i < subMenus.length; i++) {
                subMenus[i].style.display = "none";
            }
        },

        swapSubmenus: function (submenu1, submenu2) {
            /// <summary>Swaps the visibility of the two given submenus.</summary>
            /// <param name="submenu1" type="HTMLElement">The submenu to hide.</param>
            /// <param name="submenu2" type="HTMLElement">The submenu to show.</param>
            WinJS.UI.Animation.exitContent(submenu1).then(function () {
                submenu1.style.display = "none";
                submenu2.style.display = "flex";
                if (submenu2 === Ensemble.Pages.Editor.UI.PageSections.menu.mediaMenu.entireSection) Ensemble.Pages.Editor.refreshMediaBrowser();
                WinJS.UI.Animation.enterContent(submenu2);
                Ensemble.Pages.Editor.currentSubmenu = submenu2;
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

        mediaMenuShowLocalTab: function () {
            /// <summary>Hides the currently active media menu tab and shows the Local tab in its place.</summary>
            Ensemble.Pages.Editor.refreshMediaBrowser();
            this._mediaMenuHeaderFocusTab(Ensemble.Pages.Editor.UI.UserInput.Buttons.mediaMenuTabLocal, document.getElementById("editorMediaMenuContentLocal"));
            $(Ensemble.Pages.Editor.UI.UserInput.Buttons.mediaMenuTabCamera).addClass("editorMenuRightAdjacentTab");
        },

        mediaMenuShowCameraTab: function () {
            /// <summary>Hides the currently active media menu tab and shows the Camera tab in its place.</summary>
            this._mediaMenuHeaderFocusTab(Ensemble.Pages.Editor.UI.UserInput.Buttons.mediaMenuTabCamera, document.getElementById("editorMediaMenuContentCamera"));
            $(Ensemble.Pages.Editor.UI.UserInput.Buttons.mediaMenuTabLocal).addClass("editorMenuLeftAdjacentTab");
            $(Ensemble.Pages.Editor.UI.UserInput.Buttons.mediaMenuTabMic).addClass("editorMenuRightAdjacentTab");
        },

        mediaMenuShowMicTab: function () {
            /// <summary>Hides the currently active media menu tab and shows the Mic tab in its place.</summary>
            this._mediaMenuHeaderFocusTab(Ensemble.Pages.Editor.UI.UserInput.Buttons.mediaMenuTabMic, document.getElementById("editorMediaMenuContentMic"));
            $(Ensemble.Pages.Editor.UI.UserInput.Buttons.mediaMenuTabCamera).addClass("editorMenuLeftAdjacentTab");
        },

        refreshMediaBrowser: function () {
            /// <summary>Refreshes the Media Browser at its current location</summary>
            console.log("Refreshing the Media Browser...");
            Ensemble.MediaBrowser.navigateToFolder(Ensemble.MediaBrowser.currentLocation());
        },












        //// PRIVATE METHODS ////

        _attachListeners: function () {
            var editorButtons = Ensemble.Pages.Editor.UI.UserInput.Buttons;
            editorButtons.actionMenu.addEventListener("click", this._menuButtonOnClickListener, false);
            editorButtons.mediaMenu.addEventListener("click", this._mediaMenuButtonOnClickListener, false);
            editorButtons.effectsMenu.addEventListener("click", this._effectsMenuButtonOnClickListener, false);

            Ensemble.Pages.Editor.UI.UserInput.Buttons.mediaBrowserLocation.addEventListener("click", this._mediaBrowserButtonOnClickListener, false);

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


            //Media menu
            Ensemble.Pages.Editor.UI.UserInput.Buttons.mediaMenuTabLocal.addEventListener("click", this._mediaMenuTabLocalOnClickListener, false);
            Ensemble.Pages.Editor.UI.UserInput.Buttons.mediaMenuTabCamera.addEventListener("click", this._mediaMenuTabCameraOnClickListener, false);
            Ensemble.Pages.Editor.UI.UserInput.Buttons.mediaMenuTabMic.addEventListener("click", this._mediaMenuTabMicOnClickListener, false);
            Ensemble.Pages.Editor.UI.UserInput.Buttons.mediaBrowserHome.addEventListener("click", this._mediaBrowserHomeButtonOnClickListener, false);
            Ensemble.Pages.Editor.UI.UserInput.Buttons.mediaBrowserUpOneLevel.addEventListener("click", this._mediaBrowserUpOneLevelButtonOnClickListener, false);
            Ensemble.Pages.Editor.UI.UserInput.Buttons.mediaBrowserRefresh.addEventListener("click", this._mediaBrowserRefreshButtonOnClickListener, false);
            Ensemble.Pages.Editor.UI.UserInput.Buttons.mediaBrowserLocationVideos.addEventListener("click", this._mediaBrowserLocationSelectedOnClickListener, false);
            Ensemble.Pages.Editor.UI.UserInput.Buttons.mediaBrowserLocationMusic.addEventListener("click", this._mediaBrowserLocationSelectedOnClickListener, false);
            Ensemble.Pages.Editor.UI.UserInput.Buttons.mediaBrowserLocationPictures.addEventListener("click", this._mediaBrowserLocationSelectedOnClickListener, false);

            Ensemble.Pages.Editor.UI.UserInput.Boundaries.topBottomSplit.addEventListener("mousedown", this._topBottomSplitMouseDown, false);

            window.addEventListener("resize", this.viewResized, false);
        },

        _detachListeners: function () {
            var editorButtons = Ensemble.Pages.Editor.UI.UserInput.Buttons;
            editorButtons.actionMenu.removeEventListener("click", this._menuButtonOnClickListener, false);
        },

        _menuButtonOnClickListener: function () {
            var menuDialog = Ensemble.Pages.Editor.UI.PageSections.menu.entireSection;
            $(".editorMenuToggleFocused").removeClass("editorMenuToggleFocused");
            if (!$(menuDialog).hasClass("editorMenuDialogVisible")) {
                Ensemble.Pages.Editor.showActionMenu();
            }
            else {
                if (Ensemble.Pages.Editor.currentSubmenu == Ensemble.Pages.Editor.UI.PageSections.menu.actionMenu.entireSection) {
                    Ensemble.Pages.Editor.hideActionMenu();
                }
                else {
                    //Switch to the tab instead.
                    Ensemble.Pages.Editor.currentActionMenuItem.style.display = "inline";
                    Ensemble.Pages.Editor.currentActionMenuItem.style.opacity = 1;

                    Ensemble.Pages.Editor.swapSubmenus(Ensemble.Pages.Editor.currentSubmenu, Ensemble.Pages.Editor.UI.PageSections.menu.actionMenu.entireSection);
                }
            }
        },

        _mediaMenuButtonOnClickListener: function () {
            var menuDialog = Ensemble.Pages.Editor.UI.PageSections.menu.entireSection;
            $(".editorMenuToggleFocused").removeClass("editorMenuToggleFocused");
            if (!$(menuDialog).hasClass("editorMenuDialogVisible")) {
                Ensemble.Pages.Editor.showMediaMenu();
            }
            else {
                if (Ensemble.Pages.Editor.currentSubmenu == Ensemble.Pages.Editor.UI.PageSections.menu.mediaMenu.entireSection) {
                    Ensemble.Pages.Editor.hideActionMenu();
                }
                else {
                    //Switch to the tab instead.
                    Ensemble.Pages.Editor.currentMediaMenuItem.style.display = "flex";
                    Ensemble.Pages.Editor.currentMediaMenuItem.style.opacity = 1;

                    Ensemble.Pages.Editor.swapSubmenus(Ensemble.Pages.Editor.currentSubmenu, Ensemble.Pages.Editor.UI.PageSections.menu.mediaMenu.entireSection);
                }
            }
        },

        _effectsMenuButtonOnClickListener: function () {
            var menuDialog = Ensemble.Pages.Editor.UI.PageSections.menu.entireSection;
            $(".editorMenuToggleFocused").removeClass("editorMenuToggleFocused");
            if (!$(menuDialog).hasClass("editorMenuDialogVisible")) {
                Ensemble.Pages.Editor.showEffectsMenu();
            }
            else {
                if (Ensemble.Pages.Editor.currentSubmenu == Ensemble.Pages.Editor.UI.PageSections.menu.effectsMenu.entireSection) {
                    Ensemble.Pages.Editor.hideActionMenu();
                }
                else {
                    //Switch to the tab instead.
                    Ensemble.Pages.Editor.currentEffectsMenuItem.style.display = "inline";
                    Ensemble.Pages.Editor.currentEffectsMenuItem.style.opacity = 1;

                    Ensemble.Pages.Editor.swapSubmenus(Ensemble.Pages.Editor.currentSubmenu, Ensemble.Pages.Editor.UI.PageSections.menu.effectsMenu.entireSection);
                }
            }
        },

        _mediaBrowserButtonOnClickListener: function () {
            Ensemble.Pages.Editor.UI.UserInput.Flyouts.mediaBrowserLocation.winControl.show(Ensemble.Pages.Editor.UI.UserInput.Buttons.mediaBrowserLocation, "bottom", "left");
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

        _menuHeaderClearActionMenuTabs: function () {
            /// <summary>Clears focus on all menu header tabs across all Editor menus.</summary>
            var allTabs = document.getElementsByClassName("actionMenuTab");
            for (var i = 0; i < allTabs.length; i++) {
                $(allTabs[i]).removeClass("editorMenuRightAdjacentTab");
                $(allTabs[i]).removeClass("editorMenuLeftAdjacentTab");
            }
        },

        _menuHeaderClearMediaMenuTabs: function () {
            /// <summary>Clears focus on all menu header tabs across all Editor menus.</summary>
            var allTabs = document.getElementsByClassName("mediaMenuTab");
            for (var i = 0; i < allTabs.length; i++) {
                $(allTabs[i]).removeClass("editorMenuRightAdjacentTab");
                $(allTabs[i]).removeClass("editorMenuLeftAdjacentTab");
            }
        },

        _menuHeaderFocusTab: function (tabToFocus, itemToShow) {
            /// <summary>Focuses the indicated tab and blurs the tab that was previously focused.</summary>
            /// <param name="tabToFocus" type="HTML Element">The tab to focus.</param>
            /// <param name="itemToShow" type="HTML Element">The menu item to show.</param>

            this._menuHeaderClearActionMenuTabs();

            $(Ensemble.Pages.Editor.currentActionMenuTab).removeClass("editorMenuTabFocused");
            $(Ensemble.Pages.Editor.currentActionMenuTab).addClass("editorMenuTabBlurred");

            Ensemble.Pages.Editor.currentActionMenuTab = tabToFocus;

            $(Ensemble.Pages.Editor.currentActionMenuTab).removeClass("editorMenuTabBlurred");
            $(Ensemble.Pages.Editor.currentActionMenuTab).addClass("editorMenuTabFocused");

            WinJS.UI.Animation.exitContent(Ensemble.Pages.Editor.currentActionMenuItem).done(function () {
                Ensemble.Pages.Editor.currentActionMenuItem.style.display = "none";
                Ensemble.Pages.Editor.currentActionMenuItem = itemToShow;
                Ensemble.Pages.Editor.currentActionMenuItem.style.display = "inline";
                WinJS.UI.Animation.enterContent(Ensemble.Pages.Editor.currentActionMenuItem);
            });
        },

        _mediaMenuHeaderFocusTab: function (tabToFocus, itemToShow) {
            /// <summary>Focuses the indicated tab and blurs the tab that was previously focused.</summary>
            /// <param name="tabToFocus" type="HTML Element">The tab to focus.</param>
            /// <param name="itemToShow" type="HTML Element">The menu item to show.</param>
            this._menuHeaderClearMediaMenuTabs();

            $(Ensemble.Pages.Editor.currentMediaMenuTab).removeClass("editorMenuTabFocused");
            $(Ensemble.Pages.Editor.currentMediaMenuTab).addClass("editorMenuTabBlurred");

            Ensemble.Pages.Editor.currentMediaMenuTab = tabToFocus;

            $(Ensemble.Pages.Editor.currentMediaMenuTab).removeClass("editorMenuTabBlurred");
            $(Ensemble.Pages.Editor.currentMediaMenuTab).addClass("editorMenuTabFocused");

            WinJS.UI.Animation.exitContent(Ensemble.Pages.Editor.currentMediaMenuItem).done(function () {
                Ensemble.Pages.Editor.currentMediaMenuItem.style.display = "none";
                Ensemble.Pages.Editor.currentMediaMenuItem = itemToShow;
                Ensemble.Pages.Editor.currentMediaMenuItem.style.display = "flex";
                WinJS.UI.Animation.enterContent(Ensemble.Pages.Editor.currentMediaMenuItem);
            });
        },

        _mediaMenuTabLocalOnClickListener: function (event) {
            console.log("Clicked the Media Menu Local tab.")
            Ensemble.Pages.Editor.mediaMenuShowLocalTab();
        },

        _mediaMenuTabCameraOnClickListener: function (event) {
            console.log("Clicked the Media Menu Camera tab.")
            Ensemble.Pages.Editor.mediaMenuShowCameraTab();
        },

        _mediaMenuTabMicOnClickListener: function (event) {
            console.log("Clicked the Media Menu Mic tab.")
            Ensemble.Pages.Editor.mediaMenuShowMicTab();
        },

        _mediaBrowserHomeButtonOnClickListener: function (event) {
            console.log("Media Browser navigating home...");
            Ensemble.MediaBrowser.navigateHome();
        },

        _mediaBrowserUpOneLevelButtonOnClickListener: function (event) {
            console.log("Media browser navigating up one level (if possible)...");
            Ensemble.MediaBrowser.upOneLevel();
        },

        _mediaBrowserRefreshButtonOnClickListener: function (event) {
            Ensemble.MediaBrowser.navigateToFolder(Ensemble.MediaBrowser.currentLocation());
        },

        _mediaBrowserLocationSelectedOnClickListener: function (event) {
            switch (event.currentTarget) {
                case Ensemble.Pages.Editor.UI.UserInput.Buttons.mediaBrowserLocationVideos:
                    Ensemble.MediaBrowser.setContext("video");
                    Ensemble.Pages.Editor.UI.UserInput.Buttons.mediaBrowserLocation.innerHTML = "Videos library";
                    break;
                case Ensemble.Pages.Editor.UI.UserInput.Buttons.mediaBrowserLocationMusic:
                    Ensemble.MediaBrowser.setContext("music");
                    Ensemble.Pages.Editor.UI.UserInput.Buttons.mediaBrowserLocation.innerHTML = "Music library";
                    break;
                case Ensemble.Pages.Editor.UI.UserInput.Buttons.mediaBrowserLocationPictures:
                    Ensemble.MediaBrowser.setContext("picture");
                    Ensemble.Pages.Editor.UI.UserInput.Buttons.mediaBrowserLocation.innerHTML = "Pictures library";
                    break;
            }
        }
    });
})();