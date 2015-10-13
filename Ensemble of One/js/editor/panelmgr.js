(function () {
    WinJS.Namespace.define("Ensemble.Editor.PanelMGR", {
        /// <summary>Manages Editor pop-in experiences, such as camera capture, metronome, or animation configuration.</summary>

        activePanel: null,

        init: function () {
            this._refreshUI();
        },

        unload: function () {
            this._cleanUI();
            this.activePanel = null;
        },

        requestPanel: function (panel) {
            if (this.activePanel == panel) {
                // Requested the same panel.
                this._hidePanel(panel);
            }
            else if (this.activePanel != null) {
                // Different panel is already active. Depending on its state, request confirmation from the user.
                this._hidePanel(this.activePanel);
                this._showPanel(panel);
            }
            else {
                // No panels active. Show the panel.
                this._showPanel(panel);
            }
            this._evaluateMenuToggles();
        },

        _hidePanel: function (panel) {
            switch (panel) {
                case Ensemble.Editor.PanelMGR.PanelTypes.cameraCapture:
                    if (Ensemble.Editor.MediaCaptureMGR.webcamSessionInProgress()) {
                        // request confirmation from user
                        Ensemble.OSDialogMGR.showDialog("Abandon webcam recording?", "You're in the middle of a webcam recording session. Abandoning the session will cause the clip-in-progress to be discarded.",
                            [
                                { label: "Abandon recording", handler: Ensemble.Editor.PanelMGR._listeners.confirmAbandonWebcamCaptureSession },
                                { label: "Cancel", handler: null }
                            ],
                            1, 1);
                    }
                    else {
                        // immediately cleanup the session
                        Ensemble.Editor.MediaCaptureMGR.cleanupVideoCaptureSession();
                        WinJS.Utilities.removeClass(this.ui.cameraCapturePanel, "editor-panel--visible");
                        this.activePanel = null;
                        Ensemble.Pages.Editor.viewResized();
                    }
                    break;
            }
            if (document.getElementsByClassName("editor-panel--visible").length == 0) {
                WinJS.Utilities.removeClass(Ensemble.Editor.PanelMGR.ui.panelContainer, "editor-panel-container--visible");
                Ensemble.Pages.Editor.viewResized();
            }
        },

        _showPanel: function (panel) {
            WinJS.Utilities.addClass(Ensemble.Editor.PanelMGR.ui.panelContainer, "editor-panel-container--visible");
            switch (panel) {
                case Ensemble.Editor.PanelMGR.PanelTypes.cameraCapture:
                    WinJS.Utilities.addClass(this.ui.cameraCapturePanel, "editor-panel--visible");
                    Ensemble.Editor.MediaCaptureMGR.initVideoCaptureSession();
                    break;
            }
            this.activePanel = panel;
            Ensemble.Pages.Editor.viewResized();
        },

        _evaluateMenuToggles: function () {
            /// <summary>Checks for any active Panels and updates their menu toggles to function accordingly.</summary>
            let cameraCaptureMenuToggle = document.getElementsByClassName("editor-toolbar-command--record-video")[0];
            if (WinJS.Utilities.hasClass(this.ui.cameraCapturePanel, "editor-panel--visible")) cameraCaptureMenuToggle.winControl.selected = true;
            else cameraCaptureMenuToggle.winControl.selected = false;
        },

        ui: {
            panelContainer: null,
            cameraCapturePanel: null
        },

        _refreshUI: function () {
            this.ui.panelContainer = document.getElementsByClassName("editor-panel-container")[0];
            this.ui.cameraCapturePanel = document.getElementsByClassName("editor-panel--camera-capture")[0];
        },

        _cleanUI: function () {
            this.ui.panelContainer = null;
            this.ui.cameraCapturePanel = null;
        },

        _listeners: {
            confirmAbandonWebcamCaptureSession: function () {
                Ensemble.Editor.MediaCaptureMGR.cleanupVideoCaptureSession(true);
                WinJS.Utilities.removeClass(Ensemble.Editor.PanelMGR.ui.cameraCapturePanel, "editor-panel--visible");
                this.activePanel = null;
                Ensemble.Pages.Editor.viewResized();
            }
        },

        PanelTypes: {
            cameraCapture: "cameraCapture"
        }
    });
})();