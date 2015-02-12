(function () {
    WinJS.Namespace.define("Ensemble.HistoryMGR", {
        /// <summary>Manages the history state of the current project.</summary>

        _forwardStack: [],
        _backStack: [],
        _pendingAction: null,
        _pendingCallback: null,

        performAction: function (action, cb) {
            /// <summary>Adds an action to the history stack and performs the action.</summary>
            /// <param name="action" type="Ensemble.Events.Action">The action to perform.</param>
            /// <param name="cb" type="Function">Optional. The callback to execute upon completion of the Action.</param>
            if (action.isCompound()) {
                this._pendingAction = action;
                this._pendingCallback = cb;
                this._pendingAction.performAction();
            }

            else {
                action.performAction();
                Ensemble.HistoryMGR._backStack.push(action);
                Ensemble.HistoryMGR._forwardStack = [];
                setTimeout(function () { Ensemble.FileIO.saveProject(); }, 0);
            }
        },

        _importActionCompleted: function (params, metadata) {
            params.file.bitrate = metadata.bitrate;
            params.file.duration = metadata.duration;
            params.file.height = metadata.height;
            params.file.width = metadata.width;
            params.file.title = metadata.title;
            Ensemble.HistoryMGR._pendingAction.finish(params);
            Ensemble.HistoryMGR._backStack.push(Ensemble.HistoryMGR._pendingAction);
            Ensemble.HistoryMGR._forwardStack = [];
            if (Ensemble.HistoryMGR._pendingCallback && Ensemble.HistoryMGR._pendingCallback != null) {
                Ensemble.HistoryMGR._pendingCallback();
                Ensemble.HistoryMGR._pendingCallback = null;
            }
            setTimeout(function () { Ensemble.FileIO.saveProject(); }, 0);
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

                if (actionToRedo.isCompound()) {
                    this._pendingAction = actionToRedo;
                    this._pendingAction.performAction();
                }

                else {
                    actionToRedo.performAction();
                    this._backStack.push(actionToRedo);
                    setTimeout(function () { Ensemble.FileIO.saveProject(); }, 0);
                }
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