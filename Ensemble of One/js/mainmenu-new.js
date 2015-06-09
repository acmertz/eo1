(function () {
    WinJS.Namespace.define("Ensemble.MainMenu", {
        /// <summary>Manages the Main Menu.</summary>
        init: function () {
            /// <summary>Initializes the Main Menu.</summary>
            Ensemble.Settings.init();
            Ensemble.MainMenu._refreshUI();
        },

        unload: function () {
            /// <summary>Unloads the Main Menu.</summary>
            Ensemble.MainMenu._cleanUI();
        },

        ui: {
            navItems: [],
            quickStartItems: [],
            localProjectContainer: null
        },

        _refreshUI: function () {
            this.ui.navItems = document.getElementsByClassName("main-menu__nav-item");
            this.ui.quickStartItems = document.getElementsByClassName("home-menu__quick-start-item");
            this.ui.localProjectContainer = document.getElementsByClassName("open-menu__local-projects")[0];

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

            document.getElementsByClassName("menu-create-project-param--submit")[0].removeEventListener("click", Ensemble.MainMenu._listeners.newProjectButtonClicked);
        },

        _listeners: {
            navItemClicked: function (event) {
                let outgoing = document.getElementsByClassName("main-menu__content-section--visible")[0];
                let incoming = document.getElementsByClassName("main-menu__content-section--" + event.currentTarget.dataset.menu)[0];
                $(".main-menu__nav-item--active").removeClass("main-menu__nav-item--active");
                $(event.currentTarget).addClass("main-menu__nav-item--active");
                if (outgoing != incoming) {
                    WinJS.UI.Animation.exitPage(outgoing.children, null).done(function () {
                        $(outgoing).removeClass("main-menu__content-section--visible").addClass("main-menu__content-section--hidden");
                        $(incoming).removeClass("main-menu__content-section--hidden").addClass("main-menu__content-section--visible");
                        WinJS.UI.Animation.enterPage(incoming.children, null).done(function () {
                            Ensemble.FileIO.enumerateProjects(Ensemble.MainMenu._listeners.enumeratedProjects);
                        });
                    });
                    Ensemble.Settings.refreshSettingsDialog();
                }
            },

            quickstartItemClicked: function (event) {
                console.log("Quickstart project with aspect ratio " + event.currentTarget.dataset.quickstart + "...");
                Ensemble.FileIO.createProject("Untitled project", event.currentTarget.dataset.quickstart, Ensemble.MainMenu._listeners.newProjectCreated);
            },

            enumeratedProjects: function (projects) {
                Ensemble.MainMenu.ui.localProjectContainer.innerHTML = "";;
                for (let i = 0; i < projects.length; i++) {
                    let thumb = "<img class='open-menu__item-thumb' src='" + projects[i].thumbnail + "'/>";
                    let title = "<h4>" + projects[i].name + "</h4>";

                    let entireItem = document.createElement("li");
                    entireItem.className = "open-menu__project-item";
                    entireItem.innerHTML = thumb + title;
                  
                    entireItem.addEventListener("click", Ensemble.MainMenu._listeners.openMenuItemClicked);
                    entireItem.addEventListener("contextmenu", Ensemble.MainMenu._listeners.openMenuItemContextMenu);

                    entireItem.dataset.filename = projects[i].filename;
                    entireItem.dataset.projectname = projects[i].name;

                    Ensemble.MainMenu.ui.localProjectContainer.appendChild(entireItem);
                }
                WinJS.UI.Animation.fadeIn(Ensemble.MainMenu.ui.localProjectContainer);
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
                    Ensemble.FileIO.loadProject(filename);
                }, 1000);
            },

            openMenuItemContextMenu: function (event) {
                console.log("Context menu for item.");
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
            }
        }

    });
})();