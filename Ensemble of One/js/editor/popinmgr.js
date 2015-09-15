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
                // Different popin is already active. Depending on its state, request confirmation from the user.
                this._hidePopin(this.activePopin);
                this._showPopin(popin);
            }
            else {
                // No popins active. Show the popin.
                this._showPopin(popin);
            }
            this._evaluateMenuToggles();
        },

        _hidePopin: function (popin) {
            switch (popin) {
                case Ensemble.Editor.PopinMGR.PopinTypes.cameraCapture:
                    if (Ensemble.Editor.MediaCaptureMGR.webcamSessionInProgress()) {
                        // request confirmation from user
                        Ensemble.OSDialogMGR.showDialog("Abandon webcam recording session?", "If you abandon your recording session, your pending clips will be discarded. Are you sure you want to do this?",
                            [
                                { label: "Abandon recording session", handler: Ensemble.Editor.PopinMGR._listeners.confirmAbandonWebcamCaptureSession },
                                { label: "Cancel", handler: null }
                            ],
                            1, 1);
                    }
                    else {
                        // immediately cleanup the session
                        Ensemble.Editor.MediaCaptureMGR.cleanupVideoCaptureSession();
                        WinJS.Utilities.removeClass(this.ui.cameraCapturePopin, "editor-popin--visible");
                        this.activePopin = null;
                        Ensemble.Pages.Editor.viewResized();
                    }
                    break;
            }
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

        _evaluateMenuToggles: function () {
            /// <summary>Checks for any active Popins and updates their menu toggles to function accordingly.</summary>
            let cameraCaptureMenuToggle = document.getElementsByClassName("editor-toolbar-command--record-video")[0];
            if (WinJS.Utilities.hasClass(this.ui.cameraCapturePopin, "editor-popin--visible")) cameraCaptureMenuToggle.winControl.selected = true;
            else cameraCaptureMenuToggle.winControl.selected = false;
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
            confirmAbandonWebcamCaptureSession: function () {
                Ensemble.Editor.MediaCaptureMGR.cleanupVideoCaptureSession(true);
                WinJS.Utilities.removeClass(Ensemble.Editor.PopinMGR.ui.cameraCapturePopin, "editor-popin--visible");
                this.activePopin = null;
                Ensemble.Pages.Editor.viewResized();
            }
        },

        PopinTypes: {
            cameraCapture: "cameraCapture"
        }
    });
})();