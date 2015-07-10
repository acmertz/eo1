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

        init: function () {
            /// <summary>Plays the Editor pagelaunch animation and attaches all event listeners.</summary>

            Ensemble.Editor.TimelineMGR.init();
            Ensemble.Editor.PlaybackMGR.init();
            Ensemble.Editor.Renderer.init();
            Ensemble.Editor.TimelineMGR._rebuildIndex();
            Ensemble.Editor.Renderer.renderSingleFrame();
            Ensemble.HistoryMGR.refreshMessage();
            Ensemble.Editor.MenuMGR.init();
            Ensemble.Editor.CalloutMGR.init();
            Ensemble.Editor.MediaBrowser.init();

            //Perform UI setup operations (project name, thumbnail, etc.)
            var projectSubmenu = Ensemble.Editor.UI.PageSections.menu.actionMenu.project;
            projectSubmenu.nameDisplay.innerText = Ensemble.Session.projectName;
            projectSubmenu.durationDisplay.innerText = Ensemble.Utilities.TimeConverter.verboseTime(Ensemble.Session.projectDuration);
            projectSubmenu.numberOfTracksDisplay.innerText = Ensemble.Session.projectTrackCount.toString();
            projectSubmenu.numberOfClipsDisplay.innerText = Ensemble.Session.projectClipCount.toString();
            projectSubmenu.aspectRatioDisplay.innerText = Ensemble.Session.projectAspect;

            //Update the Editor with the current settings
            Ensemble.Editor.TimelineMGR.newRulerScale();            

            this.currentActionMenuItem = document.getElementById("editorMenuContentProject");
            this.currentActionMenuTab = document.getElementById("editorMenuTabProject");
            this.currentMediaMenuItem = document.getElementById("editorMediaMenuContentLocal");
            this.currentMediaMenuTab = Ensemble.Editor.UI.UserInput.Buttons.mediaMenuTabLocal;
            this.currentEffectsMenuItem = document.getElementById("editorEffectsMenuContentEffects");
            this.currentEffectsMenuTab = null;
            this._refreshUI();

            Ensemble.Pages.Editor.viewResized();
            Ensemble.Editor.PlaybackMGR.seek(500);
            Ensemble.Editor.PlaybackMGR.seek(0);
            for (let i = 0; i < 120; i++) {
                Ensemble.Editor.Renderer.requestFrame();
            }
        },

        unload: function (event) {
            /// <summary>Triggers an unload of the project.</summary>
            /// <param name="event" type="Object">An optional event object. If passed, the Editor will assume its menu is closed and play an alternate animation instead.</param>
            Ensemble.Navigation.reset();
            $(".app-page--loading-main-menu").removeClass("app-page--hidden");

            let editorPage = document.getElementsByClassName("app-page--editor")[0];
            if ($(editorPage).hasClass("app-page--displace")) {
                $(editorPage).removeClass("app-page--displace").removeClass("app-page--displace-right-320").addClass("app-page--exit-right-from-displace-320");
            }
            else {
                $(editorPage).addClass("app-page--exit-right");
            }
            
            editorPage.addEventListener("animationend", Ensemble.Pages.Editor._listeners.exitAnimationFinished);

            Ensemble.Editor.MenuMGR.closeMenu();
            Ensemble.Editor.MenuMGR.unload();

            let appView = Windows.UI.ViewManagement.ApplicationView.getForCurrentView();
            appView.title = "";
        },

        ui: {

        },

        _refreshUI: function () {
            $(Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserLocation).click(this._mediaBrowserButtonOnClickListener);
            $(Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserHome).click(this._mediaBrowserHomeButtonOnClickListener);
            $(Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserUpOneLevel).click(this._mediaBrowserUpOneLevelButtonOnClickListener);
            $(Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserRefresh).click(this._mediaBrowserRefreshButtonOnClickListener);

            window.addEventListener("resize", Ensemble.Pages.Editor.viewResized);
        },

        _cleanUI: function () {
            //Media Browser commands
            $(Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserLocation).unbind("click");
            $(Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserHome).unbind("click");
            $(Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserUpOneLevel).unbind("click");
            $(Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserRefresh).unbind("click");

            window.removeEventListener("resize", Ensemble.Pages.Editor.viewResized);
        },

        _listeners: {
            exitAnimationFinished: function (event) {
                let editorPage = document.getElementsByClassName("app-page--editor")[0];
                editorPage.removeEventListener("animationend", Ensemble.Pages.Editor._listeners.exitAnimationFinished);
                $(editorPage).removeClass("app-page--exit-right-from-displace-320").removeClass("app-page--exit-right").addClass("app-page--hidden");
                
                Ensemble.Editor.TimelineMGR.unload();
                Ensemble.Editor.PlaybackMGR.unload();
                Ensemble.Editor.Renderer.unload();
                Ensemble.HistoryMGR.unload();
                Ensemble.Editor.SelectionMGR.unload();
                Ensemble.Editor.CalloutMGR.unload();
                Ensemble.Editor.MediaBrowser.unload();

                Ensemble.Pages.Editor._cleanUI();

                setTimeout(function () {
                    let loadingPage = document.getElementsByClassName("app-page--loading-main-menu")[0];
                    $(loadingPage).addClass("app-page--exit-right");
                    loadingPage.addEventListener("animationend", Ensemble.Pages.Editor._listeners.loadingMenuExitFinished);
                    Ensemble.FileIO.enumerateLocalProjects(Ensemble.MainMenu._listeners.enumeratedLocalProjects);
                    Ensemble.FileIO.enumerateRecentProjects(Ensemble.MainMenu._listeners.enumeratedRecentProjects);
                }, 1000);
            },

            loadingMenuExitFinished: function (event) {
                event.currentTarget.removeEventListener("animationend", Ensemble.Pages.Editor._listeners.loadingMenuExitFinished);
                $(event.currentTarget).removeClass("app-page--exit-right").addClass("app-page--hidden");
            }
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

            //Ensemble.Editor.UI.PageSections.upperHalf.canvasAndControls.style.width = finalWidth + "px";
            Ensemble.Editor.UI.PageSections.upperHalf.canvasContainer.style.width = finalWidth + "px";
            Ensemble.Editor.UI.RenderSurfaces.mainCanvas.style.height = finalHeight + "px";
            try { Ensemble.Editor.Renderer.canvasResized(); }
            catch (exception) { }
            Ensemble.Editor.TimelineMGR.updateTrackSizing();
        },

        refreshMediaBrowser: function () {
            /// <summary>Refreshes the Media Browser at its current location</summary>
            console.log("Refreshing the Media Browser...");
            Ensemble.Editor.MediaBrowser.navigateToFolder(Ensemble.Editor.MediaBrowser.currentLocation());
        },

        //// PRIVATE METHODS ////
        _mediaBrowserButtonOnClickListener: function () {
            Ensemble.Editor.UI.UserInput.Flyouts.mediaBrowserLocation.winControl.show(Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserLocation, "bottom", "left");
        },

        _menuClickEaterOnClickListener: function () {
            Ensemble.Pages.Editor.hideActionMenu();
        },

        _mediaBrowserHomeButtonOnClickListener: function (event) {
            console.log("Media Browser navigating home...");
            Ensemble.Editor.MediaBrowser.navigateHome();
        },

        _mediaBrowserUpOneLevelButtonOnClickListener: function (event) {
            console.log("Media browser navigating up one level (if possible)...");
            Ensemble.Editor.MediaBrowser.upOneLevel();
        },

        _mediaBrowserRefreshButtonOnClickListener: function (event) {
            Ensemble.Editor.MediaBrowser.navigateToFolder(Ensemble.Editor.MediaBrowser.currentLocation());
        }
    });
})();