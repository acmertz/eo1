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
        },

        undoLast: function () {
            if (Ensemble.HistoryMGR._backStack.length > 0) {
                var actionToUndo = Ensemble.HistoryMGR._backStack.pop();
                actionToUndo.undo();
            }
        },

        redoNext: function () {

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