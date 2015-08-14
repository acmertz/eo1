(function () {
    WinJS.Namespace.define("Ensemble.Editor.PopinMGR", {
        /// <summary>Manages Editor pop-in experiences, such as camera capture, metronome, or animation configuration.</summary>

        activePopin: null,

        init: function () {
            this._refreshUI();
        },

        unload: function () {
            this._cleanUI();
            this.activePopin = null;
        },

        requestPopin: function (popin) {
            if (this.activePopin == popin) {
                // Requested the same popin.
                this._hidePopin(popin);
            }
            else if (this.activePopin != null) {
                // Popin is already active. Depending on its state, request confirmation from the user.
                this._hidePopin(this.activePopin);
                this._showPopin(popin);
            }
            else {
                // No popins active. Show the popin.
                this._showPopin(popin);
            }
            
        },

        _hidePopin: function (popin) {
            switch (popin) {
                case Ensemble.Editor.PopinMGR.PopinTypes.cameraCapture:
                    WinJS.Utilities.removeClass(this.ui.cameraCapturePopin, "editor-popin--visible");
                    Ensemble.Editor.MediaCaptureMGR.cancelVideoCaptureSession();
                    break;
            }
            this.activePopin = null;
            Ensemble.Pages.Editor.viewResized();
        },

        _showPopin: function (popin) {
            switch (popin) {
                case Ensemble.Editor.PopinMGR.PopinTypes.cameraCapture:
                    WinJS.Utilities.addClass(this.ui.cameraCapturePopin, "editor-popin--visible");
                    Ensemble.Editor.MediaCaptureMGR.initVideoCaptureSession();
                    break;
            }
            this.activePopin = popin;
            Ensemble.Pages.Editor.viewResized();
        },

        ui: {
            cameraCapturePopin: null
        },

        _refreshUI: function () {
            this.ui.cameraCapturePopin = document.getElementsByClassName("editor-popin--camera-capture")[0];
        },

        _cleanUI: function () {
            this.ui.cameraCapturePopin = null;
        },

        _listeners: {
        },

        PopinTypes: {
            cameraCapture: "cameraCapture"
        }
    });
})();