(function () {
    var EnsembleFile = WinJS.Class.define(
        function (targetFile) {
            /// <summary>A file abstraction used within Ensemble for keeping file references.</summary>
            /// <param name="targetFile" type="Object">A platform-dependent file object that the EnsembleFolder will represent.</param>

            this._src = targetFile;
            this.icon = "&#xE132;";

            this.mime = "Unknown";
            this.dateCreated = "Unknown";
            this.displayName = "Unnamed";
            this.displayType = "Unknown";
            this.fileType = "Unknown";
            this._winFolderRelativeId = "";
            this._winProperties = null;
            this.fullName = "Unknown";
            this.path = "Unknown";

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
            this.title= "Unknown";
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
            _winFolderRelativeId: null,
            _winProperties: null,
            fullName: "",
            path: "",

            //One of "video", "audio", "image", "file", or "folder"
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