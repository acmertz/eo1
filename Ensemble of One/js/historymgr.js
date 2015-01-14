(function () {
    WinJS.Namespace.define("Ensemble.HistoryMGR", {
        /// <summary>Manages the history state of the current project.</summary>

        _forwardStack: [],
        _backStack: [],

        performAction: function (action) {
            /// <summary>Adds an action to the history stack and performs the action.</summary>
            /// <param name="action" type="Ensemble.Events.Action">The action to perform.</param>
            action.performAction();
            Ensemble.HistoryMGR._backStack.push(action);
            Ensemble.HistoryMGR._forwardStack = [];
            setTimeout(function () { Ensemble.FileIO.saveProject(); }, 0);
        },

        createActionFromXML: function (historyType, xml) {
            /// <summary>Creates and saves (but does not execute) an Action based on the given XML object.</summary>
            /// <param name="historyType" type="String">The type of history Action. Must be one of "undo" or "redo".</param>
            /// <param name="xml">An XML object representing the root node of the Action as it is represented in the .eo1 file format.</param>
        },

        undoLast: function () {
            if (Ensemble.HistoryMGR._backStack.length > 0) {
                var actionToUndo = Ensemble.HistoryMGR._backStack.pop();
                actionToUndo.undo();
                this._forwardStack.push(actionToUndo);
                setTimeout(function () { Ensemble.FileIO.saveProject(); }, 0);
            }
        },

        redoNext: function () {
            if (Ensemble.HistoryMGR._forwardStack.length > 0) {
                var actionToRedo = Ensemble.HistoryMGR._forwardStack.pop();
                actionToRedo.performAction();
                this._backStack.push(actionToRedo);
                setTimeout(function () { Ensemble.FileIO.saveProject(); }, 0);
            }
        },

        canUndo: function () {
            /// <summary>Returns whether or not an undo operation can currently be performed.</summary>
            /// <returns type="Boolean">A value indicating whether or not an undo operation can currently be performed.</returns>
            return (Ensemble.HistoryMGR._backStack.length > 0);
        },

        canRedo: function () {
            /// <summary>Returns whether or not a redo operation can currently be performed.</summary>
            /// <returns type="Boolean">A value indicating whether or not a redo operation can currently be performed.</returns>
            return (Ensemble.HistoryMGR._forwardStack.length > 0);
        }
    });
})();