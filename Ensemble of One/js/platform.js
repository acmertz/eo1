(function () {
    WinJS.Namespace.define("Ensemble.Platform", {
        /// <summary>Exposes information about the platform on which the application is currently running.</summary>
        currentPlatform: "windows",

        setupApplicationTheme: function () {
            /// <summary>Initializes the application theme (window chrome, etc.).</summary>
            let appView = Windows.UI.ViewManagement.ApplicationView.getForCurrentView();
            let primaryColor = Windows.UI.ColorHelper.fromArgb(255, 220, 20, 60);
            let hoverColor = Windows.UI.ColorHelper.fromArgb(255, 230, 90, 118);
            let textColor = Windows.UI.ColorHelper.fromArgb(255, 255, 255, 255);
            let textFade = Windows.UI.ColorHelper.fromArgb(255, 248, 208, 216);
            appView.titleBar.backgroundColor = primaryColor;
            appView.titleBar.foregroundColor = textColor;
            appView.titleBar.inactiveBackgroundColor = primaryColor;
            appView.titleBar.inactiveForegroundColor = textFade;
            appView.titleBar.buttonBackgroundColor = primaryColor;
            appView.titleBar.buttonForegroundColor = textColor;
            appView.titleBar.buttonInactiveBackgroundColor = primaryColor;
            appView.titleBar.buttonInactiveForegroundColor = textFade;
            appView.titleBar.buttonHoverBackgroundColor = hoverColor;
            appView.titleBar.buttonHoverForegroundColor = textColor;
            appView.titleBar.buttonPressedBackgroundColor = textColor;
            appView.titleBar.buttonPressedForegroundColor = primaryColor;
        },

        _listeners: {
            appActivated: function (args) {
                switch (args.detail.kind) {
                    case Windows.ApplicationModel.Activation.ActivationKind.file:
                        console.log("Load the activated file here.");
                        break;
                    case Windows.ApplicationModel.Activation.ActivationKind.launch:
                        switch (args.detail.previousExecutionState) {
                            case Windows.ApplicationModel.Activation.ApplicationExecutionState.running:
                                console.log("Ensemble of One was activated via a secondary tile or file/share contract.");
                                break;
                            case Windows.ApplicationModel.Activation.ApplicationExecutionState.terminated:
                            case Windows.ApplicationModel.Activation.ApplicationExecutionState.suspended:
                            default:
                                console.info("Starting Ensemble of One...");

                                Ensemble.Platform.setupApplicationTheme();
                                Ensemble.Session.setCurrentPage("mainMenu");
                                Ensemble.Editor.UI.relink();

                                Ensemble.Navigation.init();
                                Ensemble.MainMenu.init();
                                console.info("Ensemble of One started!");
                                args.setPromise(WinJS.UI.processAll());
                                break;                                
                        }
                        break;
                }
            },

            appCheckpoint: function (args) {
                // TODO: This application is about to be suspended. Save any state that needs to persist across suspensions here.
                // You might use the WinJS.Application.sessionState object, which is automatically saved and restored across suspension.
                // If you need to complete an asynchronous operation before your application is suspended, call args.setPromise().
                console.info("Ensemble of One is going down for suspend.");
            }
        }
    });
})();