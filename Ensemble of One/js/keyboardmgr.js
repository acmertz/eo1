(function () {
    WinJS.Namespace.define("Ensemble.KeyboardMGR", {
        /// <summary>Provides a set of functions to help manage keyboard shortcuts in conjunction with app state.</summary>
        off: function () {
            $(window).unbind("keydown");
        },

        mainMenuDefault: function () {
            /// <summary>Starts listeners for Ctrl+N and Ctrl+O.</summary>
            $(window).unbind("keydown");
            $(window).keydown(this._handleMainMenuKeydown);           
        },

        _handleMainMenuKeydown: function (event) {
            if (event.ctrlKey && (!event.shiftKey)) {
                var key = String.fromCharCode(event.keyCode);
                switch (key) {
                    case "N":
                        Ensemble.Pages.MainMenu.showNewProjectDialog();
                        break;
                    case "O":
                        Ensemble.FileIO.enumerateProjects(Ensemble.Pages.MainMenu.showOpenProjectDialog);
                        break;
                }
            }
        },

        mainMenuOpenProjectDialog: function () {
            $(window).unbind("keydown");
            $(window).keydown(this._handleOpenProjectDialogKeydown);
        },

        _handleOpenProjectDialogKeydown: function (event) {
            if (event.ctrlKey && (!event.shiftKey)) {
                var key = String.fromCharCode(event.keyCode);
                switch (key) {
                    case "N":
                        Ensemble.Pages.MainMenu.hideOpenProjectDialog();
                        Ensemble.Pages.MainMenu.showNewProjectDialog();
                        break;
                }
            }
            else {
                switch (event.keyCode) {
                    case 27:
                        Ensemble.Pages.MainMenu.hideOpenProjectDialog();
                        break;
                }
            }
        },

        mainMenuNewProjectDialog: function () {
            $(window).unbind("keydown");
            $(window).keydown(this._handleNewProjectDialogKeydown);
        },

        _handleNewProjectDialogKeydown: function () {
            if (event.ctrlKey && (!event.shiftKey)) {
                var key = String.fromCharCode(event.keyCode);
                switch (key) {
                    case "O":
                        Ensemble.Pages.MainMenu.hideNewProjectDialog();
                        Ensemble.FileIO.enumerateProjects(Ensemble.Pages.MainMenu.showOpenProjectDialog);
                        break;
                }
            }
            else {
                switch (event.keyCode) {
                    case 27:
                        Ensemble.Pages.MainMenu.hideNewProjectDialog();
                        break;
                }
            }
        },

        editorDefault: function () {
            $(window).unbind("keydown");
            $(window).keydown(this._handleEditorKeydown);
        },

        _handleEditorKeydown: function (event) {
            if (event.ctrlKey && (!event.shiftKey)) {
                var key = String.fromCharCode(event.keyCode);
                switch (key) {
                    case "Z":
                        Ensemble.HistoryMGR.undoLast();
                        break;
                    case "Y":
                        Ensemble.HistoryMGR.redoNext();
                }
            }
        },

        editorActionMenu: function () {
            $(window).unbind("keydown");
            $(window).keydown(this._handleEditorMenuKeydown);
        },

        _handleEditorMenuKeydown: function (event) {
            switch (event.keyCode) {
                case 27:
                    Ensemble.Pages.Editor.hideActionMenu();
                    break;
            }
        }

    });
})();