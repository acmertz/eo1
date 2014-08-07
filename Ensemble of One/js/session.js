(function () {
    WinJS.Namespace.define("Ensemble.Session", {
        /// <summary>Provides platform-agnostic interfaces for managing the state and lifecycle of the current application setting.</summary>

        //Name of the page currently visible to the user.
        _currentPage: null,

        setCurrentPage: function (pageName) {
            /// <summary>Sets the page currently displayed in the application.</summary>
            /// <param name="pageName" type="String">The name of the page. Values other than "mainMenu" and "editor" will generate an exception.</param>
            switch (pageName) {
                case "mainMenu":
                    break;
                case "pageName":
                    break;
                default:
                    throw new Error("Invalid page name \"" + pageName + "\"");
                    return;
            }
            this._currentPage = pageName;
        },

        getCurrentPage: function () {
            /// <summary>Returns the name of the page currently visible to the user.</summary>
            /// <returns type="String" />
            return this._currentPage;
        }
    });
})();