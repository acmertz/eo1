(function () {
    WinJS.Namespace.define("Ensemble.Editor.PanelMGR", {
        /// <summary>Manages Editor pop-in experiences, such as camera capture, metronome, or animation configuration.</summary>

        init: function () {
            this._refreshUI();
        },

        unload: function () {
            this._cleanUI();
        },

        requestPanel: function (panel, options) {
            /// <summary>Requests that the specified panel be displayed. Initializes it if it was not previously open; switches to it if it's already open.</summary>
            /// <param name="panel" type="String">The panel type to request.</param>
            /// <param name="options" type="Object">An object to pass to the panel's initializer.</param>
            let requestedPanel = document.getElementsByClassName("editor-panel--" + panel)[0];
            if (WinJS.Utilities.hasClass(requestedPanel, "editor-panel--active")) Ensemble.Editor.PanelMGR.switchToPanel(panel, options);
            else Ensemble.Editor.PanelMGR.openPanel(panel, options);
        },

        closePanel: function (panel) {
            /// <summary>Closes the panel with the given identifier.</summary>
            let safeToClose = false;
            switch (panel) {
                case Ensemble.Editor.PanelMGR.PanelTypes.cameraCapture:
                    if (Ensemble.Editor.VideoCaptureMGR.webcamSessionInProgress()) {
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
                        Ensemble.Editor.VideoCaptureMGR.cleanupVideoCaptureSession();
                        safeToClose = true;
                    }
                    break;
                case Ensemble.Editor.PanelMGR.PanelTypes.micCapture:
                    if (Ensemble.Editor.AudioCaptureMGR.sessionInProgress()) {
                        Ensemble.OSDialogMGR.showDialog("Abandon microphone recording?", "You're in the middle of a microphone recording session. Abandoning the session will cause the clip-in-progress to be discarded.",
                            [
                                { label: "Abandon recording", handler: Ensemble.Editor.PanelMGR._listeners.confirmAbandonMicCaptureSession },
                                { label: "Cancel", handler: null }
                            ],
                            1, 1);
                    }
                    else {
                        Ensemble.Editor.AudioCaptureMGR.cleanupCaptureSession();
                        safeToClose = true;
                    }
                    break;
                default:
                    safeToClose = true;
                    break;
            }

            if (safeToClose) {
                let hidingPanel = document.getElementsByClassName("editor-panel--" + panel)[0];
                WinJS.Utilities.removeClass(hidingPanel, "editor-panel--visible");
                WinJS.Utilities.removeClass(hidingPanel, "editor-panel--active");

                let hidingTab = document.getElementsByClassName("editor-panel-tab--" + panel)[0];
                WinJS.Utilities.removeClass(hidingTab, "editor-panel-tab--visible");
                WinJS.Utilities.removeClass(hidingTab, "editor-panel-tab--active");

                let remainingActivePanels = document.getElementsByClassName("editor-panel--active");
                if (remainingActivePanels.length > 0) {
                    Ensemble.Editor.PanelMGR.switchToPanel(remainingActivePanels[0].dataset.editorPanel);
                }
                else {
                    WinJS.Utilities.removeClass(Ensemble.Editor.PanelMGR.ui.panelContainer, "editor-panel-container--visible");
                    Ensemble.Pages.Editor.viewResized();
                }
            }
        },

        openPanel: function (panel, options) {
            /// <summary>Shows the panel with the given identifier, initializing it if it was not previously open.</summary>
            /// <param name="panel" type="String">The panel type to request.</param>
            /// <param name="options" type="Object">An object to pass to the panel's initializer.</param>
            WinJS.Utilities.addClass(Ensemble.Editor.PanelMGR.ui.panelContainer, "editor-panel-container--visible");
            switch (panel) {
                case Ensemble.Editor.PanelMGR.PanelTypes.cameraCapture:
                    Ensemble.Editor.VideoCaptureMGR.initCaptureSession();
                    break;
                case Ensemble.Editor.PanelMGR.PanelTypes.micCapture:
                    Ensemble.Editor.AudioCaptureMGR.initCaptureSession();
                    break;
                case Ensemble.Editor.PanelMGR.PanelTypes.effect:
                    break;
            }

            let showingPanel = document.getElementsByClassName("editor-panel--" + panel)[0];
            WinJS.Utilities.addClass(showingPanel, "editor-panel--active");
            
            let showingTab = document.getElementsByClassName("editor-panel-tab--" + panel)[0],
                allTabs = document.getElementsByClassName("editor-panel-tab"),
                tabCount = allTabs.length;

            for (let i=0; i<tabCount; i++) {
                WinJS.Utilities.removeClass(allTabs[i], "editor-panel-tab--active");
            }

            WinJS.Utilities.addClass(showingTab, "editor-panel-tab--visible");
            Ensemble.Editor.PanelMGR.switchToPanel(panel, options);
            Ensemble.Pages.Editor.viewResized();
        },

        switchToPanel: function (panel, options) {
            /// <summary>Switches the panel area to show the panel with given identifier.</summary>
            let existingPanel = document.getElementsByClassName("editor-panel--visible")[0],
                existingTab = document.getElementsByClassName("editor-panel-tab--active")[0],
                newPanel = document.getElementsByClassName("editor-panel--" + panel)[0],
                newTab = document.getElementsByClassName("editor-panel-tab--" + panel)[0];
            if (existingPanel != newPanel) {
                if (existingPanel != null) WinJS.Utilities.removeClass(existingPanel, "editor-panel--visible");
                if (existingTab != null) WinJS.Utilities.removeClass(existingTab, "editor-panel-tab--active");
                WinJS.Utilities.addClass(newPanel, "editor-panel--visible");
                WinJS.Utilities.addClass(newTab, "editor-panel-tab--active");
            }

            switch (panel) {
                case Ensemble.Editor.PanelMGR.PanelTypes.cameraCapture:
                    Ensemble.Editor.VideoCaptureMGR.switchedTo(options);
                    break;
                
                case Ensemble.Editor.PanelMGR.PanelTypes.micCapture:
                    Ensemble.Editor.AudioCaptureMGR.switchedTo(options);
                    break;

                case Ensemble.Editor.PanelMGR.PanelTypes.effect:
                    Ensemble.Editor.EffectMGR.switchedTo(options);
                    break;
            }
        },

        ui: {
            panelContainer: null,
            cameraCapturePanel: null,
            panelCloseButton: null
        },

        _refreshUI: function () {
            this.ui.panelContainer = document.getElementsByClassName("editor-panel-container")[0];
            this.ui.cameraCapturePanel = document.getElementsByClassName("editor-panel--webcam")[0];
            this.ui.panelCloseButton = document.getElementsByClassName("editor-panel-close-button")[0];

            this.ui.panelCloseButton.addEventListener("pointerdown", Ensemble.Editor.PanelMGR._listeners.panelCloseClicked);

            let panelTabs = document.getElementsByClassName("editor-panel-tab"),
                tabCount = panelTabs.length;
            for (let i = 0; i < tabCount; i++) {
                panelTabs[i].addEventListener("pointerdown", Ensemble.Editor.PanelMGR._listeners.panelTabClicked);
            }
        },

        _cleanUI: function () {
            this.ui.panelCloseButton.removeEventListener("pointerdown", Ensemble.Editor.PanelMGR._listeners.panelCloseClicked);

            let panelTabs = document.getElementsByClassName("editor-panel-tab"),
                tabCount = panelTabs.length;
            for (let i = 0; i < tabCount; i++) {
                panelTabs[i].removeEventListener("pointerdown", Ensemble.Editor.PanelMGR._listeners.panelTabClicked);
            }

            this.ui.panelContainer = null;
            this.ui.cameraCapturePanel = null;
            this.ui.panelCloseButton = null;
        },

        _listeners: {
            confirmAbandonWebcamCaptureSession: function () {
                Ensemble.Editor.VideoCaptureMGR.cancelCurrentWebcamSession()
                Ensemble.Editor.PanelMGR.closePanel(Ensemble.Editor.PanelMGR.PanelTypes.cameraCapture);
            },

            confirmAbandonMicCaptureSession: function () {
                Ensemble.Editor.AudioCaptureMGR.cancelCurrentSession();
                Ensemble.Editor.PanelMGR.closePanel(Ensemble.Editor.PanelMGR.PanelTypes.micCapture);
            },

            panelTabClicked: function (event) {
                let targetPanel = event.currentTarget.dataset.editorPanel;
                if (targetPanel.length > 0) {
                    switch (event.button) {
                        case 0:
                            Ensemble.Editor.PanelMGR.switchToPanel(targetPanel);
                            break;
                        case 1:
                            Ensemble.Editor.PanelMGR.closePanel(targetPanel);
                            break;
                        case 2:
                            break;
                    }
                }
                else console.error("Invalid panel tab clicked.");
            },

            panelCloseClicked: function (event) {
                console.log("Close the visible panel.");
                let activePanel = document.getElementsByClassName("editor-panel--visible")[0],
                    panelId = activePanel.dataset.editorPanel;
                Ensemble.Editor.PanelMGR.closePanel(panelId);
            }
        },

        PanelTypes: {
            cameraCapture: "webcam",
            micCapture: "mic"
        }
    });
})();