(function () {
    WinJS.Namespace.define("Ensemble.Editor.Renderer", {
        /// <summary>Renders image data onto the display canvas and brokers touch interaction with drawn Clips.</summary>
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
        _resizedStatus: {
            xcoord: 0,
            ycoord: 0,
            width: 0,
            height: 0
        },
        _resizedRatio: {},

        _snapEdgesClip: {
            horizontal: [],
            vertical: []
        },
        _snapDistanceClip: 10,
        _snapEdgesCanvas: {
            horizontal: [],
            vertical: []
        },
        _snapDistanceCanvas: 10,
        _currentSnap: { x: 0, y: 0 },

        _currentPointerTargetSize: 0,

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

                    let clip = Ensemble.Editor.TimelineMGR._clipIndex[Ensemble.Editor.TimelineMGR._clipIndexPosition].renderList[k];
                    let scale = Ensemble.Editor.Renderer._scale;
                    let context = Ensemble.Editor.Renderer._playbackCanvasContext;
                    let xdif = Ensemble.Editor.Renderer._clipDragCurrentLeft - Ensemble.Editor.Renderer._clipDragOriginalLeft;
                    let ydif = Ensemble.Editor.Renderer._clipDragCurrentTop - Ensemble.Editor.Renderer._clipDragOriginalTop;

                    if (Ensemble.Editor.Renderer._draggedClips.indexOf(Ensemble.Editor.TimelineMGR._clipIndex[Ensemble.Editor.TimelineMGR._clipIndexPosition].renderList[k].id) > -1) {
                        let xcoord = (clip.xcoord * scale) + xdif;
                        let ycoord = (clip.ycoord * scale) + ydif;
                        let xwidth = clip.width * scale;
                        let yheight = clip.height * scale;


                        // compute sticky edges for clips
                        let snappedValues = Ensemble.Editor.Renderer.snapMove(xcoord, ycoord, xwidth, yheight);
                        xcoord = snappedValues.x;
                        ycoord = snappedValues.y;


                        context.globalAlpha = 0.5;
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

                        let snappedValues = Ensemble.Editor.Renderer.snapResize(xcoord, ycoord, xwidth, yheight, bound);
                        xcoord = snappedValues.x;
                        ycoord = snappedValues.y;
                        xwidth = snappedValues.width;
                        yheight = snappedValues.height;

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
            Ensemble.Editor.Renderer.ui.timerDisplay.innerText = Ensemble.Editor.PlaybackMGR.lastTimeFriendly;
            Ensemble.Editor.TimelineMGR.newCursorUpdate(Ensemble.Editor.PlaybackMGR.lastTime);
        },

        requestFrame: function () {
            /// <summary>Schedules a single frame to be rendered if the Renderer is not already active.</summary>
            if (!this._active) requestAnimationFrame(Ensemble.Editor.Renderer.renderSingleFrame);
        },

        snapMove: function(x, y, width, height) {
            /// <summary>Generates snap values for the dragged clip with the given dimensions.</summary>
            /// <param name="x" type="Number">The X-coordinate of the clip being snapped.</param>
            /// <param name="y" type="Number">The Y-coordinate of the clip being snapped.</param>
            /// <param name="width" type="Number">The width of the clip being snapped.</param>
            /// <param name="height" type="Number">The height of the clip being snapped.</param>
            /// <returns type="Object">An object containing the new X and Y coordinates of the clip after executing the snap operation.</returns>
            let xcoord = x,
                ycoord = y,
                xwidth = width,
                yheight = height,
                snapX = Infinity,
                snapY = Infinity;

            for (let i = 0; i < Ensemble.Editor.Renderer._snapEdgesClip.vertical.length; i++) {
                // left
                let xDistance = Math.abs(xcoord - Ensemble.Editor.Renderer._snapEdgesClip.vertical[i].x1);
                if (xDistance < Ensemble.Editor.Renderer._snapDistanceClip) {
                    let edgeInRange = false;
                    if (Ensemble.Editor.Renderer._snapEdgesClip.vertical[i].coords.y <= ycoord && ycoord <= Ensemble.Editor.Renderer._snapEdgesClip.vertical[i].coords.y + Ensemble.Editor.Renderer._snapEdgesClip.vertical[i].dimensions.height) edgeInRange = true;
                    if (Ensemble.Editor.Renderer._snapEdgesClip.vertical[i].coords.y <= ycoord + yheight && ycoord + yheight <= Ensemble.Editor.Renderer._snapEdgesClip.vertical[i].coords.y + Ensemble.Editor.Renderer._snapEdgesClip.vertical[i].dimensions.height) edgeInRange = true;
                    if (edgeInRange) {
                        let snapDif = xcoord - Ensemble.Editor.Renderer._snapEdgesClip.vertical[i].x1;
                        if (snapX > snapDif) {
                            snapX = snapDif;
                            xcoord = Ensemble.Editor.Renderer._snapEdgesClip.vertical[i].x1;
                        }
                    }
                }

                //right
                xDistance = Math.abs((xcoord + xwidth) - Ensemble.Editor.Renderer._snapEdgesClip.vertical[i].x1);
                if (xDistance < Ensemble.Editor.Renderer._snapDistanceClip) {
                    let edgeInRange = false;
                    if (Ensemble.Editor.Renderer._snapEdgesClip.vertical[i].coords.y <= ycoord && ycoord <= Ensemble.Editor.Renderer._snapEdgesClip.vertical[i].coords.y + Ensemble.Editor.Renderer._snapEdgesClip.vertical[i].dimensions.height) edgeInRange = true;
                    if (Ensemble.Editor.Renderer._snapEdgesClip.vertical[i].coords.y <= ycoord + yheight && ycoord + yheight <= Ensemble.Editor.Renderer._snapEdgesClip.vertical[i].coords.y + Ensemble.Editor.Renderer._snapEdgesClip.vertical[i].dimensions.height) edgeInRange = true;
                    if (edgeInRange) {
                        let snapDif = xcoord - (Ensemble.Editor.Renderer._snapEdgesClip.vertical[i].x1 - xwidth);
                        if (snapX > snapDif) {
                            snapX = snapDif;
                            xcoord = Ensemble.Editor.Renderer._snapEdgesClip.vertical[i].x1 - xwidth;
                        }
                    }
                }
            }

            for (let i = 0; i < Ensemble.Editor.Renderer._snapEdgesClip.horizontal.length; i++) {
                //top
                let yDistance = Math.abs(ycoord - Ensemble.Editor.Renderer._snapEdgesClip.horizontal[i].y1);
                if (yDistance < Ensemble.Editor.Renderer._snapDistanceClip) {
                    let edgeInRange = false;
                    if (Ensemble.Editor.Renderer._snapEdgesClip.horizontal[i].coords.x <= xcoord && xcoord <= Ensemble.Editor.Renderer._snapEdgesClip.horizontal[i].coords.x + Ensemble.Editor.Renderer._snapEdgesClip.horizontal[i].dimensions.width) edgeInRange = true;
                    if (Ensemble.Editor.Renderer._snapEdgesClip.horizontal[i].coords.x <= xcoord + xwidth && xcoord + xwidth <= Ensemble.Editor.Renderer._snapEdgesClip.horizontal[i].coords.x + Ensemble.Editor.Renderer._snapEdgesClip.horizontal[i].dimensions.width) edgeInRange = true;
                    if (edgeInRange) {
                        let snapDif = ycoord - Ensemble.Editor.Renderer._snapEdgesClip.horizontal[i].y1;
                        if (snapY > snapDif) {
                            snapY = snapDif;
                            ycoord = Ensemble.Editor.Renderer._snapEdgesClip.horizontal[i].y1;
                        }
                    }
                }

                //bottom
                yDistance = Math.abs((ycoord + yheight) - Ensemble.Editor.Renderer._snapEdgesClip.horizontal[i].y1);
                if (yDistance < Ensemble.Editor.Renderer._snapDistanceClip) {
                    let edgeInRange = false;
                    if (Ensemble.Editor.Renderer._snapEdgesClip.horizontal[i].coords.x <= xcoord && xcoord <= Ensemble.Editor.Renderer._snapEdgesClip.horizontal[i].coords.x + Ensemble.Editor.Renderer._snapEdgesClip.horizontal[i].dimensions.width) edgeInRange = true;
                    if (Ensemble.Editor.Renderer._snapEdgesClip.horizontal[i].coords.x <= xcoord + xwidth && xcoord + xwidth <= Ensemble.Editor.Renderer._snapEdgesClip.horizontal[i].coords.x + Ensemble.Editor.Renderer._snapEdgesClip.horizontal[i].dimensions.width) edgeInRange = true;
                    if (edgeInRange) {
                        let snapDif = ycoord - (Ensemble.Editor.Renderer._snapEdgesClip.horizontal[i].y1 - yheight);
                        if (snapY > snapDif) {
                            snapY = snapDif;
                            ycoord = Ensemble.Editor.Renderer._snapEdgesClip.horizontal[i].y1 - yheight;
                        }
                    }
                }
            }

            // compute sticky edges for canvas edges
            for (let i = 0; i < Ensemble.Editor.Renderer._snapEdgesCanvas.vertical.length; i++) {
                //left
                let xDistance = Math.abs(xcoord - Ensemble.Editor.Renderer._snapEdgesCanvas.vertical[i].x1);
                if (xDistance < Ensemble.Editor.Renderer._snapDistanceClip) {
                    let snapDif = xcoord - Ensemble.Editor.Renderer._snapEdgesCanvas.vertical[i].x1;
                    if (snapX > snapDif) {
                        snapX = snapDif;
                        xcoord = Ensemble.Editor.Renderer._snapEdgesCanvas.vertical[i].x1;
                    }
                }

                //right
                xDistance = Math.abs((xcoord + xwidth) - Ensemble.Editor.Renderer._snapEdgesCanvas.vertical[i].x1);
                if (xDistance < Ensemble.Editor.Renderer._snapDistanceClip) {
                    let snapDif = xcoord - (Ensemble.Editor.Renderer._snapEdgesCanvas.vertical[i].x1 - xwidth);
                    if (snapX > snapDif) {
                        snapX = snapDif;
                        xcoord = Ensemble.Editor.Renderer._snapEdgesCanvas.vertical[i].x1 - xwidth;
                    }
                }
            }

            for (let i = 0; i < Ensemble.Editor.Renderer._snapEdgesCanvas.horizontal.length; i++) {
                //top
                let yDistance = Math.abs(ycoord - Ensemble.Editor.Renderer._snapEdgesCanvas.horizontal[i].y1);
                if (yDistance < Ensemble.Editor.Renderer._snapDistanceClip) {
                    let snapDif = ycoord - Ensemble.Editor.Renderer._snapEdgesCanvas.horizontal[i].y1;
                    if (snapY > snapDif) {
                        snapY = snapDif;
                        ycoord = Ensemble.Editor.Renderer._snapEdgesCanvas.horizontal[i].y1;
                    }
                }

                //bottom
                yDistance = Math.abs((ycoord + yheight) - Ensemble.Editor.Renderer._snapEdgesCanvas.horizontal[i].y1);
                if (yDistance < Ensemble.Editor.Renderer._snapDistanceClip) {
                    let snapDif = ycoord - (Ensemble.Editor.Renderer._snapEdgesCanvas.horizontal[i].y1 - yheight);
                    if (snapY > snapDif) {
                        snapY = snapDif;
                        ycoord = Ensemble.Editor.Renderer._snapEdgesCanvas.horizontal[i].y1 - yheight;
                    }
                }
            }

            if (isFinite(snapX)) Ensemble.Editor.Renderer._currentSnap.x = snapX;
            else Ensemble.Editor.Renderer._currentSnap.x = 0;
            if (isFinite(snapY)) Ensemble.Editor.Renderer._currentSnap.y = snapY;
            else Ensemble.Editor.Renderer._currentSnap.y = 0;

            return {
                x: xcoord,
                y: ycoord
            }
        },

        snapResize: function (x, y, width, height, bound) {
            /// <summary>Generates snap values for the resized clip with the given dimensions and resize bound.</summary>
            /// <param name="x" type="Number">The X-coordinate of the clip being snapped.</param>
            /// <param name="y" type="Number">The Y-coordinate of the clip being snapped.</param>
            /// <param name="width" type="Number">The width of the clip being snapped.</param>
            /// <param name="height" type="Number">The height of the clip being snapped.</param>
            /// <param name="bound" type="Object">An object identifying the corner or edge being used for the resize operation.</param>
            /// <returns type="Object">An object containing the new X, Y, width, and height after executing the snap operation.</returns>
            let xcoord = x,
                ycoord = y,
                xwidth = width,
                yheight = height,
                candidateX = null,
                candidateXNew = null,
                candidateY = null,
                candidateYNew = null;

            if (bound.corner >= 0) {
                switch (bound.corner) {
                    case 0:
                        candidateX = xcoord;
                        candidateY = ycoord;
                        break;
                    case 1:
                        candidateX = xcoord + xwidth;
                        candidateY = ycoord;
                        break;
                    case 2:
                        candidateX = xcoord + xwidth;
                        candidateY = ycoord + yheight;
                        break;
                    case 3:
                        candidateX = xcoord;
                        candidateY = ycoord + yheight;
                        break;
                }
            }

            else if (bound.edge >= 0) {
                switch (bound.edge) {
                    case 0:
                        candidateX = xcoord;
                        candidateY = ycoord;
                        break;
                    case 1:
                        candidateX = xcoord + xwidth;
                        candidateY = ycoord;
                        break;
                    case 2:
                        candidateX = xcoord;
                        candidateY = ycoord + yheight;
                        break;
                    case 3:
                        candidateX = xcoord;
                        candidateY = ycoord;
                        break;
                }
            }

            if (candidateX && Ensemble.Editor.Renderer._snapEdgesClip.vertical.length > 0) {
                let tempCandidates = Ensemble.Editor.Renderer.findEdgeSnapClipCandidates(candidateX, candidateY, xwidth, yheight, "horizontal");
                candidateXNew = Ensemble.Editor.Renderer.findClosestEdgeSnapClip(candidateX, "horizontal", tempCandidates);
            }
            else candidateXNew = candidateX;

            if (candidateY && Ensemble.Editor.Renderer._snapEdgesClip.horizontal.length > 0) {
                let tempCandidates = Ensemble.Editor.Renderer.findEdgeSnapClipCandidates(candidateX, candidateY, xwidth, yheight, "vertical");
                candidateYNew = Ensemble.Editor.Renderer.findClosestEdgeSnapClip(candidateY, "vertical", tempCandidates);
            }
            else candidateYNew = candidateY;

            let snapX = candidateXNew - candidateX;
            let snapY = candidateYNew - candidateY;
            for (let i = 0; i < Ensemble.Editor.Renderer._snapEdgesCanvas.vertical.length; i++) {
                //left
                let xDistance = Math.abs(xcoord - Ensemble.Editor.Renderer._snapEdgesCanvas.vertical[i].x1);
                if (xDistance < Ensemble.Editor.Renderer._snapDistanceClip) {
                    let snapDif = xcoord - Ensemble.Editor.Renderer._snapEdgesCanvas.vertical[i].x1;
                    if (snapX > snapDif) {
                        snapX = snapDif;
                        candidateXNew = Ensemble.Editor.Renderer._snapEdgesCanvas.vertical[i].x1;
                    }
                }

                //right
                xDistance = Math.abs((xcoord + xwidth) - Ensemble.Editor.Renderer._snapEdgesCanvas.vertical[i].x1);
                if (xDistance < Ensemble.Editor.Renderer._snapDistanceClip) {
                    let snapDif = xcoord - (Ensemble.Editor.Renderer._snapEdgesCanvas.vertical[i].x1 - xwidth);
                    if (snapX > snapDif) {
                        snapX = snapDif;
                        candidateXNew = Ensemble.Editor.Renderer._snapEdgesCanvas.vertical[i].x1;
                    }
                }
            }

            for (let i = 0; i < Ensemble.Editor.Renderer._snapEdgesCanvas.horizontal.length; i++) {
                //top
                let yDistance = Math.abs(ycoord - Ensemble.Editor.Renderer._snapEdgesCanvas.horizontal[i].y1);
                if (yDistance < Ensemble.Editor.Renderer._snapDistanceClip) {
                    let snapDif = ycoord - Ensemble.Editor.Renderer._snapEdgesCanvas.horizontal[i].y1;
                    if (snapY > snapDif) {
                        snapY = snapDif;
                        candidateYNew = Ensemble.Editor.Renderer._snapEdgesCanvas.horizontal[i].y1;
                    }
                }

                //bottom
                yDistance = Math.abs((ycoord + yheight) - Ensemble.Editor.Renderer._snapEdgesCanvas.horizontal[i].y1);
                if (yDistance < Ensemble.Editor.Renderer._snapDistanceClip) {
                    let snapDif = ycoord - (Ensemble.Editor.Renderer._snapEdgesCanvas.horizontal[i].y1 - yheight);
                    if (snapY > snapDif) {
                        snapY = snapDif;
                        candidateYNew = Ensemble.Editor.Renderer._snapEdgesCanvas.horizontal[i].y1;
                    }
                }
            }

            // NOTE: "stretch" resize operations honor both candidate snaps.
            // TODO: "scale" resize operations honor the candidate that is closest to its initial position; the opposing axis is generated from the aspect ratio.

            if (bound.corner >= 0) {
                switch (bound.corner) {
                    case 0:
                        xwidth = xwidth - (candidateXNew - xcoord);
                        xcoord = candidateXNew;
                        yheight = yheight - (candidateYNew - ycoord);
                        ycoord = candidateYNew;
                        break;
                    case 1:
                        xwidth = candidateXNew - xcoord;
                        yheight = yheight - (candidateYNew - ycoord);
                        ycoord = candidateYNew;
                        break;
                    case 2:
                        xwidth = candidateXNew - xcoord;
                        yheight = candidateYNew - ycoord;
                        break;
                    case 3:
                        xwidth = xwidth - (candidateXNew - xcoord);
                        xcoord = candidateXNew;
                        yheight = candidateYNew - ycoord;
                        break;
                }
            }

            else if (bound.edge >= 0) {
                switch (bound.edge) {
                    case 0:
                        yheight = yheight - (candidateYNew - ycoord);
                        ycoord = candidateYNew;
                        break;
                    case 1:
                        xwidth = candidateXNew - xcoord;
                        break;
                    case 2:
                        yheight = candidateYNew - ycoord;
                        break;
                    case 3:
                        xwidth = xwidth - (candidateXNew - xcoord);
                        xcoord = candidateXNew;
                        break;
                }
            }

            return {
                x: xcoord,
                y: ycoord,
                width: xwidth,
                height: yheight
            }
        },

        findEdgeSnapClipCandidates: function (xcoord, ycoord, width, height, orientation) {
            /// <summary>Returns an array containing only those snap edges who "line up with" the given coordinates on the axis opposite the direction of the snap operation.</summary>
            /// <param name="xcoord" type="Number"></param>
            /// <param name="ycoord" type="Number"></param>
            /// <param name="width" type="Number"></param>
            /// <param name="height" type="Number"></param>
            /// <param name="orientation" type="String">The orientation of the snap operation. Candidates will be tested along the opposite axis to the direction of the snap (for instance, a value of "horizontal" will ensure that only those clips that line up vertically will be returned.</param>
            /// <returns type="Array">An array containing all clips valid for the snap operation.</returns>
            let searchList = [],
                returnList = [],
                searchBound = Infinity,
                coord1 = Infinity,
                coord2 = Infinity,
                coord1Name = "",
                coord2Name = "";

            if (orientation == "horizontal") {
                searchList = Ensemble.Editor.Renderer._snapEdgesClip.vertical;
                searchBound = searchList.length;
                coord1 = ycoord;
                coord2 = ycoord + height;
                coord1Name = "y1";
                coord2Name = "y2";
            }
            else {
                searchList = Ensemble.Editor.Renderer._snapEdgesClip.horizontal;
                searchBound = searchList.length;
                coord1 = xcoord;
                coord2 = xcoord + width;
                coord1Name = "x1";
                coord2Name = "x2";
            }

            for (let i = 0; i < searchBound; i++) {
                if ((coord1 <= searchList[i][coord1Name] && searchList[i][coord1Name] <= coord2) ||
                    (coord1 <= searchList[i][coord2Name] && searchList[i][coord2Name] <= coord2) ||
                    (searchList[i][coord1Name] <= coord1 && coord1 <= searchList[i][coord2Name]) ||
                    (searchList[i][coord1Name] <= coord2 && coord2 <= searchList[i][coord2Name])
                ) returnList.push(searchList[i]);
            }

            return returnList;
        },

        findClosestEdgeSnapClip: function (coord, orientation, targetSnapArr) {
            /// <summary>Finds the closest snap point for the given single coordinate.</summary>
            /// <param name="coord" type="Number">The coordinate to snap.</param>
            /// <param name="orientation" type="String">The orientation of the snap. Only "horizontal" and "vertical" will produce valid results.</param>
            /// <returns type="Number">The closest snap to the given coordinates and orientation.</returns>
            let targetSnapCoord = coord,
                targetLineCoordName = "",
                snappedVal = Infinity;

            if (orientation == "horizontal") {
                targetLineCoordName = "x1";
            }
            else {
                targetLineCoordName = "y1";
            }

            for (let i = 0; i < targetSnapArr.length; i++) {
                let snapDistance = Math.abs(targetSnapCoord - targetSnapArr[i][targetLineCoordName]);
                if (snapDistance < Ensemble.Editor.Renderer._snapDistanceClip) {
                    let snapDif = targetSnapCoord - targetSnapArr[i][targetLineCoordName];
                    if (snappedVal > snapDif) {
                        snappedVal = snapDif;
                        targetSnapCoord = targetSnapArr[i][targetLineCoordName];
                    }
                }
            }
            return targetSnapCoord;
        },


        canvasResized: function (event) {
            this.ui.playbackCanvas.setAttribute("width", this.ui.playbackCanvas.clientWidth);
            this.ui.playbackCanvas.setAttribute("height", this.ui.playbackCanvas.clientHeight);
            this._scale = this.ui.playbackCanvas.height / Ensemble.Session.projectResolution.height;

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

            let testWidth = Ensemble.Session.projectResolution.width;
            let testHeight = Math.floor(testWidth * (height / width));

            if (testHeight > Ensemble.Session.projectResolution.height) {
                testHeight = Ensemble.Session.projectResolution.height;
                testWidth = Math.floor(testHeight * (width / height));
            }

            let offsetLeft = Math.floor(0.5 * (Ensemble.Session.projectResolution.width - testWidth));
            let offsetTop = Math.floor(0.5 * (Ensemble.Session.projectResolution.height - testHeight));

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

        updateThumb: function () {
            /// <summary>Updates the thumbnail data URI to match the current frame of the project.</summary>
            let tempCanvas = document.createElement("canvas");
            tempCanvas.width = Ensemble.Session.projectResolution.width * 0.25;
            tempCanvas.height = Ensemble.Session.projectResolution.height * 0.25;
            let tempContext = tempCanvas.getContext("2d");
            if (Ensemble.Editor.TimelineMGR._clipIndex.length > 0) {
                for (let k = Ensemble.Editor.TimelineMGR._clipIndex[Ensemble.Editor.TimelineMGR._clipIndexPosition].renderList.length - 1; k > -1; k--) {
                    Ensemble.Editor.TimelineMGR._clipIndex[Ensemble.Editor.TimelineMGR._clipIndexPosition].renderList[k].drawToCanvas(tempContext, 0.25);
                }
            }
            else {
                tempContext.fillStyle = "#000";
                tempContext.fillRect(0, 0, Ensemble.Session.projectResolution.width * 0.25, Ensemble.Session.projectResolution.height * 0.25);
            }
            Ensemble.Session.projectThumb = tempCanvas.toDataURL("image/png");
        },

        updateClipSnapEdges: function () {
            /// <summary>Updates the clip-snappable regions for dragged/resized clips in the canvas.</summary>
            Ensemble.Editor.Renderer._snapEdgesClip.horizontal = [];
            Ensemble.Editor.Renderer._snapEdgesClip.vertical = [];
            if (Ensemble.Settings.retrieveSetting("sticky-edges-clip")) {
                let horizontalEdges = [];
                let verticalEdges = [];
                for (let i = Ensemble.Editor.TimelineMGR._clipIndex[Ensemble.Editor.TimelineMGR._clipIndexPosition].renderList.length - 1; i > -1; i--) {
                    let tempEdge = Ensemble.Editor.TimelineMGR._clipIndex[Ensemble.Editor.TimelineMGR._clipIndexPosition].renderList[i].getEdges(Ensemble.Editor.Renderer._scale);
                    horizontalEdges.push(tempEdge.top, tempEdge.bottom);
                    verticalEdges.push(tempEdge.left, tempEdge.right);
                }
                Ensemble.Editor.Renderer._snapEdgesClip.horizontal = horizontalEdges;
                Ensemble.Editor.Renderer._snapEdgesClip.vertical = verticalEdges;
            }
        },

        updateCanvasSnapEdges: function () {
            /// <summary>Updates the canvas-snappable regions for dragged/resized clips in the canvas.</summary>
            if (Ensemble.Settings.retrieveSetting("sticky-edges-canvas")) {
                let scale = Ensemble.Editor.Renderer._scale;
                let width = Ensemble.Session.projectResolution.width * scale;
                let height = Ensemble.Session.projectResolution.height * scale;
                Ensemble.Editor.Renderer._snapEdgesCanvas = {
                    horizontal: [
                        {
                            x1: 0,
                            x2: width,
                            y1: 0,
                            y2: 0
                        },
                        {
                            x1: 0,
                            x2: width,
                            y1: height,
                            y2: height
                        }
                    ],
                    vertical: [
                        {
                            x1: width,
                            x2: width,
                            y1: 0,
                            y2: height
                        },

                        {
                            x1: 0,
                            x2: 0,
                            y1: 0,
                            y2: height
                        }
                    ]
                };
            }
            else {
                Ensemble.Editor.Renderer._snapEdgesCanvas.horizontal = [];
                Ensemble.Editor.Renderer._snapEdgesCanvas.vertical = [];
            }
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
            this.ui.playbackCanvas = document.getElementsByClassName("editor-canvas")[0];
            this.ui.timerDisplay = document.getElementsByClassName("editor-time-display")[0];

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
                if (event.pointerType == "touch") Ensemble.Editor.Renderer._listeners.playbackCanvasPointerMoved(event);
                if (Ensemble.Editor.SelectionMGR.hovering.length > 0) {
                    // select the clip that is hovering
                    let dragDelay = 100;
                    let cursor = "move";
                    let boundResize = false;

                    if (Ensemble.Editor.SelectionMGR.selected.indexOf(Ensemble.Editor.SelectionMGR.hovering[0]) > -1) dragDelay = 0;
                    Ensemble.Editor.SelectionMGR.replaceSelection(Ensemble.Editor.SelectionMGR.hovering[0], event, false);

                    Ensemble.Editor.Renderer.updateClipSnapEdges();
                    Ensemble.Editor.Renderer.updateCanvasSnapEdges();
                    
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
                let xdif = Ensemble.Editor.Renderer._clipDragCurrentLeft - Ensemble.Editor.Renderer._clipDragOriginalLeft - Ensemble.Editor.Renderer._currentSnap.x;
                let ydif = Ensemble.Editor.Renderer._clipDragCurrentTop - Ensemble.Editor.Renderer._clipDragOriginalTop - Ensemble.Editor.Renderer._currentSnap.y;

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
        },

        PointerTargetSize: {
            mouse: 10,
            touch: 20
        }
    });
})();