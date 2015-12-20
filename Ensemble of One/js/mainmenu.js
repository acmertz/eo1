(function () {
    WinJS.Namespace.define("Ensemble.MainMenu", {
        /// <summary>Manages the Main Menu.</summary>
        _unsavedProjectsReady: false,
        _recentProjectsReady: false,
        projectList: [],

        init: function () {
            /// <summary>Initializes the Main Menu.</summary>
            Ensemble.Settings.init();
            this._refreshUI();
            this.refreshProjectListView();
            
            WinJS.UI.Animation.enterPage(document.getElementsByClassName("main-menu__section--home")[0].children, null);
        },

        unload: function () {
            /// <summary>Unloads the Main Menu.</summary>
            this._cleanUI();
            this._unsavedProjectsReady = false;
            this._recentProjectsReady = false;
            this.projectList = [];
        },

        refreshProjectListView: function () {
            this.projectList = [];
            this._unsavedProjectsReady = false;
            this._recentProjectsReady = false;
            if (Ensemble.MainMenu.ui.recentProjectContainer.winControl != undefined) {
                Ensemble.MainMenu.ui.recentProjectContainer.winControl.itemDataSource = null;
                Ensemble.MainMenu.ui.recentProjectContainer.winControl.groupDataSource = null;
            }
            Ensemble.FileIO.enumerateRecentProjects(this._listeners.receivedRecentProjects);
            Ensemble.FileIO.enumerateLocalProjects(this._listeners.receivedUnsavedProjects);
        },

        ui: {
            navItems: [],
            quickStartItems: [],
            recentProjectContainer: null,
            browseButton: null
        },

        _refreshUI: function () {
            this.ui.navItems = document.getElementsByClassName("main-menu__splitview-command");
            this.ui.quickStartItems = document.getElementsByClassName("home-menu__quick-start-item");
            this.ui.recentProjectContainer = document.getElementsByClassName("home-menu__recent-projects-listview")[0];
            this.ui.browseButton = document.getElementsByClassName("menu-open-project-param--browse")[0];

            this.ui.recentProjectContainer.addEventListener("iteminvoked", this._listeners.recentListItemInvoked);
            this.ui.browseButton.addEventListener("click", Ensemble.MainMenu._listeners.browseProjectButtonClicked);

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
        },

        _cleanUI: function () {
            for (let i = 0; i < this.ui.navItems.length; i++) {
                this.ui.navItems[i].removeEventListener("click", this._listeners.navItemClicked);
            }
            for (let i = 0; i < this.ui.quickStartItems.length; i++) {
                this.ui.quickStartItems[i].removeEventListener("pointerdown", this._listeners.pointerDown);
                this.ui.quickStartItems[i].removeEventListener("touchstart", this._listeners.pointerDown);
                this.ui.quickStartItems[i].removeEventListener("mousedown", this._listeners.pointerDown);
                this.ui.quickStartItems[i].removeEventListener("pointerup", this._listeners.pointerUp);
                this.ui.quickStartItems[i].removeEventListener("touchend", this._listeners.pointerUp);
                this.ui.quickStartItems[i].removeEventListener("mouseup", this._listeners.pointerUp);
                this.ui.quickStartItems[i].removeEventListener("click", this._listeners.quickstartItemClicked);
            }

            this.ui.recentProjectContainer.removeEventListener("iteminvoked", this._listeners.recentListItemInvoked);
            this.ui.browseButton.removeEventListener("click", Ensemble.MainMenu._listeners.browseProjectButtonClicked);

            this.ui.navItems = [];
            this.ui.quickStartItems = [];
            this.ui.recentProjectContainer = null;
            this.ui.browseButton = null;
        },

        _listeners: {
            navItemClicked: function (event) {
                if (!WinJS.Utilities.hasClass(event.currentTarget, "app-trigger")) {
                    let parentMenuContainer = $(event.currentTarget).closest(".win-splitview")[0],
                        outgoing = $(parentMenuContainer).find(".main-menu__section--visible")[0],
                        incoming = $(parentMenuContainer).find(".main-menu__section--" + event.currentTarget.dataset.menu)[0];
                    if (outgoing != incoming) {
                        WinJS.UI.Animation.exitPage(outgoing.children, null).done(function () {
                            $(outgoing).removeClass("main-menu__section--visible").addClass("main-menu__section--hidden");
                            $(incoming).removeClass("main-menu__section--hidden").addClass("main-menu__section--visible");
                            WinJS.UI.Animation.enterPage(incoming.children, null);

                            // special cases for certain menu pages
                            if (incoming.dataset.menu == "home") Ensemble.MainMenu.refreshProjectListView();
                        });
                    }
                }
            },

            quickstartItemClicked: function (event) {
                console.log("Quickstart project with aspect ratio " + event.currentTarget.dataset.quickstart + "...");
                Ensemble.FileIO.createProject("Untitled project", event.currentTarget.dataset.quickstart, Ensemble.MainMenu._listeners.newProjectCreated);
            },

            pointerDown: function (event) {
                WinJS.UI.Animation.pointerDown(event.target);
            },

            pointerUp: function (event) {
                WinJS.UI.Animation.pointerUp(event.target);
            },

            projectFinishedLoading: function () {
                // CALL THIS FUNCTION TO SHOW THE EDITOR PAGE WHEN THE PROJECT FINISHES LOADING
                console.log("Project finished loading. Show the Editor.");
                let loadingPage = document.getElementsByClassName("app-page--loading-editor")[0];
                let editorPage = document.getElementsByClassName("app-page--editor")[0];

                $(editorPage).removeClass("app-page--hidden")
                Ensemble.Pages.Editor.init();
                editorPage.addEventListener("animationend", Ensemble.MainMenu._listeners.editorEntranceFinished);
                $(editorPage).addClass("app-page--enter");

                let appView = Windows.UI.ViewManagement.ApplicationView.getForCurrentView();
                appView.title = Ensemble.Session.projectName;
            },

            editorEntranceFinished: function (event) {
                if (event.animationName == "pageEnterForward") {
                    event.currentTarget.removeEventListener("animationend", Ensemble.MainMenu._listeners.editorEntranceFinished);
                    $(event.currentTarget).removeClass("app-page--enter");
                    $(".app-page--loading-editor").removeClass("app-page--enter").addClass("app-page--hidden");
                    Ensemble.Navigation.pushBackState(Ensemble.Pages.Editor.unload);
                }
            },

            newProjectCreated: function (newProject) {                
                let loadingPage = document.getElementsByClassName("app-page--loading-editor")[0];
                $(loadingPage).removeClass("app-page--hidden").addClass("app-page--enter");
                Ensemble.Session.setCurrentPage(Ensemble.Session.PageStates.loadingToEditor);
                window.setTimeout(function () {
                    Ensemble.FileIO.loadProject(newProject);
                }, 1000);
            },

            browseProjectButtonClicked: function () {
                let openPicker = new Windows.Storage.Pickers.FileOpenPicker();
                openPicker.viewMode = Windows.Storage.Pickers.PickerViewMode.list;
                openPicker.fileTypeFilter.replaceAll([".eo1"]);
                openPicker.pickSingleFileAsync().then(function (file) {
                    if (file) {
                        let loadingPage = document.getElementsByClassName("app-page--loading-editor")[0];
                        $(loadingPage).removeClass("app-page--hidden").addClass("app-page--enter");

                        window.setTimeout(function () {
                            Ensemble.FileIO.loadProject(file, false);
                        }, 1000);
                    }
                });
            },

            recentListItemInvoked: function (event) {
                let itemIndex = event.detail.itemIndex,
                    projectFile = Ensemble.MainMenu.projectList[itemIndex],
                    filename = projectFile.filename,
                    text = projectFile.name;;

                let loadingPage = document.getElementsByClassName("app-page--loading-editor")[0];
                $(loadingPage).removeClass("app-page--hidden").addClass("app-page--enter");
                Ensemble.Session.setCurrentPage(Ensemble.Session.PageStates.loadingToEditor);
                window.setTimeout(function () {
                    Ensemble.FileIO.loadProject(projectFile.src, true);
                }, 1000);
            },

            receivedRecentProjects: function (projects) {
                Ensemble.MainMenu.projectList = Ensemble.MainMenu.projectList.concat(projects);
                Ensemble.MainMenu._recentProjectsReady = true;
                Ensemble.MainMenu._listeners.projectListLoadCheck();
            },

            receivedUnsavedProjects: function (projects) {
                Ensemble.MainMenu.projectList = Ensemble.MainMenu.projectList.concat(projects);
                Ensemble.MainMenu._unsavedProjectsReady = true;
                Ensemble.MainMenu._listeners.projectListLoadCheck();
            },

            projectListLoadCheck: function () {
                if (Ensemble.MainMenu._recentProjectsReady && Ensemble.MainMenu._unsavedProjectsReady) {
                    Ensemble.MainMenu.projectList = Ensemble.FileIO.pruneDuplicateProjects(Ensemble.MainMenu.projectList);
                    let bindingList = new WinJS.Binding.List(Ensemble.MainMenu.projectList),
                        groupedList = bindingList.createGrouped(
                            function (dataItem) {
                                return dataItem.internal ? 0 : 1;
                            },
                            function (dataItem) {
                                return dataItem.internal ? "Unsaved" : "Recent";
                            },
                            function (item1, item2) {
                                if (item1 < item2) return -1;
                                else if (item2 < item1) return 1;
                                else return 0;
                            }
                        );

                    Ensemble.MainMenu.ui.recentProjectContainer.winControl.itemDataSource = groupedList.dataSource;
                    Ensemble.MainMenu.ui.recentProjectContainer.winControl.groupDataSource = groupedList.groups.dataSource;
                }
            }
        }

    });
})();