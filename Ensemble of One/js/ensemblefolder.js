(function () {
    var EnsembleFolder = WinJS.Class.define(
        function (targetFolder) {
            /// <summary>A file abstraction used within Ensemble for keeping folder references.</summary>
            /// <param name="targetFolder" type="Object">A platform-dependent folder object that the EnsembleFolder will represent.</param>
            /// <param name="targetIcon" type="Object">An optional icon to represent the folder.</param>
            /// <param name="targetFriendlyType" type="Object">An optional user-readable filesystem type for the folder.</param>
            this._src = targetFolder;
            this.icon = "&#xE188;";
            this.type = "folder";
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

            eo1type: "",
        },
        {
            //Static members
        }
    );

    WinJS.Namespace.define("Ensemble", {
        EnsembleFolder: EnsembleFolder
    });
})();