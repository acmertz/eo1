(function () {
    WinJS.Namespace.define("Ensemble.Session", {
        /// <summary>Provides platform-agnostic interfaces for managing the state and lifecycle of the current application setting.</summary>

        //Name of the page currently visible to the user.
        _currentPage: null,

        projectName: null,
        projectFilename: null,
        projectFile: null,
        projectFileBasicProperties: null,
        projectAspect: null,
        projectDuration: null,
        projectClipCount: null,
        projectTrackCount: null,
        projectDateCreated: null,
        projectDateModified: null,
        projectThumb: null,
        projectResolution: { width: 0, height: 0 },
        projectFileInApp: false,
        refreshRate: 0,
        //projectLoading: false,

        setCurrentPage: function (pageName) {
            /// <summary>Sets the page currently displayed in the application.</summary>
            /// <param name="pageName" type="String">The name of the page. Values other than "mainMenu" and "editor" will generate an exception.</param>
            switch (pageName) {
                case this.PageStates.mainMenu:
                case this.PageStates.loadingToEditor:
                case this.PageStates.editor:
                case this.PageStates.loadingToMainMenu:
                    this._currentPage = pageName;
                    break;
                default:
                    throw new Error("Invalid page name \"" + pageName + "\"");
                    return;
            }
        },

        getCurrentPage: function () {
            /// <summary>Returns the name of the page currently visible to the user.</summary>
            /// <returns type="String" />
            return this._currentPage;
        },

        clearProjectSession: function () {
            /// <summary>Clears project data from the current application session.</summary>
            this.projectName = null;
            this.projectFilename = null;
            this.projectFile = null;
            this.projectAspect = null;
            this.projectDuration = null;
            this.projectClipCount = null;
            this.projectTrackCount = null;
            this.projectDateCreated = null;
            this.projectDateModified = null;
            this.projectFileInApp = false;
        },

        PageStates: {
            mainMenu: "main-menu",
            loadingToEditor: "loading-to-editor",
            editor: "editor",
            loadingToMainMenu: "loading-to-main-menu"
        }
    });
})();