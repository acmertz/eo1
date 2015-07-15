﻿(function () {
    WinJS.Namespace.define("Ensemble.MainMenu", {
        /// <summary>Manages the Main Menu.</summary>
        _recentProjects: [],

        init: function () {
            /// <summary>Initializes the Main Menu.</summary>
            Ensemble.Settings.init();
            Ensemble.MainMenu._refreshUI();
            Ensemble.FileIO.enumerateRecentProjects(Ensemble.MainMenu._listeners.enumeratedRecentProjects);
            WinJS.UI.Animation.enterPage(document.getElementsByClassName("main-menu__content-section--home")[0].children, null);
        },

        unload: function () {
            /// <summary>Unloads the Main Menu.</summary>
            Ensemble.MainMenu._cleanUI();
            Ensemble.MainMenu._recentProjects = [];
        },

        ui: {
            navItems: [],
            quickStartItems: [],
            localProjectContainer: null,
            recentProjectContainer: null
        },

        _refreshUI: function () {
            this.ui.navItems = document.getElementsByClassName("main-menu__nav-item");
            this.ui.quickStartItems = document.getElementsByClassName("home-menu__quick-start-item");
            this.ui.localProjectContainer = document.getElementsByClassName("open-menu__local-projects")[0];
            this.ui.recentProjectContainer = document.getElementsByClassName("home-menu__recent-projects")[0];

            for (let i = 0; i < this.ui.navItems.length; i++) {
                this.ui.navItems[i].addEventListener("click", this._listeners.navItemClicked);
            }
            for (let i = 0; i < this.ui.quickStartItems.length; i++) {
                this.ui.quickStartItems[i].addEventListener("pointerdown", this._listeners.pointerDown);
                this.ui.quickStartItems[i].addEventListener("touchstart", this._listeners.pointerDown);
                this.ui.quickStartItems[i].addEventListener("mousedown", this._listeners.pointerDown);
                this.ui.quickStartItems[i].addEventListener("pointerup", this._listeners.pointerUp);
                this.ui.quickStartItems[i].addEventListener("touchend", this._listeners.pointerUp);
                this.ui.quickStartItems[i].addEventListener("mouseup", this._listeners.pointerUp);
                this.ui.quickStartItems[i].addEventListener("click", this._listeners.quickstartItemClicked);
            }

            document.getElementsByClassName("menu-create-project-param--submit")[0].addEventListener("click", Ensemble.MainMenu._listeners.newProjectButtonClicked);
            document.getElementsByClassName("menu-open-project-param--browse")[0].addEventListener("click", Ensemble.MainMenu._listeners.browseProjectButtonClicked);
        },

        _cleanUI: function () {
            for (let i = 0; i < this.ui.navItems.length; i++) {
                this.ui.navItems[i].removeEventListener("click", this._listeners.navItemClicked);
            }
            for (let i = 0; i < this.ui.quickStartItems.length; i++) {
                this.ui.navItems[i].removeEventListener("pointerdown", this._listeners.pointerDown);
                this.ui.navItems[i].removeEventListener("touchstart", this._listeners.pointerDown);
                this.ui.navItems[i].removeEventListener("mousedown", this._listeners.pointerDown);
                this.ui.navItems[i].removeEventListener("pointerup", this._listeners.pointerUp);
                this.ui.navItems[i].removeEventListener("touchend", this._listeners.pointerUp);
                this.ui.navItems[i].removeEventListener("mouseup", this._listeners.pointerUp);
            }

            this.ui.navItems = [];
            this.ui.quickStartItems = [];
            this.ui.localProjectContainer = null;
            this.ui.recentProjectContainer = null;

            document.getElementsByClassName("menu-create-project-param--submit")[0].removeEventListener("click", Ensemble.MainMenu._listeners.newProjectButtonClicked);
            document.getElementsByClassName("menu-open-project-param--browse")[0].removeEventListener("click", Ensemble.MainMenu._listeners.browseProjectButtonClicked);
        },

        _listeners: {
            navItemClicked: function (event) {
                if (!WinJS.Utilities.hasClass(event.currentTarget, "app-trigger")) {
                    let outgoing = document.getElementsByClassName("main-menu__content-section--visible")[0];
                    let incoming = document.getElementsByClassName("main-menu__content-section--" + event.currentTarget.dataset.menu)[0];
                    $(".main-menu__nav-item--active").removeClass("main-menu__nav-item--active");
                    $(event.currentTarget).addClass("main-menu__nav-item--active");
                    if (outgoing != incoming) {
                        WinJS.UI.Animation.exitPage(outgoing.children, null).done(function () {
                            $(outgoing).removeClass("main-menu__content-section--visible").addClass("main-menu__content-section--hidden");
                            $(incoming).removeClass("main-menu__content-section--hidden").addClass("main-menu__content-section--visible");
                            WinJS.UI.Animation.enterPage(incoming.children, null);
                            if (incoming.dataset.menu == "open-project") Ensemble.FileIO.enumerateLocalProjects(Ensemble.MainMenu._listeners.enumeratedLocalProjects);
                            else if (incoming.dataset.menu == "home") Ensemble.FileIO.enumerateRecentProjects(Ensemble.MainMenu._listeners.enumeratedRecentProjects);
                            else $(Ensemble.MainMenu.ui.localProjectContainer.children).css("opacity", "0");
                        });
                        Ensemble.Settings.refreshSettingsDialog();
                    }
                }
            },

            quickstartItemClicked: function (event) {
                console.log("Quickstart project with aspect ratio " + event.currentTarget.dataset.quickstart + "...");
                Ensemble.FileIO.createProject("Untitled project", event.currentTarget.dataset.quickstart, Ensemble.MainMenu._listeners.newProjectCreated);
            },

            enumeratedLocalProjects: function (projects) {
                Ensemble.MainMenu.ui.localProjectContainer.innerHTML = "";;
                for (let i = 0; i < projects.length; i++) {
                    let thumb = "<img class='open-menu__item-thumb' src='" + projects[i].thumbnail + "'/>",
                        title = "<h4 class='win-h4'>" + projects[i].name + "</h4>",
                        dateModified = "<span>" + projects[i].modified.toLocaleDateString() + "</span>";

                    let entireItem = document.createElement("li");
                    entireItem.className = "open-menu__project-item";
                    entireItem.innerHTML = thumb + title + dateModified;
                  
                    entireItem.addEventListener("click", Ensemble.MainMenu._listeners.openMenuItemClicked);
                    entireItem.addEventListener("contextmenu", Ensemble.MainMenu._listeners.openMenuItemContextMenu);

                    entireItem.dataset.filename = projects[i].filename;
                    entireItem.dataset.projectname = projects[i].name;

                    Ensemble.MainMenu.ui.localProjectContainer.appendChild(entireItem);
                }

                WinJS.UI.Animation.enterContent(Ensemble.MainMenu.ui.localProjectContainer.children);
            },

            enumeratedRecentProjects: function (projects) {
                console.log("Received a list of recent projects.");
                Ensemble.MainMenu._recentProjects = projects;
                Ensemble.MainMenu.ui.recentProjectContainer.innerHTML = "";
                for (let i = projects.length - 1; i >= 0; i--) {
                    let thumb = "<img class='open-menu__item-thumb' src='" + projects[i].thumbnail + "'/>",
                        title = "<h4 class='win-h4'>" + projects[i].name + "</h4>",
                        dateModified = "<span>" + projects[i].modified.toLocaleDateString() + "</span>";

                    let entireItem = document.createElement("li");
                    entireItem.className = "open-menu__project-item";
                    entireItem.innerHTML = thumb + title + dateModified;

                    entireItem.addEventListener("click", Ensemble.MainMenu._listeners.recentMenuItemClicked);
                    entireItem.addEventListener("contextmenu", Ensemble.MainMenu._listeners.recentMenuItemContextMenu);

                    entireItem.dataset.filename = projects[i].filename;
                    entireItem.dataset.projectname = projects[i].name;
                    entireItem.dataset.projectindex = i;

                    Ensemble.MainMenu.ui.recentProjectContainer.appendChild(entireItem);
                    WinJS.UI.Animation.enterContent(entireItem);
                }
                if (1 > projects.length) {
                    let noItemsEl = document.createElement("li");
                    noItemsEl.innerText = "Nothing to show here.";
                    Ensemble.MainMenu.ui.recentProjectContainer.appendChild(noItemsEl);
                    WinJS.UI.Animation.enterContent(noItemsEl);
                }
            },

            pointerDown: function (event) {
                WinJS.UI.Animation.pointerDown(event.target);
            },

            pointerUp: function (event) {
                WinJS.UI.Animation.pointerUp(event.target);
            },

            openMenuItemClicked: function (event) {
                let filename = event.currentTarget.dataset.filename;
                let text = event.currentTarget.dataset.projectname;
                
                let loadingPage = document.getElementsByClassName("app-page--loading-editor")[0];
                $(loadingPage).removeClass("app-page--hidden").addClass("app-page--enter-right");

                window.setTimeout(function () {
                    Ensemble.FileIO.loadInternalProject(filename);
                }, 1000);
            },

            openMenuItemContextMenu: function (event) {
                console.log("Context menu for item.");
            },

            recentMenuItemClicked: function (event) {
                let filename = event.currentTarget.dataset.filename,
                    text = event.currentTarget.dataset.projectname,
                    index = parseInt(event.currentTarget.dataset.projectindex, 10),
                    projectFile = Ensemble.MainMenu._recentProjects[index];

                let loadingPage = document.getElementsByClassName("app-page--loading-editor")[0];
                $(loadingPage).removeClass("app-page--hidden").addClass("app-page--enter-right");

                window.setTimeout(function () {
                    Ensemble.FileIO.loadInternalProject(filename, projectFile.src);
                }, 1000);
            },

            recentMenuItemContextMenu: function (event) {
                console.log("Context menu for recent project.");
            },

            projectFinishedLoading: function () {
                console.log("Project finished loading. Show the Editor.");
                let loadingPage = document.getElementsByClassName("app-page--loading-editor")[0];
                let editorPage = document.getElementsByClassName("app-page--editor")[0];

                $(editorPage).removeClass("app-page--hidden")
                Ensemble.Pages.Editor.init();
                editorPage.addEventListener("animationend", Ensemble.MainMenu._listeners.editorEntranceFinished);
                $(editorPage).addClass("app-page--enter-right");

                let appView = Windows.UI.ViewManagement.ApplicationView.getForCurrentView();
                appView.title = Ensemble.Session.projectName;
            },

            editorEntranceFinished: function (event) {
                if (event.animationName == "pageEnterForward") {
                    event.currentTarget.removeEventListener("animationend", Ensemble.MainMenu._listeners.editorEntranceFinished);
                    $(event.currentTarget).removeClass("app-page--enter-right");
                    $(".app-page--loading-editor").removeClass("app-page--enter-right").addClass("app-page--hidden");
                    Ensemble.Navigation.pushBackState(Ensemble.Pages.Editor.unload);
                }
            },

            newProjectButtonClicked: function (event) {
                let projectName = document.getElementsByClassName("menu-create-project-param--name")[0].value;
                let projectAspect = document.getElementsByClassName("menu-create-project-param--aspect")[0].value;

                if (projectName.length > 0) {
                    Ensemble.FileIO.createProject(projectName, projectAspect, Ensemble.MainMenu._listeners.newProjectCreated);
                }
            },

            newProjectCreated: function (filename) {
                console.info("Created project " + filename + ".");
                Ensemble.MainMenu._listeners.openMenuItemClicked({
                    currentTarget: {
                        dataset: {
                            filename: filename,
                            projectname: filename
                        }
                    }
                })
            },

            browseProjectButtonClicked: function () {
                let openPicker = new Windows.Storage.Pickers.FileOpenPicker();
                openPicker.viewMode = Windows.Storage.Pickers.PickerViewMode.list;
                openPicker.fileTypeFilter.replaceAll([".eo1"]);
                openPicker.pickSingleFileAsync().then(function (file) {
                    if (file) {
                        let loadingPage = document.getElementsByClassName("app-page--loading-editor")[0];
                        $(loadingPage).removeClass("app-page--hidden").addClass("app-page--enter-right");

                        window.setTimeout(function () {
                            Ensemble.FileIO.loadExternalProject(file);
                        }, 1000);
                    }
                });
            }
        }

    });
})();