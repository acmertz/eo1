(function () {
    WinJS.Namespace.define("Ensemble.Pages.MainMenu", {
        /// <summary>Functions used to control the behavior of the Main Menu page.</summary>

        //// PRIVATE INSTANCE VARIABLES ////
        

        //// PUBLIC METHODS ////

        showInitial: function () {
            /// <summary>Plays the Main Menu launch animation and attaches all event listeners.</summary>
            $("#newProjectButton").addClass("mainMenuPhotoButtonVisible");
            window.setTimeout(function () { $("#openProjectButton").addClass("mainMenuPhotoButtonVisible"); }, 200);

            window.setTimeout(function () {
                $("#settingsButton").addClass("settingsButtonVisible");
                $("#tickerTicket").addClass("tickerButtonVisible");
                $("#newProjectDialog").removeClass("newProjectDialogHidden");
                $("#openProjectDialog").removeClass("openProjectDialogHidden");
            }, 800);

            this._attachListeners();
        },

        hide: function () {
            /// <summary>Plays the Main Menu hide animation and detaches all event listeners.</summary>
            console.log("Hiding the Main Menu.");
            window.clearInterval(this._projectLoadTimer);

            // Hide the current page
            $("#mainMenuPageContainer").addClass("pageContainerHidden");
            window.setTimeout(function () {
                WinJS.UI.Animation.exitContent(document.getElementById("imgMainLogo")).done(function () {
                    document.getElementById("mainMenuPageContainer").style.display = "none";
                    Ensemble.Pages.Editor.showInitial();
                });
            }, 500)

            this._detachListeners();
        },



        showNewProjectDialog: function () {
            /// <summary>Shows the New Project dialog and gives focus to the project name field once the animation finishes.</summary>
            console.log("Showing the new project dialog.");
            $("#newProjectDialog").addClass("newProjectDialogVisible");
            $("#newProjectClickEater").addClass("mainMenuClickEaterVisible");
            $("#mainMenuPageContainer").addClass("mainMenuParallaxToRight");
            window.setTimeout(function () { $("#mainMenuProjectNameInput").focus(); }, 500);
        },

        hideNewProjectDialog: function () {
            /// <summary>Hides the New Project dialog.</summary>
            if ($("#newProjectDialog").hasClass("newProjectDialogVisible")) {
                console.log("Hiding the new project dialog.");
                $("#newProjectDialog").removeClass("newProjectDialogVisible");
                $("#newProjectClickEater").removeClass("mainMenuClickEaterVisible");
                $("#mainMenuPageContainer").removeClass("mainMenuParallaxToRight");
            }
            else {
            }
        },

        mouseDownTicker: function () {
            /// <summary>Plays the ticker dialog mousedown effect.</summary>
            $("#tickerTicket").removeClass("tickerReleased");
            $("#tickerTicket").addClass("tickerDepressed");
        },

        mouseUpTicker: function () {
            /// <summary>Plays the ticker dialog mouseup effect.</summary>
            window.setTimeout(function () {
                $("#tickerTicket").removeClass("tickerDepressed");
                $("#tickerTicket").addClass("tickerReleased");
            }, 100);
        },

        mouseDownNewProjectButton: function () {
            /// <summary>Plays the New Project button mousedown effect.</summary>
            $("#newProjectButton").addClass("mainMenuPhotoButtonClicking");
        },

        mouseUpNewProjectButton: function () {
            /// <summary>Plays the New Project button mouseup effect.</summary>
            window.setTimeout(function () { $("#newProjectButton").removeClass("mainMenuPhotoButtonClicking"); }, 100);
        },

        validateAndCreateProject: function () {
            /// <summary>Animates the New Project dialog upward to show the loading message.</summary>
            var projectName = document.getElementById("mainMenuProjectNameInput").value;
            var projectLocation = document.getElementById("mainMenuProjectLocation").value;
            var projectAspect = document.getElementById("mainMenuProjectAspect").value;

            if (projectName.length > 0) {
                console.log("Creating new project...");
                $("#newProjectDialog").removeClass("newProjectDialogVisible");
                $("#newProjectDialog").addClass("newProjectLoading");

                Ensemble.Session.projectLoading = true;
                this._projectLoadTimer = window.setInterval(function () {
                    if (!Ensemble.Session.projectLoading) {
                        Ensemble.Pages.MainMenu.hide();
                    }
                }, 1000);
                Ensemble.FileIO.createProject(projectName, projectLocation, projectAspect);
            }
            else {

            }
        },



        showOpenProjectDialog: function () {
            /// <summary>Enumerates saved projects and shows the Open Project dialog.</summary>
            $("#openProjectDialog").addClass("openProjectDialogVisible");
            $("#openProjectClickEater").addClass("mainMenuClickEaterVisible");
            $("#mainMenuPageContainer").addClass("mainMenuParallaxToLeft");
        },

        hideOpenProjectDialog: function () {
            /// <summary>Hides the Open Project dialog.</summary>
            $("#openProjectDialog").removeClass("openProjectDialogVisible");
            $("#openProjectClickEater").removeClass("mainMenuClickEaterVisible");
            $("#mainMenuPageContainer").removeClass("mainMenuParallaxToLeft");
        },

        mouseDownOpenProjectButton: function () {
            /// <summary>Plays the Open Project button mousedown effect.</summary>
            $("#openProjectButton").addClass("mainMenuPhotoButtonClicking");
        },

        mouseUpOpenProjectButton: function () {
            /// <summary>Plays the Open Project button mouseup effect.</summary>
            window.setTimeout(function () { $("#openProjectButton").removeClass("mainMenuPhotoButtonClicking"); }, 100);
        },

        showTickerDialog: function () {
            /// <summary>Shows the ticker dialog.</summary>
            console.log("Showing the ticker dialog.");
            $("#tickerDialog").removeClass("tickerDialogHidden");
            $("#tickerDialog").addClass("tickerDialogVisible");
            window.setTimeout(function () { WinJS.UI.Animation.enterContent(document.getElementById("tickerDialogContent")); }, 400);
            $("#tickerDialogClickEater").addClass("mainMenuClickEaterVisible");
        },

        hideTickerDialog: function () {
            /// <summary>Hides the ticker dialog.</summary>
            console.log("Hiding the ticker dialog.");
            $("#tickerDialog").removeClass("tickerDialogVisible");
            $("#tickerDialog").addClass("tickerDialogHidden");
            window.setTimeout(function () { WinJS.UI.Animation.exitContent(document.getElementById("tickerDialogContent")); }, 300);
            $("#tickerDialogClickEater").removeClass("mainMenuClickEaterVisible");
        },

        showSettingsDialog: function () {
            /// <summary>Shows the settings dialog.</summary>
            console.log("Showing the settings dialog.");
            $("#clapperTop").addClass("clapperClapping");
            window.setTimeout(function () { $("#clapperTop").removeClass("clapperClapping"); }, 100);
            $("#settingsDialog").removeClass("settingsDialogHidden");
            $("#settingsDialog").addClass("settingsDialogVisible");
            window.setTimeout(function () { WinJS.UI.Animation.enterContent(document.getElementById("settingsDialogContent")); }, 400);
            $("#settingsDialogClickEater").addClass("mainMenuClickEaterVisible");
        },

        hideSettingsDialog: function () {
            /// <summary>Hides the settings dialog.</summary>
            console.log("Hiding the settings dialog.");
            $("#settingsDialog").removeClass("settingsDialogVisible");
            $("#settingsDialog").addClass("settingsDialogHidden");
            window.setTimeout(function () { WinJS.UI.Animation.exitContent(document.getElementById("settingsDialogContent")); }, 300);
            $("#settingsDialogClickEater").removeClass("mainMenuClickEaterVisible");
        },



        //// PRIVATE METHODS ////

        _attachListeners: function () {
            //Ticker
            var tickerButton = document.getElementById("tickerText");
            tickerButton.addEventListener("click", this._tickerOnClickListener, false);
            tickerButton.addEventListener("mousedown", this._tickerOnMouseDownListener, false);
            tickerButton.addEventListener("mouseup", this._tickerOnMouseUpListener, false);

            //New Project button
            var newProjectButton = document.getElementById("newProjectButton");
            newProjectButton.addEventListener("click", this._newProjectButtonOnClickListener, false);
            newProjectButton.addEventListener("mousedown", this._newProjectButtonOnMouseDownListener, false);
            newProjectButton.addEventListener("mouseup", this._newProjectButtonOnMouseUpListener, false);

            //Open Project button
            var openProjectButton = document.getElementById("openProjectButton");
            openProjectButton.addEventListener("click", this._openProjectButtonOnClickListener, false);
            openProjectButton.addEventListener("mousedown", this._openProjectButtonOnMouseDownListener, false);
            openProjectButton.addEventListener("mouseup", this._openProjectButtonOnMouseUpListener, false);

            //Settings button
            var settingsButton = document.getElementById("settingsButton");
            settingsButton.addEventListener("click", this._settingsButtonOnClickListener, false);
            settingsButton.addEventListener("mousedown", this._settingsButtonOnMouseDownListener, false);
            settingsButton.addEventListener("mouseup", this._settingsButtonOnMouseUpListener, false);

            //Click eaters
            document.getElementById("newProjectClickEater").addEventListener("click", this._newProjectDialogClickEaterOnClickListener, false);
            document.getElementById("openProjectClickEater").addEventListener("click", this._openProjectDialogClickEaterOnClickListener, false);
            document.getElementById("tickerDialogClickEater").addEventListener("click", this._tickerDialogClickEaterOnClickListener, false);
            document.getElementById("settingsDialogClickEater").addEventListener("click", this._settingsDialogClickEaterOnClickListener, false);

            //New Project dialog
            document.getElementById("mainMenuValidateProjectButton").addEventListener("click", this._validateProjectButtonOnClickListener, false);
            document.getElementById("mainMenuProjectNameInput").addEventListener("keyup", this._projectNameInputKeyUpListener, false);
        },

        _detachListeners: function () {
            //Ticker
            var tickerButton = document.getElementById("tickerText");
            tickerButton.removeEventListener("click", this._tickerOnClickListener, false);
            tickerButton.removeEventListener("mousedown", this._tickerOnMouseDownListener, false);
            tickerButton.removeEventListener("mouseup", this._tickerOnMouseUpListener, false);

            //New Project button
            var newProjectButton = document.getElementById("newProjectButton");
            newProjectButton.removeEventListener("click", this._newProjectButtonOnClickListener, false);
            newProjectButton.removeEventListener("mousedown", this._newProjectButtonOnMouseDownListener, false);
            newProjectButton.removeEventListener("mouseup", this._newProjectButtonOnMouseUpListener, false);

            //Open Project button
            var openProjectButton = document.getElementById("openProjectButton");
            openProjectButton.removeEventListener("click", this._openProjectButtonOnClickListener, false);
            openProjectButton.removeEventListener("mousedown", this._openProjectButtonOnMouseDownListener, false);
            openProjectButton.removeEventListener("mouseup", this._openProjectButtonOnMouseUpListener, false);

            //Settings button
            var settingsButton = document.getElementById("settingsButton");
            settingsButton.removeEventListener("click", this._settingsButtonOnClickListener, false);
            settingsButton.removeEventListener("mousedown", this._settingsButtonOnMouseDownListener, false);
            settingsButton.removeEventListener("mouseup", this._settingsButtonOnMouseUpListener, false);

            //Click eaters
            document.getElementById("newProjectClickEater").removeEventListener("click", this._newProjectDialogClickEaterOnClickListener, false);
            document.getElementById("openProjectClickEater").removeEventListener("click", this._openProjectDialogClickEaterOnClickListener, false);
            document.getElementById("tickerDialogClickEater").removeEventListener("click", this._tickerDialogClickEaterOnClickListener, false);
            document.getElementById("settingsDialogClickEater").removeEventListener("click", this._settingsDialogClickEaterOnClickListener, false);

            //New Project dialog
            document.getElementById("mainMenuValidateProjectButton").removeEventListener("click", this._validateProjectButtonOnClickListener, false);
            document.getElementById("mainMenuProjectNameInput").removeEventListener("keyup", this._projectNameInputKeyUpListener, false);
        },

        _tickerOnClickListener: function (event) {
            Ensemble.Pages.MainMenu.showTickerDialog();
        },

        _tickerOnMouseDownListener: function (event) {
            Ensemble.Pages.MainMenu.mouseDownTicker();
        },

        _tickerOnMouseUpListener: function (event) {
            Ensemble.Pages.MainMenu.mouseUpTicker();
        },

        _newProjectButtonOnClickListener: function (event) {
            Ensemble.Pages.MainMenu.showNewProjectDialog();
        },

        _newProjectButtonOnMouseDownListener: function (event) {
            Ensemble.Pages.MainMenu.mouseDownNewProjectButton();
        },

        _newProjectButtonOnMouseUpListener: function (event) {
            Ensemble.Pages.MainMenu.mouseUpNewProjectButton();
        },

        _openProjectButtonOnClickListener: function (event) {
            Ensemble.FileIO.enumerateProjects(Ensemble.Pages.MainMenu.showOpenProjectDialog);
        },

        _openProjectButtonOnMouseDownListener: function (event) {
            Ensemble.Pages.MainMenu.mouseDownOpenProjectButton();
        },

        _openProjectButtonOnMouseUpListener: function (event) {
            Ensemble.Pages.MainMenu.mouseUpOpenProjectButton();
        },

        _settingsButtonOnClickListener: function (event) {
            Ensemble.Pages.MainMenu.showSettingsDialog();
        },

        _settingsButtonOnMouseDownListener: function (event) {
            //Nothing yet - animation is composite
        },

        _settingsButtonOnMouseUpListener: function (event) {
            //Nothing yet - animation is composite
        },

        _newProjectDialogClickEaterOnClickListener: function (event) {
            Ensemble.Pages.MainMenu.hideNewProjectDialog();
        },

        _openProjectDialogClickEaterOnClickListener: function (event) {
            Ensemble.Pages.MainMenu.hideOpenProjectDialog();
        },

        _tickerDialogClickEaterOnClickListener: function (event) {
            Ensemble.Pages.MainMenu.hideTickerDialog();
        },

        _settingsDialogClickEaterOnClickListener: function (event) {
            Ensemble.Pages.MainMenu.hideSettingsDialog();
        },

        _projectNameInputKeyUpListener: function () {
            if (window.event.which == 13) {
                // Enter key pressed
                Ensemble.Pages.MainMenu.validateAndCreateProject();
            }
        },

        _validateProjectButtonOnClickListener: function () {
            Ensemble.Pages.MainMenu.validateAndCreateProject();
        },

        _projectLoadTimer: null

    });
})();