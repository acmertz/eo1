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
            Ensemble.Pages.Editor._cleanUI();

            let appView = Windows.UI.ViewManagement.ApplicationView.getForCurrentView();
            appView.title = "";
        },

        ui: {
            upperSection: null,
            canvasContainer: null,
            playbackWidget: null
        },

        _refreshUI: function () {
            this.ui.upperSection = document.getElementsByClassName("editor-section--upper")[0];
            this.ui.canvasContainer = document.getElementsByClassName("editor-canvas-container")[0];
            this.ui.playbackWidget = document.getElementsByClassName("editor-playback-widget")[0];

            window.addEventListener("resize", Ensemble.Pages.Editor._listeners.viewResized);
        },

        _cleanUI: function () {
            window.removeEventListener("resize", Ensemble.Pages.Editor._listeners.viewResized);

            this.ui.upperSection = null;
            this.ui.canvasContainer = null;
            this.ui.playbackWidget = null;
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

            viewResized: function () {
                /// <summary>Adjusts the size of all display surfaces to match the change in window dimensions.</summary>
            }
        }
    });
})();