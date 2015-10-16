(function () {
    WinJS.Namespace.define("Ensemble.Editor.PanelMGR", {
        /// <summary>Manages Editor pop-in experiences, such as camera capture, metronome, or animation configuration.</summary>

        init: function () {
            this._refreshUI();
        },

        unload: function () {
            this._cleanUI();
        },

        closePanel: function (panel) {
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
                    }
                    break;
                case Ensemble.Editor.PanelMGR.PanelTypes.micCapture:

                    break;
            }

            let hidingPanel = document.getElementsByClassName("editor-panel--" + panel)[0];
            WinJS.Utilities.removeClass(hidingPanel, "editor-panel--visible");

            let hidingTab = document.getElementsByClassName("editor-panel-tab--" + panel)[0];
            WinJS.Utilities.removeClass(hidingTab, "editor-panel-tab--visible");
            WinJS.Utilities.removeClass(hidingTab, "editor-panel-tab--active");

            if (document.getElementsByClassName("editor-panel--visible").length == 0) {
                WinJS.Utilities.removeClass(Ensemble.Editor.PanelMGR.ui.panelContainer, "editor-panel-container--visible");
                Ensemble.Pages.Editor.viewResized();
            }
        },

        showPanel: function (panel) {
            WinJS.Utilities.addClass(Ensemble.Editor.PanelMGR.ui.panelContainer, "editor-panel-container--visible");
            switch (panel) {
                case Ensemble.Editor.PanelMGR.PanelTypes.cameraCapture:
                    Ensemble.Editor.MediaCaptureMGR.initVideoCaptureSession();
                    break;
            }

            let showingPanel = document.getElementsByClassName("editor-panel--" + panel)[0];
            WinJS.Utilities.addClass(showingPanel, "editor-panel--visible");
            
            let showingTab = document.getElementsByClassName("editor-panel-tab--" + panel)[0],
                allTabs = document.getElementsByClassName("editor-panel-tab"),
                tabCount = allTabs.length;

            for (let i=0; i<tabCount; i++) {
                WinJS.Utilities.removeClass(allTabs[i], "editor-panel-tab--active");
            }

            WinJS.Utilities.addClass(showingTab, "editor-panel-tab--visible");
            WinJS.Utilities.addClass(showingTab, "editor-panel-tab--active");
            Ensemble.Pages.Editor.viewResized();
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
                Ensemble.Editor.MediaCaptureMGR.cancelCurrentWebcamSession()
                Ensemble.Editor.PanelMGR.closePanel(Ensemble.Editor.PanelMGR.PanelTypes.cameraCapture);
            },

            panelTabClicked: function (event) {
                let targetPanel = event.currentTarget.dataset.editorPanel;
                if (targetPanel.length > 0) console.log("Switch to panel \"" + targetPanel + "\"");
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