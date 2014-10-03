(function () {
    var EnsembleFolder = WinJS.Class.define(
        function (targetFolder) {
            /// <summary>A file abstraction used within Ensemble for keeping folder references.</summary>
            /// <param name="targetFolder" type="Object">A platform-dependent folder object that the EnsembleFolder will represent.</param>
            this._src = targetFolder;
            this._icon = "&#xE188;";
            this._type = "folder";
        },
        {
            //Instance members
        },
        {
            //Static members
        }
    );

    WinJS.Namespace.define("Ensemble", {
        EnsembleFolder: EnsembleFolder
    });
})();