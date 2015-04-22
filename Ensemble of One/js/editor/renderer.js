(function () {
    WinJS.Namespace.define("Ensemble.Editor.Renderer", {
        /// <summary>Renders image data onto the display canvas.</summary>
        _scale: 1,
        _playbackCanvasContext: null,
        _active: false,
        _clipDragPrimeTimer: 0,

        _clipDragOriginalLeft: 0,
        _clipDragOriginalTop: 0,
        _clipDragCurrentLeft: 0,
        _clipDragCurrentTop: 0,

        _currentCursor: "",

        _draggedClips: [],
        _resizedClips: [],
        _resizedBound: {},
        _resizedStatus: {},
        _resizedRatio: {},

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
                    if (Ensemble.Editor.Renderer._draggedClips.indexOf(Ensemble.Editor.TimelineMGR._clipIndex[Ensemble.Editor.TimelineMGR._clipIndexPosition].renderList[k].id) > -1) {
                        let clip = Ensemble.Editor.TimelineMGR._clipIndex[Ensemble.Editor.TimelineMGR._clipIndexPosition].renderList[k];
                        let scale = Ensemble.Editor.Renderer._scale;
                        let context = Ensemble.Editor.Renderer._playbackCanvasContext;
                        let xdif = Ensemble.Editor.Renderer._clipDragCurrentLeft - Ensemble.Editor.Renderer._clipDragOriginalLeft;
                        let ydif = Ensemble.Editor.Renderer._clipDragCurrentTop - Ensemble.Editor.Renderer._clipDragOriginalTop;

                        let xcoord = (clip.xcoord * scale) + xdif;
                        let ycoord = (clip.ycoord * scale) + ydif;
                        let xwidth = clip.width * scale;
                        let yheight = clip.height * scale;

                        context.globalAlpha = 0.75;
                        context.beginPath();
                        context.strokeStyle = "lightblue";
                        context.fillStyle = "lightgray";
                        context.lineWidth = "1";
                        context.rect(xcoord, ycoord, xwidth, yheight);
                        context.closePath();
                        context.fill();

                        context.drawImage(clip._player, xcoord, ycoord, xwidth, yheight);
                        context.globalAlpha = 1;
                    }
                    if (Ensemble.Editor.Renderer._resizedClips.indexOf(Ensemble.Editor.TimelineMGR._clipIndex[Ensemble.Editor.TimelineMGR._clipIndexPosition].renderList[k].id) > -1) {
                        let clip = Ensemble.Editor.TimelineMGR._clipIndex[Ensemble.Editor.TimelineMGR._clipIndexPosition].renderList[k];
                        let scale = Ensemble.Editor.Renderer._scale;
                        let context = Ensemble.Editor.Renderer._playbackCanvasContext;
                        let xdif = Ensemble.Editor.Renderer._clipDragCurrentLeft - Ensemble.Editor.Renderer._clipDragOriginalLeft;
                        let ydif = Ensemble.Editor.Renderer._clipDragCurrentTop - Ensemble.Editor.Renderer._clipDragOriginalTop;
                        let bound = Ensemble.Editor.Renderer._resizedBound;

                        let xcoord = clip.xcoord * scale;
                        let ycoord = clip.ycoord * scale;
                        let xwidth = (clip.width * scale) + xdif;
                        let yheight = (clip.height * scale) + ydif;

                        if (bound.corner >= 0) {
                            switch (bound.corner) {
                                case 0:
                                    xcoord = (clip.xcoord * scale) + xdif;
                                    ycoord = (clip.ycoord * scale) + ydif;
                                    yheight = (clip.height * scale) - ydif;
                                    xwidth = (clip.width * scale) - xdif;
                                    break;
                                case 1:
                                    xwidth = (clip.width * scale) + xdif;
                                    yheight = (clip.height * scale) - ydif;
                                    ycoord = (clip.ycoord * scale) + ydif;
                                    break;
                                case 2:
                                    yheight = (clip.height * scale) + ydif;
                                    xwidth = (clip.width * scale) + xdif;
                                    break;
                                case 3:
                                    xcoord = (clip.xcoord * scale) + xdif;
                                    xwidth = (clip.width * scale) - xdif;
                                    yheight = (clip.height * scale) + ydif;
                                    break;
                            }
                        }
                        else if (bound.edge >= 0) {
                            switch (bound.edge) {
                                case 0:
                                    ycoord = (clip.ycoord * scale) + ydif;
                                    yheight = (clip.height * scale) - ydif;
                                    xwidth = clip.width * scale;
                                    break;
                                case 1:
                                    xwidth = (clip.width * scale) + xdif;
                                    yheight = clip.height * scale;
                                    break;
                                case 2:
                                    yheight = (clip.height * scale) + ydif;
                                    xwidth = clip.width * scale;
                                    break;
                                case 3:
                                    xcoord = (clip.xcoord * scale) + xdif;
                                    xwidth = (clip.width * scale) - xdif;
                                    yheight = clip.height * scale;
                                    break;
                            }
                        }

                        if (1 > xwidth) {
                            xwidth = 1;
                            xcoord = (clip.xcoord * scale) + (clip.width * scale) - 1;
                        }
                        if (1 > yheight) {
                            yheight = 1;
                            ycoord = (clip.ycoord * scale) + (clip.height * scale) - 1;
                        }

                        context.globalAlpha = 0.75;
                        context.beginPath();
                        context.fillStyle = "lightgray";
                        context.rect(xcoord, ycoord, xwidth, yheight);
                        context.closePath();
                        context.fill();

                        context.drawImage(clip._player, xcoord, ycoord, xwidth, yheight);
                        context.globalAlpha = 1;
                        Ensemble.Editor.Renderer._resizedStatus = {
                            xcoord: xcoord,
                            ycoord: ycoord,
                            width: xwidth,
                            height: yheight
                        }
                    }
                }
            }
            Ensemble.Editor.TimelineMGR.ui.timeRuler.scrollLeft = Ensemble.Editor.TimelineMGR.ui.scrollableContainer.scrollLeft;
            Ensemble.Editor.Renderer.ui.timerDisplay.innerText = Ensemble.Editor.PlaybackMGR.lastTimeFriendly;
            Ensemble.Editor.TimelineMGR.newCursorUpdate(Ensemble.Editor.PlaybackMGR.lastTime);
        },

        requestFrame: function () {
            /// <summary>Schedules a single frame to be rendered if the Renderer is not already active.</summary>
            if (!this._active) requestAnimationFrame(Ensemble.Editor.Renderer.renderSingleFrame);
        },


        canvasResized: function (event) {
            this.ui.playbackCanvas.setAttribute("width", this.ui.playbackCanvas.clientWidth);
            this.ui.playbackCanvas.setAttribute("height", this.ui.playbackCanvas.clientHeight);
            this._scale = this.ui.playbackCanvas.height / Ensemble.Session.maxResolution[1];

            this._playbackCanvasContext = this.ui.playbackCanvas.getContext("2d");
            try {
                this.renderSingleFrame();
            }
            catch (exception) {
                console.error("The Renderer is dead. Long live the Renderer.");
                console.error(exception);
            }
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

        disableStandardInteraction: function () {
            Ensemble.Editor.Renderer.ui.playbackCanvas.removeEventListener("pointermove", this._listeners.playbackCanvasPointerMoved);
            Ensemble.Editor.Renderer.ui.playbackCanvas.removeEventListener("pointerleave", this._listeners.playbackCanvasPointerLeave);
            Ensemble.Editor.Renderer.ui.playbackCanvas.removeEventListener("pointerdown", this._listeners.playbackCanvasPointerDown);
        },

        enableStandardInteraction: function () {
            Ensemble.Editor.Renderer.ui.playbackCanvas.addEventListener("pointermove", this._listeners.playbackCanvasPointerMoved);
            Ensemble.Editor.Renderer.ui.playbackCanvas.addEventListener("pointerleave", this._listeners.playbackCanvasPointerLeave);
            Ensemble.Editor.Renderer.ui.playbackCanvas.addEventListener("pointerdown", this._listeners.playbackCanvasPointerDown);
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
            this.ui.playbackCanvas.addEventListener("pointerdown", this._listeners.playbackCanvasPointerDown);
        },

        _cleanUI: function () {
            this.ui.playbackCanvas.removeEventListener("pointermove", this._listeners.playbackCanvasPointerMoved);
            this.ui.playbackCanvas.removeEventListener("pointerleave", this._listeners.playbackCanvasPointerLeave);
            this.ui.playbackCanvas.removeEventListener("pointerdown", this._listeners.playbackCanvasPointerDown);

            this.ui.playbackCanvas = null;
            this.ui.timerDisplay = null;
        },

        _listeners: {
            playbackCanvasPointerMoved: function (event) {
                if (Ensemble.Editor.TimelineMGR._clipIndex.length > 0) {
                    let scaledX = event.offsetX / Ensemble.Editor.Renderer._scale;
                    let scaledY = event.offsetY / Ensemble.Editor.Renderer._scale;
                    let cursor = "default";
                    let found = null;
                    for (let i = 0; i < Ensemble.Editor.TimelineMGR._clipIndex[Ensemble.Editor.TimelineMGR._clipIndexPosition].renderList.length; i++) {
                        if (Ensemble.Editor.TimelineMGR._clipIndex[Ensemble.Editor.TimelineMGR._clipIndexPosition].renderList[i].containsPoint(scaledX, scaledY)) {
                            found = Ensemble.Editor.TimelineMGR._clipIndex[Ensemble.Editor.TimelineMGR._clipIndexPosition].renderList[i];
                            break;
                        }
                    }
                    if (found) {
                        cursor = "pointer";
                        Ensemble.Editor.SelectionMGR.replaceHovering(found.id);

                        if (found.selected) {
                            cursor = "move";
                            let bound = found.getClickedBound(scaledX, scaledY);
                            if (bound.corner >= 0) {
                                if (bound.corner == 0 || bound.corner == 2) cursor = "nwse-resize";
                                else cursor = "nesw-resize";
                            }
                            else if (bound.edge >= 0) {
                                if (bound.edge == 0 || bound.edge == 2) cursor = "ns-resize";
                                else cursor = "ew-resize";
                            }
                        }
                    }
                    else {
                        Ensemble.Editor.SelectionMGR.clearHovering();
                    }

                    if (cursor != Ensemble.Editor.Renderer._currentCursor) {
                        Ensemble.Editor.Renderer._currentCursor = cursor;
                        Ensemble.Editor.Renderer.ui.playbackCanvas.style.cursor = cursor;
                    }
                }
            },

            playbackCanvasPointerLeave: function (event) {
                Ensemble.Editor.SelectionMGR.clearHovering();
            },

            updatePointerPosition: function (event) {
                Ensemble.Editor.Renderer._clipDragCurrentLeft = event.clientX;
                Ensemble.Editor.Renderer._clipDragCurrentTop = event.clientY;
            },

            playbackCanvasPointerDown: function (event) {
                if (Ensemble.Editor.SelectionMGR.hovering.length > 0) {
                    // select the clip that is hovering
                    let dragDelay = 100;
                    let cursor = "move";
                    let boundResize = false;

                    if (Ensemble.Editor.SelectionMGR.selected.indexOf(Ensemble.Editor.SelectionMGR.hovering[0]) > -1) dragDelay = 0;
                    Ensemble.Editor.SelectionMGR.replaceSelection(Ensemble.Editor.SelectionMGR.hovering[0]);
                    
                    if (dragDelay == 0) {
                        // clip is already selected.
                        let found = Ensemble.Editor.TimelineMGR.getClipById(Ensemble.Editor.SelectionMGR.hovering[0]);
                        let scaledX = event.offsetX / Ensemble.Editor.Renderer._scale;
                        let scaledY = event.offsetY / Ensemble.Editor.Renderer._scale;
                        
                        let bound = found.getClickedBound(scaledX, scaledY);
                        if (bound.corner >= 0) {
                            if (bound.corner == 0 || bound.corner == 2) cursor = "nwse-resize";
                            else cursor = "nesw-resize";
                            boundResize = true;
                            console.log("Begin corner resize.");
                            Ensemble.Editor.Renderer._listeners.clipResizeStart(event, bound);
                        }
                        else if (bound.edge >= 0) {
                            if (bound.edge == 0 || bound.edge == 2) cursor = "ns-resize";
                            else cursor = "ew-resize";
                            boundResize = true;
                            Ensemble.Editor.Renderer._listeners.clipResizeStart(event, bound);
                        }
                    }
                    if (!boundResize) {
                        Ensemble.Editor.Renderer._clipDragPrimeTimer = setTimeout(Ensemble.Editor.Renderer._listeners.clipDragStart, dragDelay);
                        Ensemble.Editor.Renderer.disableStandardInteraction();
                        Ensemble.Editor.Renderer._clipDragCurrentLeft = event.clientX;
                        Ensemble.Editor.Renderer._clipDragCurrentTop = event.clientY;
                        document.addEventListener("pointerup", Ensemble.Editor.Renderer._listeners.preventClipDragStart);
                        document.addEventListener("pointermove", Ensemble.Editor.Renderer._listeners.updatePointerPosition);
                    }

                    if (cursor != Ensemble.Editor.Renderer._currentCursor) {
                        Ensemble.Editor.Renderer._currentCursor = cursor;
                        Ensemble.Editor.Renderer.ui.playbackCanvas.style.cursor = cursor;
                    }
                }
                else Ensemble.Editor.SelectionMGR.clearSelection();
            },

            preventClipDragStart: function (event) {
                clearTimeout(Ensemble.Editor.Renderer._clipDragPrimeTimer);
                document.removeEventListener("pointerup", Ensemble.Editor.Renderer._listeners.preventClipDragStart);
                document.removeEventListener("pointermove", Ensemble.Editor.Renderer._listeners.updatePointerPosition);
                Ensemble.Editor.Renderer.enableStandardInteraction();
            },

            clipDragStart: function (event) {
                console.log("Start dragging.");
                Ensemble.Editor.Renderer.disableStandardInteraction();
                document.removeEventListener("pointerup", Ensemble.Editor.Renderer._listeners.preventClipDragStart);
                Ensemble.Editor.Renderer._draggedClips = Ensemble.Editor.SelectionMGR.selected;
                Ensemble.Editor.Renderer._clipDragOriginalLeft = Ensemble.Editor.Renderer._clipDragCurrentLeft;
                Ensemble.Editor.Renderer._clipDragOriginalTop = Ensemble.Editor.Renderer._clipDragCurrentTop;
                document.addEventListener("pointerup", Ensemble.Editor.Renderer._listeners.clipDragFinish);
                Ensemble.Editor.Renderer.start();
            },

            clipDragFinish: function (event) {
                document.removeEventListener("pointermove", Ensemble.Editor.Renderer._listeners.updatePointerPosition);
                document.removeEventListener("pointerup", Ensemble.Editor.Renderer._listeners.clipDragFinish);
                if (!Ensemble.Editor.PlaybackMGR.playing) Ensemble.Editor.Renderer.stop();

                let scale = Ensemble.Editor.Renderer._scale;
                let xdif = Ensemble.Editor.Renderer._clipDragCurrentLeft - Ensemble.Editor.Renderer._clipDragOriginalLeft;
                let ydif = Ensemble.Editor.Renderer._clipDragCurrentTop - Ensemble.Editor.Renderer._clipDragOriginalTop;

                let newX = [];
                let newY = [];
                let newWidth = [];
                let newHeight = [];

                let oldX = [];
                let oldY = [];
                let oldWidth = [];
                let oldHeight = [];

                for (let i = 0; i < Ensemble.Editor.Renderer._draggedClips.length; i++) {
                    let clip = Ensemble.Editor.TimelineMGR.getClipById(Ensemble.Editor.Renderer._draggedClips[i]);
                    oldX.push(clip.xcoord);
                    oldY.push(clip.ycoord);
                    oldWidth.push(clip.width);
                    oldHeight.push(clip.height);

                    newX.push(clip.xcoord + Math.round(xdif / scale));
                    newY.push(clip.ycoord + Math.round(ydif / scale));
                    newWidth.push(clip.width);
                    newHeight.push(clip.height);
                }

                let moveAction = new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.positionClip, {
                    clipIds: Ensemble.Editor.Renderer._draggedClips,
                    oldX: oldX,
                    oldY: oldY,
                    oldWidth: oldWidth,
                    oldHeight: oldHeight,
                    newX: newX,
                    newY: newY,
                    newWidth: newWidth,
                    newHeight: newHeight
                });

                Ensemble.HistoryMGR.performAction(moveAction);

                console.log("Finish dragging.");
                Ensemble.Editor.Renderer._draggedClips = [];
                Ensemble.Editor.Renderer.enableStandardInteraction();
            },

            clipResizeStart: function (event, bound) {
                console.log("Start resizing.");
                Ensemble.Editor.Renderer.disableStandardInteraction();
                Ensemble.Editor.Renderer._resizedBound = bound;
                Ensemble.Editor.Renderer._resizedClips = Ensemble.Editor.SelectionMGR.selected;
                Ensemble.Editor.Renderer._clipDragCurrentLeft = event.clientX;
                Ensemble.Editor.Renderer._clipDragCurrentTop = event.clientY;
                Ensemble.Editor.Renderer._clipDragOriginalLeft = Ensemble.Editor.Renderer._clipDragCurrentLeft;
                Ensemble.Editor.Renderer._clipDragOriginalTop = Ensemble.Editor.Renderer._clipDragCurrentTop;

                for (let i = 0; i < Ensemble.Editor.Renderer._resizedClips.length; i++) {
                    let tempClip = Ensemble.Editor.TimelineMGR.getClipById(Ensemble.Editor.Renderer._resizedClips[i]);
                    if (1 > tempClip.aspect.length) {
                        tempClip.aspect = Ensemble.Utilities.AspectGenerator.calcAspect(tempClip.width, tempClip.height);
                    }
                    let splitAspect = tempClip.aspect.split(":");
                    tempClip._intAspect = {
                        width: parseInt(splitAspect[0], 10),
                        height: parseInt(splitAspect[1], 10)
                    };
                }

                document.addEventListener("pointermove", Ensemble.Editor.Renderer._listeners.updatePointerPosition);
                document.addEventListener("pointerup", Ensemble.Editor.Renderer._listeners.clipResizeFinish);
                Ensemble.Editor.Renderer.start();
            },

            clipResizeFinish: function (event) {
                console.log("Finish resizing the clip.");
                document.removeEventListener("pointermove", Ensemble.Editor.Renderer._listeners.updatePointerPosition);
                document.removeEventListener("pointerup", Ensemble.Editor.Renderer._listeners.clipResizeFinish);
                if (!Ensemble.Editor.PlaybackMGR.playing) Ensemble.Editor.Renderer.stop();

                let scale = Ensemble.Editor.Renderer._scale;
                let clip = Ensemble.Editor.TimelineMGR.getClipById(Ensemble.Editor.Renderer._resizedClips[0]);
                let resizeAction = new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.positionClip, {
                    clipIds: [clip.id],
                    oldX: [clip.xcoord],
                    oldY: [clip.ycoord],
                    oldWidth: [clip.width],
                    oldHeight: [clip.height],
                    newX: [Math.round(Ensemble.Editor.Renderer._resizedStatus.xcoord / scale)],
                    newY: [Math.round(Ensemble.Editor.Renderer._resizedStatus.ycoord / scale)],
                    newWidth: [Math.round(Ensemble.Editor.Renderer._resizedStatus.width / scale)],
                    newHeight: [Math.round(Ensemble.Editor.Renderer._resizedStatus.height / scale)]
                });

                Ensemble.HistoryMGR.performAction(resizeAction);

                Ensemble.Editor.Renderer._resizedBound = {};
                Ensemble.Editor.Renderer._resizedClips = [];
                Ensemble.Editor.Renderer._resizedStatus = {};
                Ensemble.Editor.Renderer.enableStandardInteraction();
            }
        }
    });
})();