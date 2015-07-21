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
                if (args.detail.previousExecutionState != Windows.ApplicationModel.Activation.ApplicationExecutionState.running) {
                    console.log("Starting Ensemble of One...");
                    Ensemble.Platform.setupApplicationTheme();
                    Ensemble.Session.setCurrentPage("main-menu");
                    Ensemble.Editor.UI.relink();
                    Ensemble.Navigation.init();
                    Ensemble.MainMenu.init();
                    console.info("Ensemble of One started!");
                    args.setPromise(WinJS.UI.processAll());
                }
                switch (args.detail.kind) {
                    case Windows.ApplicationModel.Activation.ActivationKind.file:
                        console.log("Load the activated file here.");
                        if (Ensemble.Session.getCurrentPage() == Ensemble.Session.PageStates.mainMenu) {
                            let loadingPage = document.getElementsByClassName("app-page--loading-editor")[0];
                            $(loadingPage).removeClass("app-page--hidden").addClass("app-page--enter-right");
                            Ensemble.Session.setCurrentPage(Ensemble.Session.PageStates.loadingToEditor);
                            setTimeout(function () {
                                Ensemble.FileIO.loadInternalProject(args.detail.files[0].name, args.detail.files[0]);
                            }, 1000);
                        }
                        else {
                            Ensemble.Pages.Editor.unload(args.detail.files[0]);
                        }
                        break;
                    case Windows.ApplicationModel.Activation.ActivationKind.launch:
                        // Application is launching fresh
                        // Potentially reload a project here, if Ensemble of One was terminated by the system when a project was open.
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