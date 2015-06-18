// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509
var myGreatGlobalVids = [];
(function () {
	"use strict";

	var app = WinJS.Application;
	var activation = Windows.ApplicationModel.Activation;

	app.onactivated = function (args) {
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

	    if (Ensemble.Platform.currentPlatform == null) {
	        args.setPromise(WinJS.UI.processAll());
	        Ensemble.Platform.setCurrentPlatform("win8");
	        Ensemble.Session.setCurrentPage("mainMenu");
	        Ensemble.Editor.UI.relink();
	    }
	    if (args.detail.kind === Windows.ApplicationModel.Activation.ActivationKind.file && Ensemble.Session.projectName == null) {
	        let projectToOpen = null;
	        for (let i = 0; i < args.detail.files.length; i++) {
	            if (args.detail.files[i].fileType == ".eo1") {
	                projectToOpen = args.detail.files[i];
	                break;
	            }
	        }
	        Ensemble.Pages.MainMenu.showProjectLoadingPage(projectToOpen.displayName);
	        Ensemble.FileIO.loadProject(null, projectToOpen);
	    }
		if (args.detail.kind === activation.ActivationKind.launch) {
			if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
			    // TODO: This application has been newly launched. Initialize your application here.
			    console.info("Starting Ensemble of One...");
			    Ensemble.Navigation.init();
			    //var extendedSplashImage = document.getElementById("imgMainLogo");
			    //extendedSplashImage.width = args.detail.splashScreen.imageLocation.width;
			    //extendedSplashImage.height = args.detail.splashScreen.imageLocation.height;

			    //args.detail.splashScreen.addEventListener("dismissed", function () {
			    //    Ensemble.Pages.MainMenu.showInitial();
			    //});

			    //Ensemble.Pages.MainMenu.showInitial();

			    Ensemble.MainMenu.init();
			} else {
				// TODO: This application has been reactivated from suspension.
			    // Restore application state here.
			    // Load back into previously open project.
			}
			console.info("Ensemble of One started!");
			args.setPromise(WinJS.UI.processAll());
		}
	};

	app.oncheckpoint = function (args) {
		// TODO: This application is about to be suspended. Save any state that needs to persist across suspensions here.
		// You might use the WinJS.Application.sessionState object, which is automatically saved and restored across suspension.
		// If you need to complete an asynchronous operation before your application is suspended, call args.setPromise().
	};

	app.start();
})();
