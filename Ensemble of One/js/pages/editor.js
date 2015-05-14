(function () {
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

            Ensemble.Editor.TimelineMGR.init();
            Ensemble.Editor.PlaybackMGR.init();
            Ensemble.Editor.Renderer.init();
            Ensemble.Editor.TimelineMGR._rebuildIndex();
            Ensemble.Editor.Renderer.renderSingleFrame();
            Ensemble.HistoryMGR.refreshMessage();
            Ensemble.Editor.MenuMGR.init();
            Ensemble.Editor.CalloutMGR.init();
            Ensemble.MediaBrowser.init();

            //Perform UI setup operations (project name, thumbnail, etc.)
            var projectSubmenu = Ensemble.Editor.UI.PageSections.menu.actionMenu.project;
            projectSubmenu.nameDisplay.innerText = Ensemble.Session.projectName;
            projectSubmenu.durationDisplay.innerText = Ensemble.Utilities.TimeConverter.verboseTime(Ensemble.Session.projectDuration);
            projectSubmenu.numberOfTracksDisplay.innerText = Ensemble.Session.projectTrackCount.toString();
            projectSubmenu.numberOfClipsDisplay.innerText = Ensemble.Session.projectClipCount.toString();
            projectSubmenu.aspectRatioDisplay.innerText = Ensemble.Session.projectAspect;

            $("#editorPageContainer").removeClass("pageContainerHidden");

            //Update the Editor with the current settings
            //this.layoutInterfaceToSplitpoint(Ensemble.Settings.getEditorDividerPosition() * window.innerHeight);
            Ensemble.Editor.TimelineMGR.newRulerScale();            

            this.currentActionMenuItem = document.getElementById("editorMenuContentProject");
            this.currentActionMenuTab = document.getElementById("editorMenuTabProject");
            this.currentMediaMenuItem = document.getElementById("editorMediaMenuContentLocal");
            this.currentMediaMenuTab = Ensemble.Editor.UI.UserInput.Buttons.mediaMenuTabLocal;
            this.currentEffectsMenuItem = document.getElementById("editorEffectsMenuContentEffects");
            this.currentEffectsMenuTab = null;
            this._attachListeners();

            //$("#projectLoadingPageContainer").removeClass("loadingPageVisible");
            //$("#projectLoadingPageContainer").addClass("loadingPageHidden");
        },

        unload: function () {
            /// <summary>Triggers an unload of the project.</summary>
            console.log("Hiding editor...");
            $("#projectClosingPageContainer").removeClass("loadingPageHidden");
            $("#projectClosingPageContainer").addClass("loadingPageVisible");
            window.setTimeout(function () {
                $("#editorPageContainer").addClass("pageContainerHidden");
                Ensemble.Pages.Editor._detachListeners();
                console.log("Unloading project...");

                Ensemble.Editor.MenuMGR.closeMenu();

                Ensemble.Editor.TimelineMGR.unload();
                Ensemble.Editor.PlaybackMGR.unload();
                Ensemble.Editor.Renderer.unload();
                Ensemble.Editor.MenuMGR.unload();
                Ensemble.HistoryMGR.unload();
                Ensemble.Editor.SelectionMGR.unload();
                Ensemble.Editor.CalloutMGR.unload();
                Ensemble.MediaBrowser.unload();

                window.setTimeout(function () {
                    $("#imgMainLogo").css("display", "initial");
                    $("#projectClosingPageContainer").removeClass("loadingPageVisible");
                    $("#projectClosingPageContainer").addClass("loadingPageHidden");
                    Ensemble.Pages.MainMenu.showInitial();
                }, 500);
            }, 500);
        },

        viewResized: function () {
            /// <summary>Adjusts the size of all display surfaces to match the change in window dimensions.</summary>

            //Main display canvas
            var maxWidth = window.innerWidth;
            var maxHeight = Ensemble.Editor.UI.PageSections.upperHalf.canvasContainer.clientHeight;

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

            Ensemble.Editor.UI.PageSections.upperHalf.canvasAndControls.style.width = finalWidth + "px";
            Ensemble.Editor.UI.RenderSurfaces.mainCanvas.style.height = finalHeight + "px";
            try { Ensemble.Editor.Renderer.canvasResized(); }
            catch (exception) { }
            Ensemble.Editor.TimelineMGR.updateTrackSizing();
        },

        //uiSplitpointDragBegin: function (screenOffsetY, splitpointOffsetY) {
        //    /// <summary>Begins a drag operation on the main UI splitpoint.</summary>
        //    /// <param name="screenOffsetY" type="Number">The offset in pixels from the top of the screen that the mousedown occurred.</param>
        //    /// <param name="splitpointOffsetY" type="Number">The offset in pixels from the top of the splitpoint element that the mousedown occurred.</param>
        //    this._screenClickOffsetY = screenOffsetY;
        //    this._uiSplitpointMousedownOffsetY = splitpointOffsetY;
        //    $(Ensemble.Editor.UI.UserInput.Boundaries.topBottomSplit).addClass("zIndexTop");
        //    $(Ensemble.Editor.UI.UserInput.ClickEaters.splitpoint).removeClass("editorClickEaterFaded");
        //    Ensemble.Editor.UI.UserInput.Boundaries.topBottomSplit.removeEventListener("mousedown", this._topBottomSplitMouseDown, false);
        //    document.addEventListener("mousemove", this._topBottomSplitDragMove, false);
        //    document.addEventListener("mouseup", this._topBottomSplitDragEnd, false);
        //    this.uiSplitpointDraggedTo(screenOffsetY);
        //},

        //uiSplitpointDraggedTo: function (yPosition) {
        //    /// <summary>Begins a drag operation on the main UI splitpoint.</summary>
        //    /// <param name="yPosition" type="Number">The new Y coordinate of the splitpoint.</param>

        //    // TODO: support vendor-specific transform functions
        //    Ensemble.Editor.UI.UserInput.Boundaries.topBottomSplit.style.transform = "translateY(" + (yPosition - this._screenClickOffsetY - this._uiSplitpointMousedownOffsetY) + "px)";
        //},

        //uiSplitpointDragEnd: function (yPosition) {
        //    /// <summary>Finshes a drag operation on the main UI splitpoint.</summary>
        //    /// <param name="yPosition" type="Number">The final Y coordinate of the splitpoint.</param>
        //    document.removeEventListener("mousemove", this._topBottomSplitDragMove, false);
        //    document.removeEventListener("mouseup", this._topBottomSplitDragEnd, false);
        //    Ensemble.Editor.UI.UserInput.Boundaries.topBottomSplit.addEventListener("mousedown", this._topBottomSplitMouseDown, false);

        //    $(Ensemble.Editor.UI.UserInput.Boundaries.topBottomSplit).removeClass("zIndexTop");
        //    $(Ensemble.Editor.UI.UserInput.ClickEaters.splitpoint).addClass("editorClickEaterFaded");

        //    this.layoutInterfaceToSplitpoint(yPosition);
        //    Ensemble.Settings.setEditorDividerPosition(yPosition / window.innerHeight);
        //},

        //layoutInterfaceToSplitpoint: function (yPosition) {
        //    /// <summary>Sets the UI splitpoint to the specified position and lays out the UI around it.</summary>
        //    /// <param name="yPosition" type="Number">The Y coordinate in pixels representing the splitpoint's position.</param>

        //    // TODO: support vendor-specific transform functions
        //    Ensemble.Editor.UI.UserInput.Boundaries.topBottomSplit.style.transform = "";
        //    var topFlex = yPosition / window.innerHeight;
        //    var bottomFlex = (window.innerHeight - (yPosition + Ensemble.Editor.UI.UserInput.Boundaries.topBottomSplit.clientHeight)) / window.innerHeight;

        //    Ensemble.Editor.UI.PageSections.upperHalf.entireSection.style.flex = topFlex;
        //    Ensemble.Editor.UI.PageSections.lowerHalf.entireSection.style.flex = bottomFlex;
        //    this.viewResized();
        //},

        refreshMediaBrowser: function () {
            /// <summary>Refreshes the Media Browser at its current location</summary>
            console.log("Refreshing the Media Browser...");
            Ensemble.MediaBrowser.navigateToFolder(Ensemble.MediaBrowser.currentLocation());
        },

        //// PRIVATE METHODS ////

        _attachListeners: function () {
            //Media Browser commands
            $(Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserLocation).click(this._mediaBrowserButtonOnClickListener);
            $(Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserHome).click(this._mediaBrowserHomeButtonOnClickListener);
            $(Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserUpOneLevel).click(this._mediaBrowserUpOneLevelButtonOnClickListener);
            $(Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserRefresh).click(this._mediaBrowserRefreshButtonOnClickListener);
            $(Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserLocationVideos).click(this._mediaBrowserLocationSelectedOnClickListener);
            $(Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserLocationMusic).click(this._mediaBrowserLocationSelectedOnClickListener);
            $(Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserLocationPictures).click(this._mediaBrowserLocationSelectedOnClickListener);

            //Other
            $(Ensemble.Editor.UI.UserInput.Boundaries.topBottomSplit).mousedown(this._topBottomSplitMouseDown);

            window.addEventListener("resize", Ensemble.Pages.Editor.viewResized);

            Ensemble.KeyboardMGR.editorDefault();
        },

        _detachListeners: function () {
            //Media Browser commands
            $(Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserLocation).unbind("click");
            $(Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserHome).unbind("click");
            $(Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserUpOneLevel).unbind("click");
            $(Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserRefresh).unbind("click");
            $(Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserLocationVideos).unbind("click");
            $(Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserLocationMusic).unbind("click");
            $(Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserLocationPictures).unbind("click");

            //Other
            $(Ensemble.Editor.UI.UserInput.Boundaries.topBottomSplit).unbind("mousedown");

            window.removeEventListener("resize", Ensemble.Pages.Editor.viewResized);

            Ensemble.KeyboardMGR.off();
        },

        _mediaBrowserButtonOnClickListener: function () {
            Ensemble.Editor.UI.UserInput.Flyouts.mediaBrowserLocation.winControl.show(Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserLocation, "bottom", "left");
        },

        _menuClickEaterOnClickListener: function () {
            Ensemble.Pages.Editor.hideActionMenu();
        },

        _topBottomSplitMouseDown: function (event) {
            //console.log("Mouse down on UI splitpoint at screen Y coordinate of " + event.clientY + " and top offset of " + event.offsetY);
            Ensemble.Pages.Editor.uiSplitpointDragBegin(event.clientY, 0); //replaced event.offsetY with 0
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
                Ensemble.Pages.Editor.currentActionMenuItem.style.display = "flex"; //changed from inline
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
                case Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserLocationVideos:
                    Ensemble.MediaBrowser.setContext("video");
                    Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserLocation.innerHTML = "Videos library";
                    break;
                case Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserLocationMusic:
                    Ensemble.MediaBrowser.setContext("music");
                    Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserLocation.innerHTML = "Music library";
                    break;
                case Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserLocationPictures:
                    Ensemble.MediaBrowser.setContext("picture");
                    Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserLocation.innerHTML = "Pictures library";
                    break;
            }
        }
    });
})();