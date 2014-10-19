(function () {
    WinJS.Namespace.define("Ensemble.MediaBrowser", {
        /// <summary>A central location for tracking information related to the in-app file browser.</summary>
        _breadCrumbsVideo: [],
        _breadCrumbsMusic: [],
        _breadCrumbsPicture: [],
        _context: "video",

        setContext: function (contextval) {
            /// <summary>Sets the context of the media browser and changes the view to the appropriate library.</summary>
            /// <param name="contextval" type="String">The type of context to enter. Must be one video, music, or picture. Defaults to video.</param>

            if (contextval != "video" && contextval != "music" && contextval != "picture") this._context = "video";
            else this._context = contextval;

            this.navigateToFolder(this.currentLocation());
        },

        currentLocation: function () {
            /// <summary>Returns the Media Browser's location in the current context.</summary>
            /// <returns type="Ensemble.EnsembleFile">The Media Browser's current folder location.</returns>
            var returnVal = null;
            switch (this._context) {
                case "video":
                    if (this._breadCrumbsVideo.length == 0) this._breadCrumbsVideo.push(Ensemble.FileIO.getHomeDirectory("video")); 
                    returnVal = this._breadCrumbsVideo[this._breadCrumbsVideo.length - 1];
                    break;
                case "music":
                    if (this._breadCrumbsMusic.length == 0) this._breadCrumbsMusic.push(Ensemble.FileIO.getHomeDirectory("music"));
                    returnVal = this._breadCrumbsMusic[this._breadCrumbsMusic.length - 1];
                    break;
                case "picture":
                    if (this._breadCrumbsPicture.length == 0) this._breadCrumbsPicture.push(Ensemble.FileIO.getHomeDirectory("picture"));
                    returnVal = this._breadCrumbsPicture[this._breadCrumbsPicture.length - 1];
                    break;
            }
            return returnVal;
        },

        upOneLevel: function () {
            /// <summary>Navigates the media browser up one level in the current context, if possible.</summary>
            switch (this._context) {
                case "video":
                    if (this._breadCrumbsVideo.length > 1) {
                        this._breadCrumbsVideo.pop();
                        Ensemble.MediaBrowser.navigateToFolder(this._breadCrumbsVideo[this._breadCrumbsVideo.length - 1]);
                    }
                    else console.log("Unable to go up one level - already at the top level.");
                    break;
                case "music":
                    if (this._breadCrumbsMusic.length > 1) {
                        this._breadCrumbsMusic.pop();
                        Ensemble.MediaBrowser.navigateToFolder(this._breadCrumbsMusic[this._breadCrumbsMusic.length - 1]);
                    }
                    else console.log("Unable to go up one level - already at the top level.");
                    break;
                case "picture":
                    if (this._breadCrumbsPicture.length > 1) {
                        this._breadCrumbsPicture.pop();
                        Ensemble.MediaBrowser.navigateToFolder(this._breadCrumbsPicture[this._breadCrumbsPicture.length - 1]);
                    }
                    else console.log("Unable to go up one level - already at the top level.");
                    break;
            }
        },

        navigateHome: function () {
            /// <summary>Navigates to the home directory in the current context.</summary>
            switch (this._context) {
                case "video":
                    this._breadCrumbsVideo = [];
                    break;
                case "music":
                    this._breadCrumbsMusic = [];
                    break;
                case "picture":
                    this._breadCrumbsPicture = [];
                    break;
            }
            Ensemble.MediaBrowser.navigateToFolder(Ensemble.MediaBrowser.currentLocation());
        },

        navigateToFolder: function (destination) {
            /// <summary>Navigates to the given folder in the current context.</summary>
            /// <param name="destination" type="Ensemble.EnsembleFolder">The folder to which to navigate.</param>
            switch (this._context) {
                case "video":
                    if (this._breadCrumbsVideo[this._breadCrumbsVideo.length - 1] != destination) this._breadCrumbsVideo.push(destination);
                    break;
                case "music":
                    if (this._breadCrumbsMusic[this._breadCrumbsMusic.length - 1] != destination) this._breadCrumbsMusic.push(destination);
                    break;
                case "picture":
                    if (this._breadCrumbsPicture[this._breadCrumbsPicture.length - 1] != destination) this._breadCrumbsPicture.push(destination);
                    break;
            }
            Ensemble.FileIO.pickItemsFromFolder(destination, Ensemble.MediaBrowser._populateMediaBrowserDisplay);
        },

        updateMediaFileMeta: function (index, meta) {
            /// <summary>Updates the media file at the given index in the Media Browser with the new metadata.</summary>
            /// <param name="index" type="Number">The index of the media item in the Media Browser.</param>
            /// <param name="meta" type="Object">An object containing the EnsembleFile instance variables to update.</param>

            Ensemble.Pages.Editor.UI.PageSections.menu.mediaMenu.local.mediaList.children;
            for (prop in meta) {
                Ensemble.Pages.Editor.UI.PageSections.menu.mediaMenu.local.mediaList.childNodes[index].ensembleFileRef[prop] = meta[prop];
            }

            var element = Ensemble.Pages.Editor.UI.PageSections.menu.mediaMenu.local.mediaList.childNodes[index];
            switch (element.ensembleFileRef.eo1type) {
                case "video":
                    element.getElementsByClassName("mediaBrowserListItemQuality")[0].innerText = Ensemble.Utilities.FriendlyResolutionGenerator.turnFriendly(meta["width"], meta["height"]);
                    element.getElementsByClassName("mediaBrowserListItemDuration")[0].innerText = Ensemble.Utilities.TimeConverter.convertTime(meta["duration"]);
                    break;
                case "audio":
                    element.getElementsByClassName("mediaBrowserListItemQuality")[0].innerText = meta["albumArtist"];
                    element.getElementsByClassName("mediaBrowserListItemDuration")[0].innerText = Ensemble.Utilities.TimeConverter.convertTime(meta["duration"]);
                    break;
                case "picture":
                    element.getElementsByClassName("mediaBrowserListItemQuality")[0].innerText = meta["width"] + " x " + meta["height"];
                    break;
            }
            

        },

        _populateMediaBrowserDisplay: function (files, folders) {
            /// <summary>Given a set of files and folders, fills the media browser display with representations of the data.</summary>
            /// <param name="files" type="Array">The files to display.</param>
            /// <param name="folders" type="Array">The folders to display.</param>
            Ensemble.Pages.Editor.UI.PageSections.menu.mediaMenu.local.mediaList.innerHTML = "";

            //var curDelay = 0;
            //var curDelayIter = 10;

            for (var i = 0; i < folders.length; i++) {
                var mediaEntry = document.createElement("div");
                mediaEntry.className = "mediaBrowserListItem";

                var iconSpace = document.createElement("div");
                iconSpace.className = "mediaBrowserListItemIcon";
                iconSpace.innerHTML = folders[i].icon;

                var metaData = document.createElement("div");
                metaData.className = "mediaBrowserListItemMeta";

                var titleRow = document.createElement("div");
                titleRow.className = "mediaBrowserListItemRow mediaBrowserListItemTitle";
                titleRow.innerText = folders[i].title || folders[i].displayName;

                var detailsRow = document.createElement("div");
                detailsRow.className = "mediaBrowserListItemRow";

                var typeDiv = document.createElement("div");
                typeDiv.className = "mediaBrowserListItemRowComponent";
                typeDiv.innerText = folders[i].displayType;

                var durationDiv = document.createElement("div");
                durationDiv.className = "mediaBrowserListItemRowComponent";
                //durationDiv.innerText = Ensemble.Utilities.TimeConverter.convertTime(files[i].duration, true);

                var qualityDiv = document.createElement("div");
                qualityDiv.className = "mediaBrowserListItemRowComponent";
                //qualityDiv.innerText = Ensemble.Utilities.FriendlyResolutionGenerator.turnFriendly(files[i].width, files[i].height);


                //Assemble the parts together.
                detailsRow.appendChild(typeDiv);
                detailsRow.appendChild(durationDiv);
                detailsRow.appendChild(qualityDiv);
                metaData.appendChild(titleRow);
                metaData.appendChild(detailsRow);
                mediaEntry.appendChild(iconSpace);
                mediaEntry.appendChild(metaData);
                mediaEntry.ensembleFileRef = folders[i];

                mediaEntry.addEventListener("click", Ensemble.MediaBrowser._mediaFolderOnClick, false);

                //mediaEntry.style.animationDelay = curDelay + "ms";
                //curDelay = curDelay + curDelayIter;

                //mediaEntry.addEventListener("mousedown", Ensemble.Pages.MainMenu._projectListItemOnMouseDownListener, false);
                //mediaEntry.addEventListener("mouseup", Ensemble.Pages.MainMenu._projectListItemOnMouseUpListener, false);

                Ensemble.Pages.Editor.UI.PageSections.menu.mediaMenu.local.mediaList.appendChild(mediaEntry);
            }
            for (var i = 0; i < files.length; i++) {
                var mediaEntry = document.createElement("div");
                mediaEntry.className = "mediaBrowserListItem";

                var iconSpace = document.createElement("div");
                iconSpace.className = "mediaBrowserListItemIcon";
                iconSpace.innerHTML = files[i].icon;

                var metaData = document.createElement("div");
                metaData.className = "mediaBrowserListItemMeta";

                var titleRow = document.createElement("div");
                titleRow.className = "mediaBrowserListItemRow mediaBrowserListItemTitle";
                titleRow.innerText = files[i].title || files[i].displayName;

                var detailsRow = document.createElement("div");
                detailsRow.className = "mediaBrowserListItemRow";

                var typeDiv = document.createElement("div");
                typeDiv.className = "mediaBrowserListItemRowComponent";
                typeDiv.innerText = files[i].displayType;

                var durationDiv = document.createElement("div");
                durationDiv.className = "mediaBrowserListItemRowComponent mediaBrowserListItemDuration";
                if (files[i].eo1type == "video" || files[i].eo1type == "audio") durationDiv.innerText = Ensemble.Utilities.TimeConverter.convertTime(files[i].duration, true);

                var qualityDiv = document.createElement("div");
                qualityDiv.className = "mediaBrowserListItemRowComponent mediaBrowserListItemQuality";
                if (files[i].eo1type == "video" || files[i].eo1type == "picture") qualityDiv.innerText = Ensemble.Utilities.FriendlyResolutionGenerator.turnFriendly(files[i].width, files[i].height);
                else if (files[i].eo1type == "audio") qualityDiv.innerText = files[i].albumArtist;


                //Assemble the parts together.
                detailsRow.appendChild(typeDiv);
                detailsRow.appendChild(durationDiv);
                detailsRow.appendChild(qualityDiv);
                metaData.appendChild(titleRow);
                metaData.appendChild(detailsRow);
                mediaEntry.appendChild(iconSpace);
                mediaEntry.appendChild(metaData);
                mediaEntry.ensembleFileRef = files[i];

                //mediaEntry.style.animationDelay = curDelay + "ms";
                //curDelay = curDelay + curDelayIter;

                //mediaEntry.addEventListener("mousedown", Ensemble.Pages.MainMenu._projectListItemOnMouseDownListener, false);
                //mediaEntry.addEventListener("mouseup", Ensemble.Pages.MainMenu._projectListItemOnMouseUpListener, false);

                Ensemble.Pages.Editor.UI.PageSections.menu.mediaMenu.local.mediaList.appendChild(mediaEntry);
            }


            //Rebuild the breadcrumb trail
            Ensemble.Pages.Editor.UI.PageSections.menu.mediaMenu.local.pathDisplay.innerHTML = "";
            var listToUse = null;
            switch (Ensemble.MediaBrowser._context) {
                case "video":
                    listToUse = Ensemble.MediaBrowser._breadCrumbsVideo;
                    break;
                case "music":
                    listToUse = Ensemble.MediaBrowser._breadCrumbsMusic;
                    break;
                case "picture":
                    listToUse = Ensemble.MediaBrowser._breadCrumbsPicture;
                    break;
            }

            for (var i = 1; i < listToUse.length; i++) {
                var pathItem = document.createElement("span");
                pathItem.className = "editorMediaBrowserPathItem";

                var pathItemName = document.createElement("span");
                pathItemName.className = "editorMediaBrowserPathItemButton";
                pathItemName.innerText = listToUse[i].displayName;
                pathItemName.title = listToUse[i].displayName;

                var pathItemArrow = document.createElement("span");
                pathItemArrow.className = "editorMediaBrowserPathItemButton";
                pathItemArrow.innerHTML = "&rsaquo;";

                pathItem.appendChild(pathItemName);
                pathItem.appendChild(pathItemArrow);
                pathItem.ensembleFile = listToUse[i];

                pathItem.addEventListener("click", Ensemble.MediaBrowser._breadcrumbOnClick, false);

                Ensemble.Pages.Editor.UI.PageSections.menu.mediaMenu.local.pathDisplay.appendChild(pathItem);
            }

        },

        enumerateProjects: function (callback) {
            /// <summary>Enumerates all available projects in the project directory.</summary>
            /// <param name="callback" type="Function">The callback to be fired after all projects have been enumerated.</param>
            console.info("Enumerating all saved projects...");
            switch (Ensemble.Platform.currentPlatform) {
                case "win8":
                    var dataArray = [];
                    Windows.Storage.ApplicationData.current.localFolder.getFolderAsync("Projects").then(function (projectDir) {
                        var projectQueryOptions = new Windows.Storage.Search.QueryOptions(Windows.Storage.Search.CommonFileQuery.orderByName, [".eo1"]);
                        var projectQuery = projectDir.createFileQueryWithOptions(projectQueryOptions);
                        projectQuery.getFilesAsync().then(function (projectFiles) {
                            if (projectFiles.length == 0) callback([]);
                            else {
                                for (var i = 0; i < projectFiles.length; i++) {
                                    Windows.Storage.FileIO.readTextAsync(projectFiles[i]).then(function (contents) {
                                        var parser = new DOMParser();
                                        var xmlDoc = parser.parseFromString(contents, "text/xml");

                                        var ensembleProject = xmlDoc.firstChild;

                                        var loadedProjectName = xmlDoc.getElementsByTagName("ProjectName")[0].childNodes[0].nodeValue;
                                        console.log("Found project \"" + loadedProjectName + "\" in the Projects directory!");
                                        try {
                                            var loadedDateModified = new Date(parseInt(xmlDoc.getElementsByTagName("DateModified")[0].childNodes[0].nodeValue, 10));
                                            loadedDateModified = loadedDateModified.customFormat("#MMM# #DD#, #YYYY# #h#:#mm##ampm#");
                                        }
                                        catch (exception) {
                                            var loadedDateModified = "Unknown";
                                        }
                                        var loadedAspectRatio = xmlDoc.getElementsByTagName("AspectRatio")[0].childNodes[0].nodeValue;
                                        var loadedNumberOfClips = parseInt(xmlDoc.getElementsByTagName("NumberOfClips")[0].childNodes[0].nodeValue);
                                        var loadedFilename = xmlDoc.getElementsByTagName("ProjectFilename")[0].childNodes[0].nodeValue;
                                        var loadedProjectLength = xmlDoc.getElementsByTagName("ProjectLength")[0].childNodes[0].nodeValue;
                                        var loadedThumbnailPath = "ms-appdata:///local/Projects/" + loadedFilename + ".jpg";

                                        dataArray.push(new Ensemble.Editor.ProjectFile(loadedProjectName, loadedFilename, loadedDateModified, loadedNumberOfClips, loadedAspectRatio, loadedProjectLength, loadedThumbnailPath));

                                        if (dataArray.length == projectFiles.length) {
                                            callback(dataArray);
                                        }
                                    });
                                }
                            }
                        });
                    });
                    break;
                case "android":
                    break;
                case "ios":
                    break;
            }
        },

        pickMediaFile: function (multi) {
            /// <summary>Shows a file picker appropriate to the current platform so the user can select a file.</summary>
            /// <param name="multi" type="Boolean">(Optionl) Show a multi-select file picker instead of the default one.</param>
            /// <returns type="File">The selected file. Returns null if no file was selected.</returns>
        },

        saveProject: function () {
            /// <summary>Saves the currently loaded project to disk.</summary>
        },

        deleteProject: function (filename) {
            /// <summary>Permanently deletes the project with the given filename.</summary>
            /// <param name="filename" type="String">The filename of the project to be deleted.</param>
            switch (Ensemble.Platform.currentPlatform) {
                case "win8":
                    var dataArray = [];
                    Windows.Storage.ApplicationData.current.localFolder.getFolderAsync("Projects").then(function (projectDir) {
                        projectDir.getFileAsync(filename).then(function (projectFile) {
                            projectFile.deleteAsync(Windows.Storage.StorageDeleteOption.permanentDelete).then(function (done) {
                                console.log("Deleted project file.");
                            });
                        });
                        projectDir.getFileAsync(filename + ".jpg").then(function (projectFile) {
                            projectFile.deleteAsync(Windows.Storage.StorageDeleteOption.permanentDelete).then(function (done) {
                                console.log("Deleted project thumbnail.");
                            });
                        });
                    });
                    break;
                case "android":
                    break;
                case "ios":
                    break;
            }
        },








        //Private functions
        _mediaFolderOnClick: function (event) {
            console.log("User clicked on media folder: " + event.currentTarget.ensembleFileRef.displayName);
            Ensemble.MediaBrowser.navigateToFolder(event.currentTarget.ensembleFileRef);
        },

        _breadcrumbOnClick: function (event) {
            console.log("Clicked a bread crumb.");
            switch (Ensemble.MediaBrowser._context) {
                case "video":
                    while (Ensemble.MediaBrowser._breadCrumbsVideo[Ensemble.MediaBrowser._breadCrumbsVideo.length - 1] !== event.currentTarget.ensembleFile) Ensemble.MediaBrowser._breadCrumbsVideo.pop();
                    break;
                case "music":
                    while (Ensemble.MediaBrowser._breadCrumbsMusic[Ensemble.MediaBrowser._breadCrumbsMusic.length - 1] !== event.currentTarget.ensembleFile) Ensemble.MediaBrowser._breadCrumbsMusic.pop();
                    break;
                case "picture":
                    while (Ensemble.MediaBrowser._breadCrumbsPicture[Ensemble.MediaBrowser._breadCrumbsPicture.length - 1] !== event.currentTarget.ensembleFile) Ensemble.MediaBrowser._breadCrumbsPicture.pop();
                    break;
            }
            Ensemble.MediaBrowser.navigateToFolder(Ensemble.MediaBrowser.currentLocation());
        }



    });
})();