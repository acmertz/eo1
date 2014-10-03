(function () {
    WinJS.Namespace.define("Ensemble.FileIO", {
        /// <summary>Provides platform-agnostic interfaces for accessing the host device's file system.</summary>
        createProject: function (name, location, aspect) {
            /// <summary>Creates save files for a new project.</summary>
            /// <param name="name" type="String">The name of the project.</param>
            /// <param name="location" type="String">The location of the project. Values other than "local" or "cloud" will generate an exception.</param>
            /// <param name="aspect" type="String">The aspect ratio of the project (16:9, 4:3, etc.).</param>

            switch (Ensemble.Platform.currentPlatform) {
                case "win8":
                    Windows.Storage.ApplicationData.current.localFolder.createFolderAsync("Projects", Windows.Storage.CreationCollisionOption.openIfExists).then(function (projectDir) {
                        projectDir.createFileAsync(name + ".eo1", Windows.Storage.CreationCollisionOption.generateUniqueName).then(function (projectFile) {
                            var savetime = Date.now().toString(10);

                            var xml = new XMLWriter();
                            xml.BeginNode("EnsembleOfOneProject");
                            xml.BeginNode("ProjectName");
                            xml.WriteString(name);
                            xml.EndNode();
                            xml.BeginNode("ProjectFilename");
                            xml.WriteString(projectFile.name);
                            xml.EndNode();
                            xml.BeginNode("DateCreated");
                            xml.WriteString(savetime);
                            xml.EndNode();
                            xml.BeginNode("DateModified");
                            xml.WriteString(savetime);
                            xml.EndNode();
                            xml.BeginNode("AspectRatio");
                            xml.WriteString(aspect);
                            xml.EndNode();
                            xml.BeginNode("MaxResolution");
                            xml.BeginNode("Width");
                            xml.WriteString(Ensemble.Session.maxResolution[0].toString());
                            xml.EndNode();
                            xml.BeginNode("Height");
                            xml.WriteString(Ensemble.Session.maxResolution[1].toString());
                            xml.EndNode();
                            xml.EndNode();
                            xml.BeginNode("ProjectLength");
                            xml.WriteString("0");
                            xml.EndNode();
                            xml.BeginNode("NumberOfClips");
                            xml.WriteString("0");
                            xml.EndNode();
                            xml.BeginNode("Clips");
                            xml.WriteString("");
                            xml.EndNode();
                            xml.EndNode();
                            xml.Close();

                            //Generate a thumbnail.
                            console.log("Creating save files...");
                            Windows.Storage.FileIO.writeTextAsync(projectFile, xml.ToString()).then(function () {
                                var saveaspect = aspect.replace(":", "");
                                saveaspect = saveaspect.replace(".", "")
                                Windows.Storage.StorageFile.getFileFromApplicationUriAsync(new Windows.Foundation.Uri("ms-appx:///img/projectThumbnails/" + saveaspect + ".jpg")).then(function (defaultThumb) {
                                    defaultThumb.copyAsync(projectDir, projectFile.name + ".jpg").done(function () {
                                        //Finished creating project files. Now update session state.
                                        Ensemble.Session.projectName = name;
                                        Ensemble.Session.projectAspect = aspect;
                                        Ensemble.Session.projectFilename = projectFile.name;
                                        Ensemble.Session.horizontalDividerPosition = 0.5;
                                        Ensemble.Session.verticalDividerPosition = 0.5;

                                        Ensemble.Session.projectLoading = false;
                                        console.log("Project finished creating.");
                                    });
                                }, function (error) {
                                    console.log("Error retrieving the thumbnail.");
                                });
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

        loadProject: function (filename) {
            /// <summary>Loads a previously saved project from storage.</summary>
            /// <param name="filename" type="String">The name of the project to be loaded.</param>
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

        pickItemsFromFolder: function (folder, callback) {
            /// <summary>Picks all supported files and folders within the given directory and passes them via callback.</summary>
            /// <param name="folder" type="Ensemble.EnsembleFolder">The folder within which to look up files.</param>
            /// <param name="callback" type="Function">The function call to execute upon completion.</param>
            switch (Ensemble.Platform.currentPlatform) {
                case "win8":
                    folder._src.getFoldersAsync().then(function (containedFolders) {
                        console.log("Got a list of folders in the current folder.");
                        folder._src.getFilesAsync().then(function (containedFiles) {
                            for (var i = 0; i < containedFolders.length; i++) {
                                console.log("Folder is: " + containedFolders[i].name);
                            }
                            for (var i = 0; i < containedFiles.length; i++) {
                                console.log("File is: " + containedFiles[i].name);
                                console.log("    (content type: " + containedFiles[i].contentType + ")");
                                console.log("    (filetype: " + containedFiles[i].fileType + ")");
                            }
                        });
                    });
                    break;
                case "ios":
                    break;
                case "android":
                    break;
            }
        },

        getHomeDirectory: function (directoryName) {
            /// <summary>Returns the home directory of the given media type.</summary>
            /// <param name="directoryName" type="String">The string representing the home directory name. Must be one of the following: "video" "music" "picture"</param>
            /// <returns type="Ensemble.EnsembleFolder">An EnsembleFolder representing the given home directory.</returns>
            var returnVal = null;
            switch (directoryName) {
                case "video":
                    switch (Ensemble.Platform.currentPlatform) {
                        case "win8":
                            returnVal = new Ensemble.EnsembleFolder(Windows.Storage.KnownFolders.videosLibrary);
                            break;
                        case "ios":
                            break;
                        case "android":
                            break;
                    }
                    break;
                case "music":
                    switch (Ensemble.Platform.currentPlatform) {
                        case "win8":
                            returnVal = new Ensemble.EnsembleFolder(Windows.Storage.KnownFolders.musicLibrary);
                            break;
                        case "ios":
                            break;
                        case "android":
                            break;
                    }
                    break;
                case "picture":
                    switch (Ensemble.Platform.currentPlatform) {
                        case "win8":
                            returnVal = new Ensemble.EnsembleFolder(Windows.Storage.KnownFolders.picturesLibrary);
                            break;
                        case "ios":
                            break;
                        case "android":
                            break;
                    }
                    break;
            }
            return returnVal;
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