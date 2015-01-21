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
            this.volume = 1;
            this.width = 0;
            this.height = 0;
            this.xcoord = 0;
            this.ycoord = 0;
        },
        {
            //Instance members
            id: null,
            /// <summary>The file.</summary>
            file: null,
            name: null,
            duration: null,
            startTime: null,
            volume: null,
            width: null,
            height: null,
            xcoord: null,
            ycoord: null,
            type: null,

            _player: null,



            play: function () {
                /// <summary>Begins playback of the Clip.</summary>
                this._player.play();
            },

            pause: function () {
                /// <summary>Pauses playback of the Clip.</summary>
                this._player.pause();
            },

            seek: function (ms) {
                /// <summary>Seeks the Clip to the given time in milliseconds.</summary>
                /// <param name="ms" type="Number">The time in milliseconds.</param>
                let seekTime = ms;
                if (this.startTime > seekTime) seekTime = this.startTime;
                else if (seekTime > this.startTime + this.duration) seekTime = this.startTime + this.duration;
                this._player.currentTime = seekTime / 1000;
            },

            setPlayer: function (playerObj) {
                /// <summary>Sets the player to be used by the Clip.</summary>
                /// <param name="playerObj" type="Object">The HTML video, audio, or img element that will represent this clip.</param>
                this._player = playerObj;
                this._player.controls = false;
                this._player.msRealTime = true;
                // todo: set relevant listeners on the player.
                this._player.addEventListener("seeked", Ensemble.Editor.PlaybackMGR._listeners.clipSeeked);
            },

            drawToCanvas: function (context, scale) {
                /// <summary>Draws the clip to the specified canvas at the given scale.</summary>
                /// <param name="canvas" type="Canvas">The canvas to use as a rendering target.</param>
                /// <param name="scale" type="Number">A scale multiplier to use when drawing.</param>
                context.drawImage(this._player, this.xcoord * scale, this.ycoord * scale, this.width * scale, this.height * scale);
            }

        },
        {
            //Static members
            ClipType: {
                video: "video",
                audio: "audio",
                picture: "picture",
                unknown: "unknown"
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