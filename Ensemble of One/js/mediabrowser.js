﻿(function () {
    WinJS.Namespace.define("Ensemble.MediaBrowser", {
        /// <summary>A central location for tracking information related to the in-app file browser.</summary>
        _breadCrumbsVideo: [],
        _breadCrumbsMusic: [],
        _breadCrumbsPicture: [],
        _context: "video",

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

        navigateToFolder: function (destination, callback) {
            /// <summary>Navigates to the given folder in the current context.</summary>
            /// <param name="destination" type="Ensemble.EnsembleFolder">The folder to which to navigate.</param>
            /// <param name="callback" type="Function">The callback to perform after directory navigation is complete.</param>
            switch (this._context) {
                case "video":
                    this._breadCrumbsVideo.push(destination);
                    break;
                case "music":
                    this._breadCrumbsMusic.push(destination);
                    break;
                case "picture":
                    this._breadCrumbsPicture.push(destination);
                    break;
            }
            Ensemble.FileIO.pickItemsFromFolder(destination, callback);
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
        }
    });
})();