(function () {
    WinJS.Namespace.define("Ensemble.FileIO", {
        /// <summary>Provides platform-agnostic interfaces for accessing the host device's file system.</summary>

        _win8_supportedVideoTypes: [".3g2", ".3gp2", ".3gp", ".3gpp", ".m4v", ".mp4v", ".mp4", ".mov", ".m2ts", ".asf", ".wm", ".wmv", ".avi"],
        _win8_supportedAudioTypes: [".m4a", ".wma", ".aac", ".adt", ".adts", ".mp3", ".wav", ".ac3", ".ec3"],
        _win8_supportedImageTypes: [".jpg", ".jpeg", ".png", ".gif", ".bmp"],

        _pickItemsCallback: null,
        _pickItemsTempFiles: [],
        _pickItemsTempFilesCount: 0,
        _pickItemsTempFolders: [],
        _pickItemsTempFoldersCount: 0,

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
            Ensemble.FileIO._pickItemsCallback = callback;
            switch (Ensemble.Platform.currentPlatform) {
                case "win8":
                    folder._src.getFoldersAsync().then(function (containedFolders) {
                        console.log("Got a list of folders in the current folder.");
                        folder._src.getFilesAsync().then(function (containedFiles) {
                            for (var i = 0; i < containedFolders.length; i++) {
                                console.log("Folder is: " + containedFolders[i].name);

                                var newFolder = new Ensemble.EnsembleFile(containedFolders[i]);
                                newFolder.dateCreated = containedFolders[i].dateCreated;
                                newFolder.displayName = containedFolders[i].displayName;
                                newFolder.displayType = containedFolders[i].displayType;
                                newFolder._winFolderRelativeId = containedFolders[i].folderRelativeId;
                                newFolder._winProperties = containedFolders[i].properties;
                                newFolder.fullName = containedFolders[i].name;
                                newFolder.path = containedFolders[i].path;

                                newFolder.icon = "&#xE188;";
                                newFolder.eo1type = "folder";

                                Ensemble.FileIO._pickItemsTempFolders.push(newFolder);
                            }
                            for (var i = 0; i < containedFiles.length; i++) {
                                console.log("File is: " + containedFiles[i].name);
                                console.log("    (content type: " + containedFiles[i].contentType + ")");
                                console.log("    (filetype: " + containedFiles[i].fileType + ")");

                                var newFile = new Ensemble.EnsembleFile(containedFiles[i]);
                                newFile.mime = containedFiles[i].contentType;
                                newFile.dateCreated = containedFiles[i].dateCreated;
                                newFile.displayName = containedFiles[i].displayName;
                                newFile.displayType = containedFiles[i].displayType;
                                newFile.fileType = containedFiles[i].fileType;
                                newFile._winFolderRelativeId = containedFiles[i].folderRelativeId;
                                newFile._winProperties = containedFiles[i].properties;
                                newFile.fullName = containedFiles[i].name;
                                newFile.path = containedFiles[i].path;


                                //Check that the file is supported.
                                if (newFile.mime.indexOf("audio") > -1 || newFile.mime.indexOf("video") > -1 || newFile.mime.indexOf("image") > -1) {
                                    if (Ensemble.FileIO._win8_supportedAudioTypes.indexOf(newFile.fileType) > -1 || Ensemble.FileIO._win8_supportedVideoTypes.indexOf(newFile.fileType) > -1 || Ensemble.FileIO._win8_supportedImageTypes.indexOf(newFile.fileType) > -1) {
                                        //File is of supported media type and extension.
                                        if (newFile.mime.indexOf("audio") > -1) {
                                            newFile.icon = "&#xE189;";
                                            newFile.eo1type = "audio";
                                        }
                                        else if (newFile.mime.indexOf("video") > -1) {
                                            newFile.icon = "&#xE116;";
                                            newFile.eo1type = "video";
                                        }
                                        else if (newFile.mime.indexOf("image") > -1) {
                                            newFile.icon = "&#xE116;";
                                            newFile.eo1type = "picture";
                                        }
                                    }
                                }
                                
                                Ensemble.FileIO._pickItemsTempFiles.push(newFile);
                            }
                            //Now that all files and folders have been added up, pull media information.
                            Ensemble.FileIO._winRetrievePickItemsTempFilesMediaProperties();
                        });
                    });
                    break;
                case "ios":
                    break;
                case "android":
                    break;
            }
        },

        _winRetrievePickItemsTempFilesMediaProperties: function () {
            /// <summary>Retrieves media properties for all of the temporary media items. </summary>
            for (var i = 0; i < Ensemble.FileIO._pickItemsTempFiles.length; i++) {
                var num = i;
                var cur = Ensemble.FileIO._pickItemsTempFiles[i];
                switch (Ensemble.FileIO._pickItemsTempFiles[i].eo1type) {
                    case "video":
                        Ensemble.FileIO._winRetrieveVideoProperties(Ensemble.FileIO._pickItemsTempFiles[i]._src, i);
                        break;
                    case "audio":
                        Ensemble.FileIO._pickItemsTempFiles[i]._src.properties.getMusicPropertiesAsync().done(function (success) {
                            console.log("Retrieved music properties.");
                            Ensemble.FileIO._pickItemsTempFiles[num].album = success.album;
                            Ensemble.FileIO._pickItemsTempFiles[num].albumArtist = success.albumArtist;
                            Ensemble.FileIO._pickItemsTempFiles[num].artist = success.artist;
                            Ensemble.FileIO._pickItemsTempFiles[num].bitrate = success.bitrate;
                            Ensemble.FileIO._pickItemsTempFiles[num].duration = success.duration;
                            Ensemble.FileIO._pickItemsTempFiles[num].genre = success.genre;
                            Ensemble.FileIO._pickItemsTempFiles[num].title = success.title;
                            Ensemble.FileIO._winCompleteMediaPropertyLookup();
                        });
                        break;
                    case "picture":
                        Ensemble.FileIO._pickItemsTempFiles[i].properties._src.getImagePropertiesAsync().done(function (success) {
                            Ensemble.FileIO._pickItemsTempFiles[num].dateTaken = success.dateTaken;
                            Ensemble.FileIO._pickItemsTempFiles[num].height = success.height;
                            Ensemble.FileIO._pickItemsTempFiles[num].width = success.width;
                            Ensemble.FileIO._pickItemsTempFiles[num].title = success.title;
                            Ensemble.FileIO._winCompleteMediaPropertyLookup();
                        });
                        break;
                }
            }
        },

        _winRetrieveVideoProperties: function (srcfile, index) {
            /// <summary>Retrieves media properties for all of the temporary media items. </summary>
            /// <param name="srcfile" type="Windows.Storage.StorageFile">The file whose properties to look up.</param>
            /// <param name="index" type="Number">The file's position in the overall list.</param>
            (function () {
                srcfile.properties.getVideoPropertiesAsync().done(function (success) {
                    console.log("Retrieved video properties for the item at index " + index + ".");
                    Ensemble.FileIO._pickItemsTempFiles[index].bitrate = success.bitrate;
                    Ensemble.FileIO._pickItemsTempFiles[index].duration = success.duration;
                    Ensemble.FileIO._pickItemsTempFiles[index].height = success.height;
                    Ensemble.FileIO._pickItemsTempFiles[index].width = success.width;
                    Ensemble.FileIO._pickItemsTempFiles[index].title = success.title;
                    Ensemble.FileIO._winCompleteMediaPropertyLookup();
                });
            })();
        },

        _winCompleteMediaPropertyLookup: function () {
            Ensemble.FileIO._pickItemsTempFilesCount++;
            if (Ensemble.FileIO._pickItemsTempFilesCount == Ensemble.FileIO._pickItemsTempFiles.length - 1) {
                //Lookup complete. Execute callback.
                Ensemble.FileIO._pickItemsCallback(Ensemble.FileIO._pickItemsTempFiles, Ensemble.FileIO._pickItemsTempFolders);

                //Reset the temporary file-lookup references.
                Ensemble.FileIO._pickItemsTempFilesCount = 0;
                Ensemble.FileIO._pickItemsTempFiles = [];
                Ensemble.FileIO._pickItemsTempFolders = [];
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