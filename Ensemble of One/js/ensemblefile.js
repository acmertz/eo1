(function () {
    var EnsembleFile = WinJS.Class.define(
        function (targetFile) {
            /// <summary>A file abstraction used within Ensemble for keeping file references.</summary>
            /// <param name="targetFile" type="Object">A platform-dependent file object that the EnsembleFile will represent.</param>

            this._src = targetFile;
            this.icon = "&#xE132;";

            this.mime = "";
            this.dateCreated = "";
            this.displayName = "";
            this.displayType = "";
            this.fileType = "";
            this._uniqueId = "";
            this._winProperties = null;
            this.fullName = "";
            this.path = "";
            this.token = "";
            this.thumb = "";

            this.eo1type = "file";

            //Media properties
            this.album= "";
            this.albumArtist= "";
            this.artist= "";
            this.bitrate= 0;
            this.dateTaken= null;
            this.duration= 0;
            this.genre= "";
            this.height= 0;
            this.width= 0;
            this.title= "";
        },
        {
            //Instance members
            _src: null,
            icon: "",

            mime: null,
            dateCreated: null,
            displayName: "",
            displayType: "",
            fileType: "",
            _uniqueId: null,
            _winProperties: null,
            fullName: "",
            path: "",
            token: "",
            thumb: "",

            //One of "video", "audio", "picture", "file", or "folder"
            eo1type: "",

            //Media properties
            album: "",
            albumArtist: "",
            artist: "",
            bitrate: 0,
            dateTaken: null,
            duration: 0, //milliseconds?
            genre: "",
            height: 0,
            width: 0,
            title: "Unknown"
        },
        {
            //Static members
        }
    );

    WinJS.Namespace.define("Ensemble", {
        EnsembleFile: EnsembleFile
    });
})();