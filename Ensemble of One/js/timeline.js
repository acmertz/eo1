(function () {
    WinJS.Namespace.define("Ensemble.Timeline", {
        /// <summary>Manages the timeline display.</summary>

        setRowsVisible: function (rowsVisible) {
            /// <summary>Sets the number of rows visible in the timeline.</summary>
            /// <param name="rowsVisible" type="Number">The number of rows to show in the timeline.</param>
            var valueToSet = "";
            switch (rowsVisible) {
                case 2:
                    valueToSet = "100%";
                    break;
                case 3:
                    valueToSet = "66.6%";
                    break;
                case 4:
                    valueToSet = "50%";
                    break;
                case 5:
                    valueToSet = "40%";
                    break;
                case 6:
                    valueToSet = "33.3%";
                    break;
            }

            Ensemble.Pages.Editor.UI.PageSections.lowerHalf.timeline.style.backgroundSize = "100px " + valueToSet + ";"
        }
    });
})();