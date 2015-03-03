(function () {
    WinJS.Namespace.define("Ensemble.Editor.Renderer", {
        /// <summary>Renders image data onto the display canvas.</summary>
        _scale: 1,
        _playbackCanvasContext: null,
        _active: false,

        init: function () {
            this._refreshUI();
            this.canvasResized();
        },

        unload: function () {
            this._cleanUI();
        },

        start: function () {
            /// <summary>Starts drawing frames to the active canvas.</summary>
            this._active = true;
            window.requestAnimationFrame(this._processAnimationFrame);
        },

        stop: function () {
            /// <summary>Stops scheduling new frames. Any frames already scheduled may still render.</summary>
            this._active = false;
        },

        renderSingleFrame: function () {
            /// <summary>Draws a frame from the TimelineMGR's timing index.</summary>
            Ensemble.Editor.Renderer._playbackCanvasContext.clearRect(0, 0, Ensemble.Editor.Renderer.ui.playbackCanvas.width, Ensemble.Editor.Renderer.ui.playbackCanvas.height);
            if (Ensemble.Editor.TimelineMGR._clipIndex.length > 0) {
                for (let k = Ensemble.Editor.TimelineMGR._clipIndex[Ensemble.Editor.TimelineMGR._clipIndexPosition].renderList.length - 1; k > -1; k--) {
                    Ensemble.Editor.TimelineMGR._clipIndex[Ensemble.Editor.TimelineMGR._clipIndexPosition].renderList[k].drawToCanvas(Ensemble.Editor.Renderer._playbackCanvasContext, Ensemble.Editor.Renderer._scale);
                }
            }
            Ensemble.Editor.Renderer.ui.timerDisplay.innerText = Ensemble.Editor.PlaybackMGR.lastTimeFriendly;
            Ensemble.Editor.TimelineMGR.updateCursor(Ensemble.Editor.PlaybackMGR.lastTime);
        },

        requestFrame: function () {
            /// <summary>Schedules a single frame to be rendered if the Renderer is not already active.</summary>
            if (!this._active) requestAnimationFrame(Ensemble.Editor.Renderer.renderSingleFrame);
        },


        canvasResized: function (event) {
            this._scale = $(this.ui.playbackCanvas).width() / Ensemble.Session.maxResolution[0];
            this.ui.playbackCanvas.setAttribute("width", this.ui.playbackCanvas.clientWidth);
            this.ui.playbackCanvas.setAttribute("height", this.ui.playbackCanvas.clientHeight);
            this._playbackCanvasContext = this.ui.playbackCanvas.getContext("2d");
            try {
                this.renderSingleFrame();
            }
            catch (exception) { }
        },

        generateClipInitialPosition: function (width, height) {
            /// <summary>Returns an object containing the x coordinate, y coordinate, width, and height to center a newly-imported clip and best fill the screen with it.</summary>
            /// <param name="width" type="Number">The width of the clip.</param>
            /// <param name="height" type="Number">The height of the clip.</param>
            /// <returns type="Object">An object containing the dimensions and position to place the clip.</returns>

            let testWidth = Ensemble.Session.maxResolution[0];
            let testHeight = Math.floor(testWidth * (height / width));

            if (testHeight > Ensemble.Session.maxResolution[1]) {
                testHeight = Ensemble.Session.maxResolution[1];
                testWidth = Math.floor(testHeight * (width / height));
            }

            let offsetLeft = Math.floor(0.5 * (Ensemble.Session.maxResolution[0] - testWidth));
            let offsetTop = Math.floor(0.5 * (Ensemble.Session.maxResolution[1] - testHeight));

            return {
                width: testWidth,
                height: testHeight,
                xcoord: offsetLeft,
                ycoord: offsetTop
            };
        },

        _processAnimationFrame: function () {
            Ensemble.Editor.Renderer.renderSingleFrame();
            if (Ensemble.Editor.Renderer._active) window.requestAnimationFrame(Ensemble.Editor.Renderer._processAnimationFrame);
        },

        ui: {
            playbackCanvas: null,
            timerDisplay: null
        },

        _refreshUI: function () {
            this.ui.playbackCanvas = document.getElementById("editorCanvas");
            this.ui.timerDisplay = document.getElementById("editorTimeDisplay");

            this.ui.playbackCanvas.addEventListener("pointermove", this._listeners.playbackCanvasPointerMoved);
            this.ui.playbackCanvas.addEventListener("pointerleave", this._listeners.playbackCanvasPointerLeave);
        },

        _cleanUI: function () {
            this.ui.playbackCanvas.removeEventListener("pointermove", this._listeners.playbackCanvasPointerMoved);
            this.ui.playbackCanvas.removeEventListener("pointerleave", this._listeners.playbackCanvasPointerLeave);

            this.ui.playbackCanvas = null;
            this.ui.timerDisplay = null;
        },

        _listeners: {
            playbackCanvasPointerMoved: function (event) {
                if (Ensemble.Editor.TimelineMGR._clipIndex.length > 0) {
                    let scaledX = event.offsetX / Ensemble.Editor.Renderer._scale;
                    let scaledY = event.offsetY / Ensemble.Editor.Renderer._scale;
                    let found = -1;
                    for (let i = 0; i < Ensemble.Editor.TimelineMGR._clipIndex[Ensemble.Editor.TimelineMGR._clipIndexPosition].renderList.length; i++) {
                        if (Ensemble.Editor.TimelineMGR._clipIndex[Ensemble.Editor.TimelineMGR._clipIndexPosition].renderList[i].containsPoint(scaledX, scaledY)) {
                            found = Ensemble.Editor.TimelineMGR._clipIndex[Ensemble.Editor.TimelineMGR._clipIndexPosition].renderList[i].id;
                            break;
                        }
                    }
                    if (found > -1) Ensemble.Editor.SelectionMGR.replaceHovering(found);
                    else {
                        Ensemble.Editor.SelectionMGR.clearHovering();
                    }
                }
            },

            playbackCanvasPointerLeave: function (event) {
                Ensemble.Editor.SelectionMGR.clearHovering();
            }
        }
    });
})();