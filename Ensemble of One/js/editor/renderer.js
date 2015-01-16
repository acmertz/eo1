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
            this._playbackCanvasContext.clearRect(0, 0, this.ui.playbackCanvas.width, this.ui.playbackCanvas.height);
            for (let k = Ensemble.Editor.TimelineMGR._clipIndex[Ensemble.Editor.TimelineMGR._clipIndexPosition].renderList.length - 1; k > -1; k--) {
                Ensemble.Editor.TimelineMGR._clipIndex[Ensemble.Editor.TimelineMGR._clipIndexPosition].renderList[k].drawToCanvas(this._playbackCanvasContext, this._scale);
            }
        },


        canvasResized: function (event) {
            this._scale = $(this.ui.playbackCanvas).width() / Ensemble.Session.maxResolution[0];
            this.ui.playbackCanvas.setAttribute("width", this.ui.playbackCanvas.clientWidth);
            this.ui.playbackCanvas.setAttribute("height", this.ui.playbackCanvas.clientHeight);
            this._playbackCanvasContext = this.ui.playbackCanvas.getContext("2d");
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
            playbackCanvas: null
        },

        _refreshUI: function () {
            this.ui.playbackCanvas = document.getElementById("editorCanvas");
        },

        _cleanUI: function () {
            this.ui.playbackCanvas = null;
        },

        _listeners: {
        }
    });
})();