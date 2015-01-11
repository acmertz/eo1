(function () {
    var Clip = WinJS.Class.define(
        function (idVal, ensembleFile) {
            /// <summary>Manages a single media clip within a project.</summary>
            /// <param name="idVal" type="Number">An ID to represent the Clip. If null, an ID will be automatically generated.</param>
            /// <param name="ensembleFile" type="Ensemble.EnsembleFile">An EnsembleFile that represents</param>

            //Constructor
            this.id = idVal;
            if (this.id == null) this.id = Ensemble.Editor.TimelineMGR.generateNewClipId();            
        },
        {
            //Instance members
            id: null,
            _player: null,

            play: function () {

            },

            pause: function () {

            }

        },
        {
            //Static members
        }
    );

    WinJS.Namespace.define("Ensemble.Editor", {
        Clip: Clip
    });
})();