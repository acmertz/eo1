(function () {
    var Clip = WinJS.Class.define(
        function (idVal) {
            /// <summary>Manages a single media clip within a project.</summary>
            /// <param name="idVal" type="Number">An ID to represent the Clip. If null, an ID will be automatically generated.</param>

            //Constructor
            this.id = idVal;
            if (this.id == null) this.id = Ensemble.Editor.TimelineMGR.generateNewClipId();

            this.name = "Untitled clip";
            this.duration = 0;
            this.startTime = 0;
            this.startTrim = 0;
            this.endTrim = 0;
            this.volume = 1;
            this.volumeModifier = 1;
            this.width = 0;
            this.height = 0;
            this.aspect = "";
            this.xcoord = 0;
            this.ycoord = 0;
            this.preExisting = true;

            this._effectCanvas = fx.canvas();
            this._effectIntermediateCanvas = document.createElement("canvas");

            this.selected = false;
            this.hovering = false;
        },
        {
            //Instance members
            id: null,
            /// <summary>The file.</summary>
            file: null,
            name: null,
            duration: null,
            startTime: null,
            startTrim: null,
            endTrim: null,
            volume: null,
            volumeModifier: null,
            width: null,
            height: null,
            aspect: null,
            xcoord: null,
            ycoord: null,
            type: null,
            preExisting: null,

            _effectCanvas: null,
            _effectIntermediateCanvas: null,
            _effectTexture: null,

            _player: null,
            _intAspect: null,
            selected: null,
            hovering: null,



            play: function () {
                /// <summary>Begins playback of the Clip.</summary>
                if (this.type == Ensemble.Editor.Clip.ClipType.video || this.type == Ensemble.Editor.Clip.ClipType.audio) this._player.play();
            },

            pause: function () {
                /// <summary>Pauses playback of the Clip.</summary>
                if (this.type == Ensemble.Editor.Clip.ClipType.video || this.type == Ensemble.Editor.Clip.ClipType.audio) this._player.pause();
            },

            seek: function (ms) {
                /// <summary>Seeks the Clip to the given time in milliseconds.</summary>
                /// <param name="ms" type="Number">The time in milliseconds.</param>
                if (this.type == Ensemble.Editor.Clip.ClipType.picture || this.type == Ensemble.Editor.Clip.ClipType.lens) {
                    Ensemble.Editor.PlaybackMGR._listeners.clipSeeked();
                }
                else {
                    let seekTime = ms;
                    if (this.startTime > seekTime) seekTime = this.startTime;
                    else if (seekTime > this.startTime + this.duration) seekTime = this.startTime + this.duration;
                    this._player.currentTime = ((seekTime - this.startTime) + this.startTrim) / 1000;
                }
            },

            setPlayer: function (playerObj) {
                /// <summary>Sets the player to be used by the Clip.</summary>
                /// <param name="playerObj" type="Object">The HTML video, audio, or img element that will represent this clip.</param>
                this._player = playerObj;
                if (this.type != Ensemble.Editor.Clip.ClipType.picture) {
                    this._player.controls = false;
                    this._player.msRealTime = true;
                    this._player.addEventListener("seeked", Ensemble.Editor.PlaybackMGR._listeners.clipSeeked);
                }
            },

            setMetadata: function (metadata) {
                /// <summary>Sets the metadata for the attached file, if it exists.</summary>
                if (this.file && this.file != null) {
                    if (this.type == Ensemble.Editor.Clip.ClipType.video) {
                        this.file.bitrate = metadata.bitrate;
                        this.file.duration = metadata.duration;
                        this.file.height = metadata.height;
                        this.file.width = metadata.width;
                        this.file.title = metadata.title;
                    }

                    else if (this.type == Ensemble.Editor.Clip.ClipType.audio) {
                        this.file.bitrate = metadata.bitrate;
                        this.file.duration = metadata.duration;
                        this.file.title = metadata.title;
                        this.file.album = metadata.album;
                        this.file.albumArtist = metadata.albumArtist;
                        this.file.artist = metadata.artist;
                        this.file.genre = metadata.genre;
                    }

                    else if (this.type == Ensemble.Editor.Clip.ClipType.picture) {
                        this.file.title = metadata.title;
                        this.file.dateTaken = metadata.dateTaken;
                        this.file.height = metadata.height;
                        this.file.width = metadata.width;
                    }
                }
            },

            setVolume: function (val) {
                /// <summary>Sets the volume of the clip. Note that the clip's actual playback volume may be limited by the volume of the Track containing it.</summary>
                /// <param name="val" type="Number">The volume level to assign to the clip. Must be a decimal value between 0.0 and 1.0.</param>
                this.volume = val;
                this._player.volume = this.volume * this.volumeModifier;
            },

            setVolumeModifier: function (val) {
                /// <summary>Sets the volume modifier of the clip.</summary>
                /// <param name="val" type="Number">The volume modifier to assign to the clip. Must be a decimal value between 0.0 and 1.0.</param>
                if (this.type != Ensemble.Editor.Clip.ClipType.lens) {
                    this.volumeModifier = val;
                    this._player.volume = this.volume * this.volumeModifier;
                }
            },

            drawToCanvas: function (context, scale) {
                /// <summary>Draws the clip to the specified canvas at the given scale.</summary>
                /// <param name="canvas" type="Canvas">The canvas to use as a rendering target.</param>
                /// <param name="scale" type="Number">A scale multiplier to use when drawing.</param>
                let drawX = this.xcoord * scale;
                let drawY = this.ycoord * scale;
                let drawWidth = this.width * scale;
                let drawHeight = this.height * scale;

                if (this.type == Ensemble.Editor.Clip.ClipType.lens) {
                    // apply lens effect
                    this._effectIntermediateCanvas.width = drawWidth;
                    this._effectIntermediateCanvas.height = drawHeight;
                    let tempContext = this._effectIntermediateCanvas.getContext("2d");
                    tempContext.putImageData(context.getImageData(drawX, drawY, drawWidth, drawHeight), 0, 0);
                    
                    if (this._effectTexture == null) this._effectTexture = this._effectCanvas.texture(this._effectIntermediateCanvas);
                    else this._effectTexture.loadContentsOf(this._effectIntermediateCanvas);

                    this._effectCanvas.draw(this._effectTexture).ink(0.25).update();

                    let pixelArray = this._effectCanvas.getPixelArray();
                }

                else context.drawImage(this._player, drawX, drawY, drawWidth, drawHeight);

                if (this.type == Ensemble.Editor.Clip.ClipType.audio) console.warn("Nooo! You're rendering audio to the canvas!!!1!1!!11!!!one!!");

                if (this.selected) {
                    context.beginPath();
                    context.strokeStyle = "blue";
                    context.fillStyle = "lightgray";
                    let cornerTargetSize = Ensemble.Editor.Renderer._currentPointerTargetSize;
                    context.rect(drawX, drawY, cornerTargetSize, cornerTargetSize);
                    context.rect((drawX + drawWidth) - cornerTargetSize, drawY, cornerTargetSize, cornerTargetSize);
                    context.rect((drawX + drawWidth) - cornerTargetSize, (drawY + drawHeight) - cornerTargetSize, cornerTargetSize, cornerTargetSize);
                    context.rect(drawX, (drawY + drawHeight) - cornerTargetSize, cornerTargetSize, cornerTargetSize);
                    context.fill();
                    context.stroke();
                    context.beginPath();
                    context.strokeStyle = "lightgray";
                    context.lineWidth = "1";
                    context.rect(drawX, drawY, drawWidth, drawHeight);
                    context.stroke();
                }
                
                if (this.hovering) {
                    context.beginPath();
                    context.fillStyle = "rgba(211, 211, 211, 0.25)";
                    context.lineWidth = "1";
                    context.rect(drawX, drawY, drawWidth, drawHeight);
                    context.fill();
                }
                
            },

            timeCollision: function (id, start, end) {
                /// <summary>Returns whether or not the given times specify with this clip.</summary>
                /// <param name="id" type="Number">The ID of the clip whose collision we are checking.</param>
                /// <param name="start" type="Number">The start bound.</param>
                /// <param name="end" type="Number">The end bound.</param>
                if (id != this.id) {
                    let curEndTime = this.startTime + this.duration;
                    if (curEndTime >= start && start >= this.startTime) return true;
                    if (curEndTime >= end && end >= this.startTime) return true;
                    if (end >= curEndTime && curEndTime >= start) return true;
                    if (end >= this.startTime && this.startTime >= start) return true;
                }
                return false;
            },

            containsPoint: function (xcoord, ycoord) {
                /// <summary>Returns whether or not the given point is contained by the clip's dimensions and position.</summary>
                /// <param name="xcoord" type="Number">The X-coordinate.</param>
                /// <param name="ycoord" type="Number">The Y-coordinate.</param>
                /// <returns type="Boolean">A Boolean indicating whether or not the clip bounds the given coordinates.</returns>
                if (xcoord >= this.xcoord && (this.xcoord + this.width) >= xcoord && ycoord >= this.ycoord && (this.ycoord + this.height) >= ycoord) return true;
                return false;
            },

            getClickedBound: function (xcoord, ycoord) {
                /// <summary>Returns the corner number, starting with 0 for the top left and incrementing clockwise, that contains the given coordinates. Returns -1 if no corner was clicked.</summary>
                /// <param name="xcoord" type="Number">The X coordinate.</param>
                /// <param name="ycoord" type="Number">The Y coordinate.</param>
                let resizeThreshold = Ensemble.Editor.Renderer._currentPointerTargetSize / Ensemble.Editor.Renderer._scale;
                let corner = -1;
                let edge = -1;
                if (this.ycoord <= ycoord && ycoord <= this.ycoord + resizeThreshold) {
                    if (this.xcoord <= xcoord && xcoord <= this.xcoord + resizeThreshold) {
                        corner = 0;
                    }
                    else edge = 0;
                }
                if ((this.xcoord + this.width) - resizeThreshold <= xcoord && xcoord <= this.xcoord + this.width && 0 > corner) {
                    if (this.ycoord <= ycoord && ycoord <= this.ycoord + resizeThreshold) {
                        corner = 1;
                    }
                    else edge = 1;
                }
                if ((this.ycoord + this.height) - resizeThreshold <= ycoord && ycoord <= this.ycoord + this.height && 0 > corner) {
                    if ((this.xcoord + this.width) - resizeThreshold <= xcoord && xcoord <= this.xcoord + this.width) {
                        corner = 2;
                    }
                    else edge = 2;
                }
                if (this.xcoord <= xcoord && xcoord <= this.xcoord + resizeThreshold && 0 > corner) {
                    if ((this.ycoord + this.height) - resizeThreshold <= ycoord && ycoord <= this.ycoord + this.height) {
                        corner = 3;
                    }
                    else edge = 3;
                }
                return {
                    corner: corner,
                    edge: edge
                };
            },

            getEdges: function (multiplier) {
                /// <summary>Returns an object containing all the edge lines that make up the clip.</summary>
                /// <param type="Number" name="multiplier">Optional. A value by which to multiply the returned values. Useful for conditions where the coordinates must be scaled before rendering.</param>
                /// <returns type="Object">An object containing the points for the top, right, bottom, and left edges.</returns>
                let ratio = multiplier || 1;
                let returnVal = {
                    top: {
                        x1: ratio * this.xcoord,
                        x2: ratio * (this.xcoord + this.width),
                        y1: ratio * this.ycoord,
                        y2: ratio * this.ycoord
                    },
                    right: {
                        x1: ratio * (this.xcoord + this.width),
                        x2: ratio * (this.xcoord + this.width),
                        y1: ratio * this.ycoord,
                        y2: ratio * (this.ycoord + this.height)
                    },
                    bottom: {
                        x1: ratio * this.xcoord,
                        x2: ratio * (this.xcoord + this.width),
                        y1: ratio * (this.ycoord + this.height),
                        y2: ratio * (this.ycoord + this.height)
                    },
                    left: {
                        x1: ratio * this.xcoord,
                        x2: ratio * this.xcoord,
                        y1: ratio * this.ycoord,
                        y2: ratio * (this.ycoord + this.height)
                    }
                };
                returnVal.top.id = returnVal.right.id = returnVal.bottom.id = returnVal.left.id = this.id;
                returnVal.top.coords = returnVal.right.coords = returnVal.bottom.coords = returnVal.left.coords = {
                    x: ratio * this.xcoord,
                    y: ratio * this.ycoord
                };
                returnVal.top.dimensions = returnVal.right.dimensions = returnVal.bottom.dimensions = returnVal.left.dimensions = {
                    width: ratio * this.width,
                    height: ratio * this.height
                };

                return returnVal;
            },

            isRenderable: function () {
                /// <summary>Returns whether or not the clip can be drawn to the screen (i.e., is either a video or image file).</summary>
                /// <returns type="Boolean">Whether or not the clip is renderable.</returns>
                if (this.type == Ensemble.Editor.Clip.ClipType.video || this.type == Ensemble.Editor.Clip.ClipType.picture || this.type == Ensemble.Editor.Clip.ClipType.lens) return true;
                return false;
            },

            unload: function () {
                /// <summary>Unloads the clip and turns its file reference into a stub.</summary>
                if (this.type == Ensemble.Editor.Clip.ClipType.lens) { }
                else {
                    let domPlayer = document.getElementById(this._player.id);
                    this._player.src = null;
                    this._player = null;
                    domPlayer.parentNode.removeChild(domPlayer);
                    this.file = {
                        path: this.file.path,
                        token: this.file.token
                    }
                }
            }

        },
        {
            //Static members
            ClipType: {
                video: "video",
                audio: "audio",
                picture: "picture",
                lens: "lens",
                unknown: "unknown"
            },

            LensType: {
                grayscale: "grayscale"
            },

            CollisionType: {
                clipEnd: "clipEnd",
                clipBeginning: "clipBeginning",
                clipContains: "clipContains"
            }
        }
    );

    WinJS.Namespace.define("Ensemble.Editor", {
        Clip: Clip
    });
})();