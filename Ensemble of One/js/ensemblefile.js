(function () {
    var EnsembleFile = WinJS.Class.define(
        function (targetFile) {
            /// <summary>A file abstraction used within Ensemble for keeping file references.</summary>
            /// <param name="targetFile" type="Object">A platform-dependent file object that the EnsembleFolder will represent.</param>
            this._src = targetFile;
            this._icon = "";
            this._type = "";
        },
        {
            //Instance members
        },
        {
            //Static members
        }
    );

    WinJS.Namespace.define("Ensemble", {
        EnsembleFile: EnsembleFile
    });
})();