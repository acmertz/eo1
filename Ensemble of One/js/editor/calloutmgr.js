(function () {
    WinJS.Namespace.define("Ensemble.Editor.CalloutMGR", {
        /// <summary>Used to control the callout that appears in the Editor timeline.</summary>

        calloutVisible: false,
        targetClip: -1,

        init: function () {
            this._refreshUI();
        },

        unload: function () {
            this._cleanUI();
            this.calloutVisible = false;
            this.targetClip = -1;
        },

        show: function (clipId, event) {
            /// <summary>Shows the standard callout for the clip with the given ID.</summary>
            /// <param name="clipId" type="Number">The ID of the clip.</param>
            /// <param name="event" type="Event">An event containing coordinates near which to show the callout.</param>

            if (Ensemble.Editor.CalloutMGR.calloutVisible) {
                $(Ensemble.Editor.CalloutMGR.ui.callout).addClass("timeline-selection-callout--scroll-transition");
                Ensemble.Editor.CalloutMGR.ui.callout.addEventListener("transitionend", Ensemble.Editor.CalloutMGR._listeners.calloutScrolled);
            }

            Ensemble.Editor.CalloutMGR.calloutVisible = true;
            Ensemble.Editor.CalloutMGR.targetClip = clipId;
            Ensemble.Editor.CalloutMGR.setState(Ensemble.Editor.CalloutMGR.States.standard);

            let clip = document.getElementById(Ensemble.Editor.TimelineMGR._buildClipDOMId(clipId)),
                clipOffset = $(clip).offset(),
                xPos = 0,
                yPos = clipOffset.top;

            if (event && event != null) xPos = event.pageX;
            else {
                // calculate an X position such that the callout is fully visible
                // prefer the center of the clip
                // if the clip's center is offscreen, find the closest onscreen position to the center
                // optional: move the "triangle" of the speech bubble to point in the direction of the clip when offscreen

                let clipLeft = clipOffset.left,
                    clipWidth = $(clip).outerWidth(),
                    calloutWidth = $(Ensemble.Editor.CalloutMGR.ui.callout).outerWidth(),
                    centeredX = clipLeft + (0.5 * clipWidth),
                    timelineOffsetFromRight = $(".timeline-button-container").outerWidth(),
                    timelineOffsetFromLeft = $(Ensemble.Editor.TimelineMGR.ui.scrollableContainer).offset().left;

                if (centeredX + (0.5 * calloutWidth) > screen.width - (10 + timelineOffsetFromRight)) {
                    centeredX = screen.width - (10 + timelineOffsetFromRight + (0.5 * calloutWidth));
                }
                else if (centeredX - (0.5 * calloutWidth) < 10 + timelineOffsetFromLeft) {
                    centeredX = 10 + timelineOffsetFromLeft + (0.5 * calloutWidth);
                }
                xPos = centeredX;
            }

            Ensemble.Editor.CalloutMGR.ui.callout.style.left = xPos + "px";
            Ensemble.Editor.CalloutMGR.ui.callout.style.top = yPos + "px";
            
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
                else commands[i].addEventListener("click", Ensemble.Editor.CalloutMGR._listeners.contextMenuButtonClicked);
            }
        },

        hide: function () {
            /// <summary>Hides the callout.</summary>
            Ensemble.Editor.CalloutMGR.calloutVisible = false;
            Ensemble.Editor.CalloutMGR.targetClip = -1;
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

        updatePosition: function (x, y) {
            /// <summary>Automatically recalculates the postion of the callout along the indicated axes.</summary>
            /// <param name="x" type="Boolean">Whether or not to recalculate the X position.</param>
            /// <param name="y" type="Boolean">Whether or not to recalculate the Y position.</param>
            if (Ensemble.Editor.CalloutMGR.calloutVisible) {
                if (x) {
                    let clip = document.getElementById(Ensemble.Editor.TimelineMGR._buildClipDOMId(Ensemble.Editor.CalloutMGR.targetClip)),
                        clipOffset = $(clip).offset(),
                        xPos = clipOffset.left,
                        clipWidth = $(clip).outerWidth(),
                        calloutWidth = $(Ensemble.Editor.CalloutMGR.ui.callout).outerWidth(),
                        calloutLeft = $(Ensemble.Editor.CalloutMGR.ui.callout).offset().left,
                        centeredX = xPos + (0.5 * clipWidth),
                        timelineOffsetFromRight = $(".timeline-button-container").outerWidth(),
                        timelineOffsetFromLeft = $(Ensemble.Editor.TimelineMGR.ui.scrollableContainer).offset().left;

                    if (xPos <= calloutLeft + (0.5 * calloutWidth) && calloutLeft + (0.5 * calloutWidth) <= xPos + clipWidth) {
                        // do nothing
                    }
                    else {
                        if (centeredX + (0.5 * calloutWidth) > screen.width - (10 + timelineOffsetFromRight)) {
                            centeredX = screen.width - (10 + timelineOffsetFromRight + (0.5 * calloutWidth));
                        }
                        else if (centeredX - (0.5 * calloutWidth) < 10 + timelineOffsetFromLeft) {
                            centeredX = 10 + timelineOffsetFromLeft + (0.5 * calloutWidth);
                        }

                        $(Ensemble.Editor.CalloutMGR.ui.callout).addClass("timeline-selection-callout--scroll-transition");
                        Ensemble.Editor.CalloutMGR.ui.callout.addEventListener("transitionend", Ensemble.Editor.CalloutMGR._listeners.calloutScrolled);
                        Ensemble.Editor.CalloutMGR.ui.callout.style.left = centeredX + "px";
                    }
                }

                if (y) {

                }
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
            calloutScrolled: function (event) {
                Ensemble.Editor.CalloutMGR.ui.callout.removeEventListener("transitionend", Ensemble.Editor.CalloutMGR._listeners.calloutScrolled);
                $(Ensemble.Editor.CalloutMGR.ui.callout).removeClass("timeline-selection-callout--scroll-transition");
            },
            contextMenuButtonClicked: function (event) {
                Ensemble.Editor.TimelineMGR.ui.contextmenuPositionHelper.style.left = event.pageX + "px";
                Ensemble.Editor.TimelineMGR.ui.contextmenuPositionHelper.style.top = event.pageY + "px";
                Ensemble.Editor.TimelineMGR.ui.timelineSelectionContextMenu.dataset.clipId = Ensemble.Editor.CalloutMGR.targetClip;
                Ensemble.Editor.TimelineMGR.ui.timelineSelectionContextMenu.winControl.show(event.currentTarget, "autovertical");
            }
        },

        States: {
            standard: "standard",
            trim: "trim"
        }
    });
})();