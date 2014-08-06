// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509
(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize
                // your application here.
                args.detail.splashScreen.addEventListener("dismissed", function () {
                    console.log("App started up.");

                    // Load all needed resources here

                    window.setTimeout(function () { showMainMenuInitial(); }, 0);
                });
            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
                // Load back into previously open project.
            }
            args.setPromise(WinJS.UI.processAll());
        }
    };

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. You might use the
        // WinJS.Application.sessionState object, which is automatically
        // saved and restored across suspension. If you need to complete an
        // asynchronous operation before your application is suspended, call
        // args.setPromise().
    };

    app.start();
})();

var showMainMenuInitial = function () {
    tickerTimer = window.setInterval(function () {
        if ($("#tickerTicket").hasClass("tickerHovering")) $("#tickerTicket").removeClass("tickerHovering");
        else $("#tickerTicket").addClass("tickerHovering");
    }, 500);
    // New project button
    $("#newProjectButton").addClass("mainMenuPhotoButtonVisible");

    // Open project button
    window.setTimeout(function () { $("#openProjectButton").addClass("mainMenuPhotoButtonVisible"); }, 200);

    // Settings button
    window.setTimeout(function () {
        $("#settingsButton").addClass("settingsButtonVisible");
        $("#tickerTicket").addClass("tickerButtonVisible");
        $("#newProjectDialog").removeClass("newProjectDialogHidden");
        $("#openProjectDialog").removeClass("openProjectDialogHidden");
    }, 800);

    // Edge "film strips"
}

var exitCurrentPage = function () {
    console.log("Navigating to the main menu.");

    // Hide the current page
    $("#mainMenuPageContainer").addClass("pageContainerHidden");
}

var showNewProjectDialog = function () {
    console.log("Showing the new project dialog.");
    $("#newProjectDialog").addClass("newProjectDialogVisible");
    $("#newProjectClickEater").addClass("mainMenuClickEaterVisible");
    $("#mainMenuPageContainer").addClass("mainMenuParallaxToRight");
    window.setTimeout(function () { $("#mainMenuProjectNameInput").focus(); }, 500);
}

var hideNewProjectDialog = function () {
    if ($("#newProjectDialog").hasClass("newProjectDialogVisible")) {
        console.log("Hiding the new project dialog.");
        $("#newProjectDialog").removeClass("newProjectDialogVisible");
        $("#newProjectClickEater").removeClass("mainMenuClickEaterVisible");
        $("#mainMenuPageContainer").removeClass("mainMenuParallaxToRight");
    }
    else {
    }
}

var mouseDownTicker = function () {
    $("#tickerTicket").removeClass("tickerReleased");
    $("#tickerTicket").addClass("tickerDepressed");
}

var mouseUpTicker = function () {
    window.setTimeout(function () {
        $("#tickerTicket").removeClass("tickerDepressed");
        $("#tickerTicket").addClass("tickerReleased");
    }, 100);
}

var mouseOverTicker = function () {
}

var mouseOutTicker = function () {
}

var mouseDownNewProjectButton = function () {
    $("#newProjectButton").addClass("mainMenuPhotoButtonClicking");
}

var mouseUpNewProjectButton = function () {
    window.setTimeout(function () { $("#newProjectButton").removeClass("mainMenuPhotoButtonClicking"); }, 100);
}

var validateAndCreateProject = function () {
    // Slide the reel up to show the loading frame.
    $("#newProjectDialog").removeClass("newProjectDialogVisible");
    $("#newProjectDialog").addClass("newProjectLoading");
}

var mainMenuProjectNameInputKeyUp = function () {
    if (window.event.which == 13) {
        // Enter key pressed
        validateAndCreateProject();
    }
}

var showOpenProjectDialog = function () {
    // Enumerate saved projects and show the open project film reel.
    $("#openProjectDialog").addClass("openProjectDialogVisible");
    $("#openProjectClickEater").addClass("mainMenuClickEaterVisible");
    $("#mainMenuPageContainer").addClass("mainMenuParallaxToLeft");
}

var hideOpenProjectDialog = function () {
    $("#openProjectDialog").removeClass("openProjectDialogVisible");
    $("#openProjectClickEater").removeClass("mainMenuClickEaterVisible");
    $("#mainMenuPageContainer").removeClass("mainMenuParallaxToLeft");
}

var mouseDownOpenProjectButton = function () {
    $("#openProjectButton").addClass("mainMenuPhotoButtonClicking");
}

var mouseUpOpenProjectButton = function () {
    window.setTimeout(function () { $("#openProjectButton").removeClass("mainMenuPhotoButtonClicking"); }, 100);
}

var showTickerDialog = function () {
    console.log("Showing the ticker dialog.");
    $("#tickerDialog").removeClass("tickerDialogHidden");
    $("#tickerDialog").addClass("tickerDialogVisible");
    $("#tickerDialogClickEater").addClass("mainMenuClickEaterVisible");
}

var hideTickerDialog = function () {
    console.log("Hiding the ticker dialog.");
    $("#tickerDialog").removeClass("tickerDialogVisible");
    $("#tickerDialog").addClass("tickerDialogHidden");
    $("#tickerDialogClickEater").removeClass("mainMenuClickEaterVisible");
}

var showSettingsDialog = function () {
    console.log("Showing the settings dialog.");
    $("#clapperTop").addClass("clapperClapping");
    window.setTimeout(function () { $("#clapperTop").removeClass("clapperClapping"); }, 100);
    $("#settingsDialog").removeClass("settingsDialogHidden");
    $("#settingsDialog").addClass("settingsDialogVisible");
    $("#settingsDialogClickEater").addClass("mainMenuClickEaterVisible");
}

var hideSettingsDialog = function () {
    console.log("Hiding the settings dialog.");
    $("#settingsDialog").removeClass("settingsDialogVisible");
    $("#settingsDialog").addClass("settingsDialogHidden");
    $("#settingsDialogClickEater").removeClass("mainMenuClickEaterVisible");
}