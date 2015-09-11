(function () {
    WinJS.Namespace.define("Ensemble.HistoryMGR", {
        /// <summary>Manages the history state of the current project.</summary>

        _forwardStack: [],
        _backStack: [],
        _pendingAction: null,
        _pendingCallback: null,

        _batchActions: [],
        _batchPos: -1,
        _batchCallback: null,

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

                // Only save and cleanup if the Action is not part of a batch
                if (Ensemble.HistoryMGR._batchPos == -1) {
                    Ensemble.HistoryMGR._forwardStack = [];
                    Ensemble.HistoryMGR.refreshMessage();
                    Ensemble.FileIO.saveProject();
                    Ensemble.Editor.MenuMGR._reevaluateState();
                    if (Ensemble.Editor.SelectionMGR.selected.length == 1) Ensemble.Editor.TimelineMGR.showTrimControls(Ensemble.Editor.SelectionMGR.selected[0]);
                }
                else cb();
            }
        },

        performBatch: function (actions, cb) {
            /// <summary>Performs all of the given actions and saves the project after they have completed.</summary>
            /// <param name="actions" type="Array">An array of Action objects to batch together. Executes them in the given order.</param>
            /// <param name="cb" type="Function">Optional. The callback to execute upon completion of all Actions. Only called in the event that the batch operation was successful.</param>
            this._batchActions = actions;
            this._batchPos = -1;
            this._batchCallback = cb;
            this._performNextBatchAction();
        },

        _performNextBatchAction: function () {
            Ensemble.HistoryMGR._batchPos++;
            if (Ensemble.HistoryMGR._batchPos < Ensemble.HistoryMGR._batchActions.length) Ensemble.HistoryMGR.performAction(
                Ensemble.HistoryMGR._batchActions[Ensemble.HistoryMGR._batchPos],
                Ensemble.HistoryMGR._performNextBatchAction
            );
            else {
                // no more actions in the current batch.
                Ensemble.HistoryMGR._batchPos = -1;
                Ensemble.HistoryMGR._batchActions = [];
                Ensemble.HistoryMGR._batchCallback();
                Ensemble.HistoryMGR._batchCallback = null;
                Ensemble.FileIO.saveProject();
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
            if (Ensemble.HistoryMGR._batchPos == -1) {
                Ensemble.HistoryMGR._forwardStack = [];
                Ensemble.HistoryMGR.refreshMessage();
                Ensemble.Editor.MenuMGR._reevaluateState();
                Ensemble.Editor.TimelineMGR.refreshClipVolumeModifiers();
                Ensemble.FileIO.saveProject();
            }
            if (Ensemble.HistoryMGR._pendingCallback && Ensemble.HistoryMGR._pendingCallback != null) {
                let tempCb = Ensemble.HistoryMGR._pendingCallback;
                Ensemble.HistoryMGR._pendingCallback = null;
                tempCb();
            }
        },

        _undoRemoveTrackComplete: function (loadedClips) {
            Ensemble.HistoryMGR._pendingAction.finishUndo(loadedClips);
            Ensemble.HistoryMGR._forwardStack.push(Ensemble.HistoryMGR._pendingAction);
            Ensemble.Editor.MenuMGR._reevaluateState();
            Ensemble.HistoryMGR._pendingAction = null;
            Ensemble.FileIO.saveProject();
        },

        _undoRemoveClipComplete: function (loadedClips) {
            Ensemble.HistoryMGR._pendingAction.finishUndo(loadedClips);
            Ensemble.HistoryMGR._forwardStack.push(Ensemble.HistoryMGR._pendingAction);
            Ensemble.Editor.MenuMGR._reevaluateState();
            Ensemble.HistoryMGR._pendingAction = null;
            Ensemble.Editor.TimelineMGR.refreshClipVolumeModifiers();
            Ensemble.FileIO.saveProject();
        },

        undoLast: function () {
            if (Ensemble.HistoryMGR._backStack.length > 0) {
                var actionToUndo = Ensemble.HistoryMGR._backStack.pop();

                if (actionToUndo.isCompound(true)) {
                    this._pendingAction = actionToUndo;
                    this._pendingAction.undo();
                }

                else {
                    actionToUndo.undo();
                    this._forwardStack.push(actionToUndo);
                    this.refreshMessage();
                    Ensemble.FileIO.saveProject();
                }
                Ensemble.Editor.MenuMGR._reevaluateState();
                if (Ensemble.Editor.SelectionMGR.selected.length == 1) Ensemble.Editor.TimelineMGR.showTrimControls(Ensemble.Editor.SelectionMGR.selected[0]);
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
                    this.refreshMessage();
                    setTimeout(function () { Ensemble.FileIO.saveProject(); }, 0);
                }
                Ensemble.Editor.MenuMGR._reevaluateState();
                if (Ensemble.Editor.SelectionMGR.selected.length == 1) Ensemble.Editor.TimelineMGR.showTrimControls(Ensemble.Editor.SelectionMGR.selected[0]);
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
        },

        refreshMessage: function () {
            /// <summary>Refreshes the recent action message in the Editor.</summary>
            if (this._backStack.length > 0) {
                document.getElementById("editor-history-msg").innerText = this._backStack[this._backStack.length - 1].getMessage();
            }
            else document.getElementById("editor-history-msg").innerText = "No recent history. Start editing!";
        },

        unload: function () {
            /// <summary>Resets the HistoryMGR back to its original state.</summary>
            this._forwardStack = [];
            this._backStack = [];
            this._pendingAction = null;
            this._pendingCallback = null;
        }
    });
})();