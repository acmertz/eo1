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

        replaceSelection: function (clipId) {
            /// <summary>Removes all clips from the current selection array except for the clip with the given ID.</summary>
            /// <param name="clipId" type="Number">The ID of the clip.</param>
            let needFrame = false;
            let found = false;
            for (let i = 0; i < this.selected.length; i++) {
                if (this.selected[i] == clipId) {
                    // clip already hovering.
                    found = true;
                }
                if (this.selected[i] != clipId) {
                    Ensemble.Editor.TimelineMGR.getClipById(this.selected[i]).selected = false;
                    $("#" + Ensemble.Editor.TimelineMGR._buildClipDOMId(this.selected[i])).removeClass("timeline-clip--selected");
                    needFrame = true;
                }
            }

            if (!found) {
                needFrame = true;
                Ensemble.Editor.TimelineMGR.getClipById(clipId).selected = true;
                $("#" + Ensemble.Editor.TimelineMGR._buildClipDOMId(clipId)).addClass("timeline-clip--selected");
                console.log("Selected clip " + clipId + ".");
            }
            this.selected = [];
            this.selected.push(clipId);

            if (needFrame) Ensemble.Editor.Renderer.requestFrame();

            Ensemble.Editor.MenuMGR._reevaluateState();
        },

        clearSelection: function () {
            /// <summary>Clears the list of selected clips.</summary>

            $(Ensemble.Editor.TimelineMGR._trimGripperArr).remove();
            $(Ensemble.Editor.TimelineMGR._ghostDragArr).remove();

            Ensemble.Editor.TimelineMGR._trimGripperArr = [];
            Ensemble.Editor.TimelineMGR._clipDragArr = [];
            Ensemble.Editor.TimelineMGR._ghostDragArr = [];

            let needFrame = false;
            if (this.selected.length > 0) needFrame = true;
            for (let i = 0; i < this.selected.length; i++) {
                Ensemble.Editor.TimelineMGR.getClipById(this.selected[i]).selected = false;
                $("#" + Ensemble.Editor.TimelineMGR._buildClipDOMId(this.selected[i])).removeClass("timeline-clip--selected");
            }
            this.selected = [];
            if (needFrame) Ensemble.Editor.Renderer.requestFrame();
            Ensemble.Editor.MenuMGR._reevaluateState();
            console.log("Cleared selection.");
        },

        addToHovering: function (clipId, clip) {
            /// <summary>Adds the clip with the given ID to the current hovering array.</summary>
            /// <param name="clipId" type="Number">The ID of the clip.</param>
            /// <param name="clip" type="Ensemble.Editor.Clip">Optional. A reference to the clip. Used in place of searching for a clip.</param>
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
                $("#" + Ensemble.Editor.TimelineMGR._buildClipDOMId(clipId)).addClass("timeline-clip--hovering");
                Ensemble.Editor.Renderer.requestFrame();
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
                $("#" + Ensemble.Editor.TimelineMGR._buildClipDOMId(clipId)).removeClass("timeline-clip--hovering");
                Ensemble.Editor.Renderer.requestFrame();
            }
        },

        clearHovering: function () {
            /// <summary>Clears the list of hovering clips.</summary>
            let needFrame = false;
            if (this.hovering.length > 0) needFrame = true;
            for (let i = 0; i < this.hovering.length; i++) {
                Ensemble.Editor.TimelineMGR.getClipById(this.hovering[i]).hovering = false;
                $("#" + Ensemble.Editor.TimelineMGR._buildClipDOMId(this.hovering[i])).removeClass("timeline-clip--hovering");
            }
            this.hovering = [];
            if (needFrame) Ensemble.Editor.Renderer.requestFrame();
        },

        replaceHovering: function (clipId) {
            /// <summary>Removes all clips from the current hovering array except for the clip with the given ID.</summary>
            /// <param name="clipId" type="Number">The ID of the clip.</param>
            let needFrame = false;
            let found = false;
            for (let i = 0; i < this.hovering.length; i++) {
                if (this.hovering[i] == clipId) {
                    // clip already hovering.
                    found = true;
                }
                if (this.hovering[i] != clipId) {
                    Ensemble.Editor.TimelineMGR.getClipById(this.hovering[i]).hovering = false;
                    $("#" + Ensemble.Editor.TimelineMGR._buildClipDOMId(this.hovering[i])).removeClass("timeline-clip--hovering");
                    needFrame = true;
                }
            }

            if (!found) {
                needFrame = true;
                Ensemble.Editor.TimelineMGR.getClipById(clipId).hovering = true;
                $("#" + Ensemble.Editor.TimelineMGR._buildClipDOMId(clipId)).addClass("timeline-clip--hovering");
            }
            this.hovering = [];
            this.hovering.push(clipId);

            if (needFrame) Ensemble.Editor.Renderer.requestFrame();
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