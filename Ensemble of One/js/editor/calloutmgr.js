(function () {
    WinJS.Namespace.define("Ensemble.Editor.CalloutMGR", {
        /// <summary>Used to control the callout that appears in the Editor timeline.</summary>

        calloutVisible: false,

        init: function () {
            this._refreshUI();
        },

        unload: function () {
            this._cleanUI();
            this.calloutVisible = false;
        },

        show: function (clipId, event) {
            /// <summary>Shows the standard callout for the clip with the given ID.</summary>
            /// <param name="clipId" type="Number">The ID of the clip.</param>
            /// <param name="event" type="Event">An event containing coordinates near which to show the callout.</param>

            Ensemble.Editor.CalloutMGR.calloutVisible = true;
            Ensemble.Editor.CalloutMGR.setState(Ensemble.Editor.CalloutMGR.States.standard);

            let clip = document.getElementById(Ensemble.Editor.TimelineMGR._buildClipDOMId(clipId));

            let pos = $(clip).offset();
            Ensemble.Editor.CalloutMGR.ui.callout.style.top = pos.top + "px";
            Ensemble.Editor.CalloutMGR.ui.callout.style.left = event.pageX + "px";
            $(Ensemble.Editor.CalloutMGR.ui.callout).addClass("timeline-selection-callout--visible");

            let commands = document.getElementsByClassName("selection-callout__command");
            for (let i = 0; i < commands.length; i++) {
                // STANDARD
                if (commands[i].dataset.calloutCommand == "move-clip") commands[i].addEventListener("pointerdown", Ensemble.Editor.TimelineMGR._listeners.calloutMoveClipPointerDown);
                else if (commands[i].dataset.calloutCommand == "move-track-clip") commands[i].addEventListener("pointerdown", Ensemble.Editor.TimelineMGR._listeners.calloutMoveTrackClipPointerDown);

                // TRIM
                else if (commands[i].dataset.calloutCommand == "accept-trim") commands[i].addEventListener("click", Ensemble.Editor.TimelineMGR.acceptTrim);
                else if (commands[i].dataset.calloutCommand == "reject-trim") commands[i].addEventListener("click", Ensemble.Editor.TimelineMGR.rejectTrim);

                // CONTEXT MENU & FAVORITES
                else commands[i].addEventListener("click", Ensemble.Editor.TimelineMGR._listeners.selectionCalloutButtonClicked);
            }
        },

        hide: function () {
            /// <summary>Hides the callout.</summary>
            Ensemble.Editor.CalloutMGR.calloutVisible = true;
            $(Ensemble.Editor.CalloutMGR.ui.callout).removeClass("timeline-selection-callout--visible");
            let commands = document.getElementsByClassName("selection-callout__command");
            for (let i = 0; i < commands.length; i++) {
                // STANDARD
                if (commands[i].dataset.calloutCommand == "move-clip") commands[i].removeEventListener("pointerdown", Ensemble.Editor.TimelineMGR._listeners.calloutMoveClipPointerDown);
                else if (commands[i].dataset.calloutCommand == "move-track-clip") commands[i].removeEventListener("pointerdown", Ensemble.Editor.TimelineMGR._listeners.calloutMoveTrackClipPointerDown);

                // TRIM
                else if (commands[i].dataset.calloutCommand == "accept-trim") commands[i].removeEventListener("click", Ensemble.Editor.TimelineMGR.acceptTrim);
                else if (commands[i].dataset.calloutCommand == "reject-trim") commands[i].removeEventListener("click", Ensemble.Editor.TimelineMGR.rejectTrim);

                // CONTEXT MENU & FAVORITES
                else commands[i].removeEventListener("click", Ensemble.Editor.CalloutMGR._listeners.favoriteClicked);
            }
        },

        setState: function (state) {
            /// <summary>Shows the trim-specific callout for the clip with the given ID.</summary>
            /// <param name="state" type="String">The state to enter.</param>

            $(".selection-callout__state").removeClass("selection-callout__state--visible");
            if (state == Ensemble.Editor.CalloutMGR.States.standard) {
                $(".selection-callout__state--standard").addClass("selection-callout__state--visible");
            }

            else if (state == Ensemble.Editor.CalloutMGR.States.trim) {
                $(".selection-callout__state--clip-trim").addClass("selection-callout__state--visible");
            }

            else console.error("Invalid selection callout state.");
        },

        ui: {
            callout: null
        },

        _refreshUI: function () {
            this.ui.callout = document.getElementsByClassName("timeline-selection-callout")[0];
            this.ui.standardCommands = document.getElementsByClassName("selection-callout__state--standard")[0];
            this.ui.trimCommands = document.getElementsByClassName("selection-callout__state--clip-trim")[0];
        },

        _cleanUI: function () {
            this.ui.callout = null;
        },

        _listeners: {
            favoriteClicked: function (event) {
                if (event.currentTarget.dataset.calloutCommand == "context-menu") Ensemble.Editor.TimelineMGR.ui.timelineSelectionContextMenu.winControl.show(event.currentTarget);
                else console.log("Unidentified callout command.");
            },
        },

        States: {
            standard: "standard",
            trim: "trim"
        }
    });
})();