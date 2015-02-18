(function () {
    WinJS.Namespace.define("Ensemble.Editor.SelectionMGR", {
        /// <summary>Manages the history state of the current project.</summary>
        selected: [],
        hovering: [],

        init: function () {
            this._refreshUI();
        },

        unload: function () {
            this._cleanUI();
            this.selected = [];
            this.hovering = [];
        },


        addToSelection: function (clipId) {
            /// <summary>Adds the clip with the given ID to the current selection.</summary>
            /// <param name="clipId" type="Number">The ID of the clip.</param>
        },

        removeFromSelection: function (clipId) {
            /// <summary>Removes the clip with the given ID from the current selection.</summary>
            /// <param name="clipId" type="Number">The ID of the clip.</param>
        },

        addToHovering: function (clipId) {
            /// <summary>Adds the clip with the given ID to the current hovering array.</summary>
            /// <param name="clipId" type="Number">The ID of the clip.</param>
            let found = false;
            for (let i = 0; i < this.hovering.length; i++) {
                if (this.hovering[i].id == clipId) {
                    found = true;
                    break;
                }
            }

            if (!found) {
                // selection changing.
                let clip = Ensemble.Editor.TimelineMGR.getClipById(clipId);
                clip.hovering = true;
                this.hovering.push(clip);
                Ensemble.Editor.SelectionMGR._selectionChanged();
            }
        },

        removeFromHovering: function (clipId) {
            /// <summary>Removes the clip with the given ID from the current hovering array.</summary>
            /// <param name="clipId" type="Number">The ID of the clip.</param>
            let found = false;
            let clipIndex = null;
            for (let i = 0; i < this.hovering.length; i++) {
                if (this.hovering[i].id == clipId) {
                    found = true;
                    clipIndex = i;
                    break;
                }
            }

            if (found) {
                // selection changing.
                let clip = this.hovering.splice(clipIndex, 1)[0];
                clip.hovering = false;
                Ensemble.Editor.SelectionMGR._selectionChanged();
            }
        },

        _selectionChanged: function () {
            /// <summary>Used for cleanup/rendering when the selection changes.</summary>
            requestAnimationFrame(Ensemble.Editor.Renderer.renderSingleFrame);
        },

        ui: {

        },

        _refreshUI: function () {

        },

        _cleanUI: function () {

        },

        _listeners: {
            
        }
    });
})();