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
            var menuButton = document.getElementById("editorMenuButton");
            menuButton.addEventListener("click", this._menuButtonOnClickListener, false);
        },

        _detachListeners: function () {
            var menuButton = document.getElementById("editorMenuButton");
            menuButton.removeEventListener("click", this._menuButtonOnClickListener, false);
        },

        _menuButtonOnClickListener: function () {
            var menuDialog = document.getElementById("editorMenuDialog");
            if (menuDialog.style.visibility == "hidden" || menuDialog.style.visibility == "") {
                menuDialog.style.visibility = "visible";
                WinJS.UI.Animation.fadeIn(menuDialog).done(function () {
                    //Show the Project menu.
                    var itemToShow = document.getElementById("editorMenuContentProject");
                    itemToShow.hidden = false;
                    WinJS.UI.Animation.enterContent(itemToShow);
                });
            }
            else {
                WinJS.UI.Animation.fadeOut(menuDialog).done(function () {
                    menuDialog.style.visibility = "hidden";
                    var menuItems = document.getElementsByClassName("editorMenuContentItem");
                    for (var i = 0; i < menuItems.length; i++) {
                        menuItems[i].style.opacity = 0;
                        menuItems[i].hidden = true;
                    }
                });
            }
        }
    });
})();