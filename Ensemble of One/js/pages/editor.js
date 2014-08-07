(function () {
    WinJS.Namespace.define("Ensemble.Pages.Editor", {
        /// <summary>Functions used to control the behavior of the Editor page.</summary>

        //// PRIVATE INSTANCE VARIABLES ////


        //// PUBLIC METHODS ////

        showInitial: function () {
            /// <summary>Plays the Editor launch animation and attaches all event listeners.</summary>
            document.getElementById("editorPageContainer").style.visibility = "visible";
            var upperHalf = document.getElementById("editorUpperHalf");
            var lowerHalf = document.getElementById("editorLowerHalf")
            WinJS.UI.Animation.enterPage([upperHalf, lowerHalf], null).then(function () {
            });
            window.setTimeout(function () {
                $("#editorHorizontalDivider").removeClass("editorHorizontalDividerHidden");
            }, 500);
            

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
        }
    });
})();