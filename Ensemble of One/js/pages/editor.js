(function () {
    WinJS.Namespace.define("Ensemble.Pages.Editor", {
        /// <summary>Functions used to control the behavior of the Editor page.</summary>

        //// PUBLIC INSTANCE VARIABLES ////
        pendingLoad: null,

        //// PUBLIC METHODS ////
        init: function () {
            /// <summary>Plays the Editor pagelaunch animation and attaches all event listeners.</summary>

            Ensemble.Session.setCurrentPage(Ensemble.Session.PageStates.editor);
            Ensemble.Editor.TimelineMGR.init();
            Ensemble.Editor.PlaybackMGR.init();
            Ensemble.Editor.PanelMGR.init();
            Ensemble.Editor.VideoCaptureMGR.init();
            Ensemble.Editor.AudioCaptureMGR.init();
            Ensemble.Editor.ToolbarMGR.init();

            this._refreshUI();
            this.pendingLoad = null;
        },

        unload: function (pending) {
            /// <summary>Triggers an unload of the project.</summary>
            /// <param name="pending" type="Windows.Storage.StorageFile">Optional. A new project to load after this one has finished unloading.</param>
            Ensemble.Pages.Editor.pendingLoad = pending;
            Ensemble.Navigation.reset();
            if (pending) $(".app-page--loading-editor").removeClass("app-page--hidden");
            else $(".app-page--loading-main-menu").removeClass("app-page--hidden");

            let editorPage = document.getElementsByClassName("app-page--editor")[0];
            $(editorPage).addClass("app-page--exit");
            
            editorPage.addEventListener("animationend", Ensemble.Pages.Editor._listeners.exitAnimationFinished);
            Ensemble.Session.setCurrentPage(Ensemble.Session.PageStates.loadingToMainMenu);

            Ensemble.Editor.VideoCaptureMGR.unload();
            Ensemble.Editor.AudioCaptureMGR.unload();
            Ensemble.Editor.ToolbarMGR.unload();
            Ensemble.Editor.PanelMGR.unload();

            let appView = Windows.UI.ViewManagement.ApplicationView.getForCurrentView();
            appView.title = "";
        },

        refreshCanvasSize: function () {
            wrapWidth = this.ui.canvasContainer.clientWidth,
            wrapHeight = this.ui.canvasContainer.clientHeight - this.ui.playbackToolbar.clientHeight,
            candidateWidth = wrapWidth,
            candidateHeight = Ensemble.Util.AspectGenerator.generateHeight(Ensemble.Session.projectAspect, candidateWidth);

            if (candidateHeight > wrapHeight) {
                candidateHeight = wrapHeight;
                candidateWidth = Ensemble.Util.AspectGenerator.generateWidth(Ensemble.Session.projectAspect, candidateHeight);
            }

            Ensemble.Pages.Editor.ui.canvasSpaceholder.style.width = candidateWidth + "px";
        },

        ui: {
            canvasContainer: null,
            canvasWrap: null,
            canvasSpaceholder: null,
            playbackToolbar: null
        },

        _refreshUI: function () {
            this.ui.canvasContainer = document.querySelector(".editor-canvas-container");
            this.ui.canvasWrap = document.querySelector(".editor-canvas-wrap");
            this.ui.canvasSpaceholder = document.querySelector(".editor-canvas-spaceholder");
            this.ui.playbackToolbar = document.querySelector(".editor-playback-toolbar");

            Ensemble.Pages.Editor.refreshCanvasSize();
            let aspectClass = "";
            switch (Ensemble.Session.projectAspect) {
                case "16:9":
                    aspectClass = "editor-canvas-spaceholder--aspect-16-9";
                    break;
                case "16:10":
                    aspectClass = "editor-canvas-spaceholder--aspect-16-10";
                    break;
                case "2.39:1":
                    aspectClass = "editor-canvas-spaceholder--aspect-239-1";
                    break;
                case "4:3":
                    aspectClass = "editor-canvas-spaceholder--aspect-4-3";
                    break;
            }
            WinJS.Utilities.addClass(this.ui.canvasSpaceholder, aspectClass);

            window.addEventListener("resize", Ensemble.Pages.Editor._listeners.viewResized);
        },

        _cleanUI: function () {
            WinJS.Utilities.removeClass(this.ui.canvasSpaceholder, "editor-canvas-spaceholder--aspect-16-9 editor-canvas-spaceholder--aspect-4-3 editor-canvas-spaceholder--aspect-16-10 editor-canvas-spaceholder--aspect-239-1");
            this.ui.canvasSpaceholder.style.width = "";

            this.ui.canvasContainer = null;
            this.ui.canvasWrap = null;
            this.ui.canvasSpaceholder = null;
            this.ui.playbackToolbar = null;

            window.removeEventListener("resize", Ensemble.Pages.Editor._listeners.viewResized);
        },

        _listeners: {
            exitAnimationFinished: function (event) {
                let editorPage = document.getElementsByClassName("app-page--editor")[0];
                editorPage.removeEventListener("animationend", Ensemble.Pages.Editor._listeners.exitAnimationFinished);
                $(editorPage).removeClass("app-page--exit").addClass("app-page--hidden");
                
                Ensemble.Editor.TimelineMGR.unload();
                Ensemble.Editor.PlaybackMGR.unload();
                Ensemble.HistoryMGR.unload();
                Ensemble.Editor.SelectionMGR.unload();
                Ensemble.Pages.Editor._cleanUI();

                if (Ensemble.Pages.Editor.pendingLoad == null) {
                    setTimeout(function () {
                        let loadingPage = document.getElementsByClassName("app-page--loading-main-menu")[0];
                        $(loadingPage).addClass("app-page--exit");
                        loadingPage.addEventListener("animationend", Ensemble.Pages.Editor._listeners.loadingMenuExitFinished);
                        Ensemble.MainMenu.refreshProjectListView();
                        Ensemble.MainMenu.showSplitviewPane();
                        Ensemble.Session.setCurrentPage(Ensemble.Session.PageStates.mainMenu);
                    }, 1000);
                }
                else {
                    Ensemble.Session.setCurrentPage(Ensemble.Session.PageStates.loadingToEditor);
                    Ensemble.FileIO.loadProject(Ensemble.Pages.Editor.pendingLoad, false);
                }
            },

            loadingMenuExitFinished: function (event) {
                event.currentTarget.removeEventListener("animationend", Ensemble.Pages.Editor._listeners.loadingMenuExitFinished);
                $(event.currentTarget).removeClass("app-page--exit").addClass("app-page--hidden");
            },

            viewResized: _.debounce(function () {
                Ensemble.Pages.Editor.refreshCanvasSize();
            }, 100)
        }
    });
})();