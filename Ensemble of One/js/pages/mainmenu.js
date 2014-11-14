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
            //$("#mainMenuPageContainer").addClass("pageContainerHidden");
            $("#mainMenuPageContainer").css("visibility", "hidden");
            $("#mainMenuPageContainer").css("opacity", "0");
            $("#mainMenuPageContainer").css("pointer-events", "none");
            $("#imgMainLogo").css("display", "none");
            //window.setTimeout(function () {
            //    WinJS.UI.Animation.exitContent(document.getElementById("imgMainLogo")).done(function () {
            //        document.getElementById("mainMenuPageContainer").style.display = "none";
            //        Ensemble.Pages.Editor.showInitial();
            //        //document.getElementById("mainMenuPageContainer").parentElement.removeChild(document.getElementById("mainMenuPageContainer")); //Remove the main menu from the DOM.
            //    });
            //}, 500)

            this._detachListeners();
        },

        showProjectLoadingPage: function (projectName) {
            /// <summary>Displays a loading dialog with the projects name.</summary>
            /// <param name="projectName" type="String">The name of the project being loaded.</param>
            $("#projectLoadingNameDisplay").text(projectName);
            $("#projectLoadingPageContainer").removeClass("loadingPageHidden");
            $("#projectLoadingPageContainer").addClass("loadingPageVisible");
        },

        navigateToEditor: function () {
            /// <summary>Hides the Main Menu, dismisses the loading page, and then shows the Editor page.</summary>
            Ensemble.Pages.MainMenu.hide();
            window.setTimeout(function () {
                $("#projectLoadingPageContainer").removeClass("loadingPageVisible");
                $("#projectLoadingPageContainer").addClass("loadingPageHidden");
                Ensemble.Pages.MainMenu.hideOpenProjectDialog();
                Ensemble.Pages.MainMenu.hideNewProjectDialog();
                window.setTimeout(function () {
                    Ensemble.Pages.Editor.showInitial();
                }, 500);
            }, 500);
        },



        showNewProjectDialog: function () {
            /// <summary>Shows the New Project dialog and gives focus to the project name field once the animation finishes.</summary>
            console.log("Showing the new project dialog.");
            $("#newProjectDialog").addClass("newProjectDialogVisible");
            $("#newProjectClickEater").addClass("mainMenuClickEaterVisible");
            $("#mainMenuPageContainer").addClass("mainMenuParallaxToRight");
            window.setTimeout(function () { $("#mainMenuProjectNameInput").focus(); }, 800);
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

                //Ensemble.Session.projectLoading = true;
                //this._projectLoadTimer = window.setInterval(function () {
                //    if (!Ensemble.Session.projectLoading) {
                //        Ensemble.Pages.MainMenu.hide();
                //    }
                //}, 1000);
                Ensemble.FileIO.createProject(projectName, projectLocation, projectAspect);
            }
            else {

            }
        },



        showOpenProjectDialog: function (projects) {
            /// <summary>Enumerates saved projects and shows the Open Project dialog.</summary>
            /// <param name="projects" type="Array">An array containing the projects found in the application directory.</param>
            if (projects.length == 0) {
                document.getElementById("menuOpenProjectDialogContentFull").style.display = "none";
                document.getElementById("menuOpenProjectDialogContentEmpty").style.display = "flex";
            }
            else {
                document.getElementById("menuOpenProjectDialogContentEmpty").style.display = "none";
                document.getElementById("menuOpenProjectDialogContentFull").style.display = "flex";

                var projectListView = document.getElementById("openProjectDialogList");
                $(projectListView).empty();
                for (var i = 0; i < projects.length; i++) {
                    var projectElement = document.createElement("div");
                    projectElement.className = "projectListItem";
                    projectElement.id = projects[i].filename;

                    var newImgCont = document.createElement("div");
                    newImgCont.className = "projectListItemImgContainer";

                    var newImg = document.createElement("img");
                    newImg.className = "projectListItemImg";
                    newImg.src = projects[i].thumbnail;
                    newImgCont.appendChild(newImg);
                    projectElement.appendChild(newImgCont);



                    var newMeta = document.createElement("div");
                    newMeta.className = "projectListItemMeta";

                    var newTitle = document.createElement("div");
                    newTitle.className = "projectListItemSubMeta projectListItemTitle";
                    newTitle.innerText = projects[i].name;
                    newMeta.appendChild(newTitle);



                    var newDetails = document.createElement("div");
                    newDetails.className = "projectListItemSubMeta projectListItemDetails";

                    var newRow1 = document.createElement("div");
                    newRow1.className = "projectListItemDetailsRow";

                    var newDuration = document.createElement("div");
                    newDuration.className = "projectListItemDetailsRowItem";
                    newDuration.innerText = "Duration: " + projects[i].duration + "ms";
                    newRow1.appendChild(newDuration);

                    var newDate = document.createElement("div");
                    newDate.className = "projectListItemDetailsRowItem";
                    newDate.innerText = "Modified: " + projects[i].modified;
                    newRow1.appendChild(newDate);

                    var newRow2 = document.createElement("div");
                    newRow2.className = "projectListItemDetailsRow";

                    var newAspect = document.createElement("div");
                    newAspect.className = "projectListItemDetailsRowItem";
                    newAspect.innerText = "Aspect ratio: " + projects[i].aspectRatio;
                    newRow2.appendChild(newAspect);

                    var newNumClips = document.createElement("div");
                    newNumClips.className = "projectListItemDetailsRowItem";
                    newNumClips.innerText = "Clips: " + projects[i].numberOfClips;
                    newRow2.appendChild(newNumClips);

                    newDetails.appendChild(newRow1);
                    newDetails.appendChild(newRow2);
                    newMeta.appendChild(newDetails);

                    projectElement.appendChild(newMeta);
                    projectElement.addEventListener("mousedown", Ensemble.Pages.MainMenu._projectListItemOnMouseDownListener, false);
                    projectElement.addEventListener("mouseup", Ensemble.Pages.MainMenu._projectListItemOnMouseUpListener, false);
                    projectElement.addEventListener("click", Ensemble.Pages.MainMenu._projectListItemOnClickListener, false);

                    projectListView.appendChild(projectElement);
                }
            }
            $("#openProjectDialogControls").removeClass("openProjectDialogControlsVisible");
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

        projectListSelectItem: function (item) {
            /// <summary>Deselects all items in the project list, and then selects the given item.</summary>
            /// <param name="item" type="DOMElement">The item to select.</param>
            $(".projectListItem").removeClass("projectListItemSelected");
            $(item).addClass("projectListItemSelected");

            $("#openProjectDialogControls").removeClass("openProjectDialogControlsHidden");
            $("#openProjectDialogControls").addClass("openProjectDialogControlsVisible");
        },

        mouseDownOpenProjectButton: function () {
            /// <summary>Plays the Open Project button mousedown effect.</summary>
            $("#openProjectButton").addClass("mainMenuPhotoButtonClicking");
        },

        mouseUpOpenProjectButton: function () {
            /// <summary>Plays the Open Project button mouseup effect.</summary>
            window.setTimeout(function () { $("#openProjectButton").removeClass("mainMenuPhotoButtonClicking"); }, 100);
        },

        showDeleteProjectConfirmationDialog: function () {
            /// <summary>Shows a dialog asking the user to confirm he or she would like to delete the selected project.</summary>
            document.getElementById("deleteProjectConfirmationDialogNameDisplay").innerText = document.getElementsByClassName("projectListItemSelected")[0].getElementsByClassName("projectListItemTitle")[0].innerText;
            $("#deleteProjectConfirmationDialog").removeClass("mainMenuZoomDialogHidden");
            $("#deleteProjectConfirmationDialog").addClass("mainMenuZoomDialogVisible");
            $("#deleteProjectConfirmationClickEater").addClass("mainMenuClickEaterVisible");
        },

        hideDeleteProjectConfirmationDialog: function () {
            /// <summary>Hides the delete project confirmation dialog.</summary>
            $("#deleteProjectConfirmationDialog").removeClass("mainMenuZoomDialogVisible");
            $("#deleteProjectConfirmationDialog").addClass("mainMenuZoomDialogHidden");
            $("#deleteProjectConfirmationClickEater").removeClass("mainMenuClickEaterVisible");
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

            //Update settings dialog to match saved settings
            Ensemble.Settings.refreshSettingsDialog();

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

        deleteProject: function (projectFileName) {
            /// <summary>Deletes the project with the given filename, should it exist.</summary>
            /// <param name="projectFileName" type="String">The filename of the project to be deleted.</param>
            console.log("Deleting " + projectFileName + "...");
            Ensemble.FileIO.deleteProject(projectFileName);
            this.hideDeleteProjectConfirmationDialog();

            var listItems = document.getElementsByClassName("projectListItem");
            if (listItems.length > 1) {
                $("#openProjectDialogControls").removeClass("openProjectDialogControlsVisible");
                $("#openProjectDialogControls").addClass("openProjectDialogControlsHidden");


                var deleted = document.getElementById(projectFileName);
                var affected = [];

                var found = false;
                for (var i = 0; i < listItems.length; i++) {
                    if (found) affected.push(listItems[i]);
                    else if (listItems[i] == deleted) found = true;
                }

                var anim = WinJS.UI.Animation.createDeleteFromListAnimation(deleted, affected);

                deleted.style.position = "fixed";
                deleted.style.opacity = 0;

                anim.execute().then(function (complete) {
                    deleted.parentNode.removeChild(deleted);
                });
            }
            else this.hideOpenProjectDialog();
            
        },

        showDeleteAllProjectsConfirmationDialog: function () {
            /// <summary>Shows a zoom dialog to confirm that the user really wants to delete all projects.</summary>
            $("#deleteAllProjectsConfirmationDialog").removeClass("mainMenuZoomDialogHidden");
            $("#deleteAllProjectsConfirmationDialog").addClass("mainMenuZoomDialogVisible");
            $("#deleteProjectConfirmationClickEater").addClass("mainMenuClickEaterVisible");
        },

        hideDeleteAllProjectsConfirmationDialog: function () {
            /// <summary>Hides "Delete all projects" confirmation zoom dialog.</summary>
            $("#deleteAllProjectsConfirmationDialog").removeClass("mainMenuZoomDialogVisible");
            $("#deleteAllProjectsConfirmationDialog").addClass("mainMenuZoomDialogHidden");
            $("#deleteProjectConfirmationClickEater").removeClass("mainMenuClickEaterVisible");
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

            //Open Project dialog
            document.getElementById("mainMenuConfirmOpenProjectButton").addEventListener("click", this._projectListOpenSelectedOnClickListener, false);
            document.getElementById("mainMenuRenameProjectButton").addEventListener("click", this._projectListRenameSelectedOnClickListener, false);
            document.getElementById("mainMenuDeleteProjectButton").addEventListener("click", this._projectListDeleteSelectedOnClickListener, false);

            document.getElementById("mainMenuConfirmDeleteProjectButton").addEventListener("click", this._confirmDeleteProjectButtonOnClickListener, false);
            document.getElementById("mainMenuCancelDeleteProjectButton").addEventListener("click", this._cancelDeleteProjectButtonOnClickListener, false);

            //Delete Project dialog
            document.getElementById("mainMenuDeleteAllProjectsButton").addEventListener("click", this._deleteAllProjectsButtonOnClickListener, false);
            document.getElementById("mainMenuConfirmDeleteAllProjectsButton").addEventListener("click", this._confirmDeleteAllProjectsButtonOnClickListener, false);
            document.getElementById("mainMenuCancelDeleteAllProjectsButton").addEventListener("click", this._cancelDeleteAllProjectsButtonOnClickListener, false);
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

            //Open Project dialog
            document.getElementById("mainMenuConfirmOpenProjectButton").removeEventListener("click", this._projectListOpenSelectedOnClickListener, false);
            document.getElementById("mainMenuRenameProjectButton").removeEventListener("click", this._projectListRenameSelectedOnClickListener, false);
            document.getElementById("mainMenuDeleteProjectButton").removeEventListener("click", this._projectListDeleteSelectedOnClickListener, false);

            document.getElementById("mainMenuConfirmDeleteProjectButton").removeEventListener("click", this._confirmDeleteProjectButtonOnClickListener, false);
            document.getElementById("mainMenuCancelDeleteProjectButton").removeEventListener("click", this._cancelDeleteProjectButtonOnClickListener, false);
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

        _projectListItemOnMouseDownListener: function (event) {
            console.log("Detected mousedown on a list item.");
            WinJS.UI.Animation.pointerDown(event.currentTarget);
        },

        _projectListItemOnMouseUpListener: function (event) {
            console.log("Detected mouseup on a list item.");
            WinJS.UI.Animation.pointerUp(event.currentTarget);
        },

        _projectListItemOnClickListener: function (event) {
            console.log("Detected a click on a list item.");
            Ensemble.Pages.MainMenu.projectListSelectItem(event.currentTarget);
        },

        _projectListOpenSelectedOnClickListener: function (event) {
            console.log("Open the selected project.");
            var text = $(".projectListItemSelected").find(".projectListItemTitle").first().text();
            Ensemble.Pages.MainMenu.showProjectLoadingPage(text);
            
            window.setTimeout(function () {
                Ensemble.FileIO.loadProject($(".projectListItemSelected").first().attr("id"));
            }, 500);
        },

        _projectListRenameSelectedOnClickListener: function (event) {
            console.log("Rename the selected project.");
        },

        _projectListDeleteSelectedOnClickListener: function (event) {
            console.log("Delete the selected project.");
            Ensemble.Pages.MainMenu.showDeleteProjectConfirmationDialog();
        },

        _confirmDeleteProjectButtonOnClickListener: function (event) {
            Ensemble.Pages.MainMenu.deleteProject(document.getElementsByClassName("projectListItemSelected")[0].id);
        },

        _cancelDeleteProjectButtonOnClickListener: function (event) {
            Ensemble.Pages.MainMenu.hideDeleteProjectConfirmationDialog();
        },

        _deleteAllProjectsButtonOnClickListener: function (event) {
            Ensemble.Pages.MainMenu.showDeleteAllProjectsConfirmationDialog();
        },

        _confirmDeleteAllProjectsButtonOnClickListener: function (event) {
            Ensemble.Pages.MainMenu.hideDeleteAllProjectsConfirmationDialog();
            Ensemble.FileIO.deleteAllProjects();
        },

        _cancelDeleteAllProjectsButtonOnClickListener: function (event) {
            Ensemble.Pages.MainMenu.hideDeleteAllProjectsConfirmationDialog();
        },

        _projectLoadTimer: null

    });
})();