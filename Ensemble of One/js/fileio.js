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

        pickItemsFromFolder: function (folder, callback) {
            /// <summary>Picks all supported files and folders within the given directory and passes them via callback.</summary>
            /// <param name="folder" type="Ensemble.EnsembleFolder">The folder within which to look up files.</param>
            /// <param name="callback" type="Function">The function call to execute upon completion.</param>
            Ensemble.FileIO._pickItemsCallback = callback;
            Ensemble.FileIO._clearTempItemsLookup();
            switch (Ensemble.Platform.currentPlatform) {
                case "win8":
                    folder._src.getFoldersAsync().then(function (containedFolders) {
                        console.log("Got a list of folders in the current folder.");
                        folder._src.getFilesAsync().then(function (containedFiles) {
                            console.log("Got a list of media files in the current folder.");
                            for (var i = 0; i < containedFolders.length; i++) {
                                //console.log("Folder is: " + containedFolders[i].name);

                                var newFolder = new Ensemble.EnsembleFile(containedFolders[i]);
                                newFolder.dateCreated = containedFolders[i].dateCreated;
                                newFolder.displayName = containedFolders[i].displayName;
                                newFolder.displayType = containedFolders[i].displayType;
                                newFolder._uniqueId = containedFolders[i].folderRelativeId;
                                newFolder._winProperties = containedFolders[i].properties;
                                newFolder.fullName = containedFolders[i].name;
                                newFolder.path = containedFolders[i].path;

                                newFolder.icon = "&#xE188;";
                                newFolder.eo1type = "folder";

                                Ensemble.FileIO._pickItemsTempFolders.push(newFolder);
                            }
                            console.log("Finished adding folders to the array to display.");
                            for (var i = 0; i < containedFiles.length; i++) {
                                //console.log("File is: " + containedFiles[i].name);
                                //console.log("    (content type: " + containedFiles[i].contentType + ")");
                                //console.log("    (filetype: " + containedFiles[i].fileType + ")");
                                var newFile = new Ensemble.EnsembleFile(containedFiles[i]);
                                newFile.mime = containedFiles[i].contentType;
                                newFile.dateCreated = containedFiles[i].dateCreated;
                                newFile.displayName = containedFiles[i].displayName;
                                newFile.displayType = containedFiles[i].displayType;
                                newFile.fileType = containedFiles[i].fileType.toLowerCase();
                                newFile._uniqueId = containedFiles[i].folderRelativeId;
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
                                            newFile.icon = "&#xE114;";
                                            newFile.eo1type = "picture";
                                        }
                                        else {
                                            console.log("File is of invalid MIME type.");
                                        }
                                        Ensemble.FileIO._pickItemsTempFiles.push(newFile);
                                    }
                                }
                                
                                
                            }
                            console.log("Finished adding media files to the array to display.");
                            //Now that all files and folders have been added up, pull media information.
                            Ensemble.FileIO._pickItemsCallback(Ensemble.FileIO._pickItemsTempFiles, Ensemble.FileIO._pickItemsTempFolders);
                            

                            //Ensemble.FileIO._winRetrievePickItemsTempFilesMediaProperties();

                            

                            
                        });
                    });
                    break;
                case "ios":
                    break;
                case "android":
                    break;
            }
        },

        retrieveMediaProperties: function (ensembleFile, index, callback) {
            /// <summary>Retrieves the metadata for the given EnsembleFile at the given index value, and then executes the callback.</summary>
            /// <param name="ensembleFile" type="Ensemble.EnsembleFile">The file whose media properties to look up.</param>
            /// <param name="index" type="Number">The file's original index in the Media Browser list.</param>
            /// <param name="callback" type="Function">The callback to execute after retrieving the media properties. Will pass the index and the meta to the callback function.</param>
            if (ensembleFile != null) {
                switch (Ensemble.Platform.currentPlatform) {
                    case "win8":
                        switch (ensembleFile.eo1type) {
                            case "video":
                                ensembleFile._src.properties.getVideoPropertiesAsync().done(function (success) {
                                    //console.log("Retrieved video properties for the item at index " + index + ".");
                                    var returnVal = {
                                        bitrate: success.bitrate,
                                        duration: success.duration,
                                        height: success.height,
                                        width: success.width,
                                        title: success.title
                                    };

                                    callback(index, returnVal, ensembleFile._uniqueId);
                                    //Ensemble.FileIO._winCompleteMediaPropertyLookup();
                                });
                                break;
                            case "audio":
                                ensembleFile._src.properties.getMusicPropertiesAsync().done(function (success) {
                                    //console.log("Retrieved music properties.");

                                    var returnVal = {
                                        album: success.album,
                                        albumArtist: success.albumArtist,
                                        artist: success.artist,
                                        bitrate: success.bitrate,
                                        duration: success.duration,
                                        genre: success.genre,
                                        title: success.title
                                    };

                                    callback(index, returnVal, ensembleFile._uniqueId);
                                });
                                break;
                            case "picture":
                                ensembleFile._src.properties.getImagePropertiesAsync().done(function (success) {
                                    //console.log("Retrieved image properties for file \"" + srcfile.name + ".\"");
                                    var returnVal = {
                                        dateTaken: success.dateTaken,
                                        height: success.height,
                                        width: success.width,
                                        title: success.title,
                                    };
                                    callback(index, returnVal, ensembleFile._uniqueId);
                                });
                                break;
                            case "folder":
                                callback(index, null, ensembleFile._uniqueId);
                                break;
                        }
                        break;
                    case "ios":
                        break;
                    case "android":
                        break;
                }
            }

            
        },

        retrieveThumbnail: function (ensembleFile, index, callback) {
            /// <summary>Retrieves the metadata for the given EnsembleFile at the given index value, and then executes the callback.</summary>
            /// <param name="ensembleFile" type="Ensemble.EnsembleFile">The file whose thumbnail to look up.</param>
            /// <param name="index" type="Number">The file's original index in the Media Browser list.</param>
            /// <param name="callback" type="Function">The callback to execute after retrieving the thumbnail. Will pass the index and the thumb to the callback function.</param>
            if (ensembleFile != null) {
                switch (Ensemble.Platform.currentPlatform) {
                    case "win8":
                        switch (ensembleFile.eo1type) {
                            case "folder":
                                callback(index, null, ensembleFile._uniqueId);
                                break;
                            default:
                                ensembleFile._src.getScaledImageAsThumbnailAsync(Windows.Storage.FileProperties.ThumbnailMode.listView, 50).done(function (success) {
                                    //console.log("Retrieved video properties for the item at index " + index + ".");
                                    //console.log("Retrieved a thumbnail!");

                                    callback(index, 'url(' + URL.createObjectURL(success) + ')', ensembleFile._uniqueId);
                                    //Ensemble.FileIO._winCompleteMediaPropertyLookup();
                                });
                                break;
                            
                        }
                        break;
                    case "ios":
                        break;
                    case "android":
                        break;
                }
            }
        },

        _clearTempItemsLookup: function () {
            Ensemble.FileIO._pickItemsTempFilesCount = 0;
            Ensemble.FileIO._pickItemsTempFiles = [];
            Ensemble.FileIO._pickItemsTempFolders = [];
        },

        _winRetrievePickItemsTempFilesMediaProperties: function () {
            /// <summary>Retrieves media properties for all of the temporary media items. </summary>
            if (Ensemble.FileIO._pickItemsTempFiles.length == 0) Ensemble.FileIO._winCompleteMediaPropertyLookup();
            for (var i = 0; i < Ensemble.FileIO._pickItemsTempFiles.length; i++) {
                switch (Ensemble.FileIO._pickItemsTempFiles[i].eo1type) {
                    case "video":
                        Ensemble.FileIO._winRetrieveVideoProperties(Ensemble.FileIO._pickItemsTempFiles[i]._src, i);
                        break;
                    case "audio":
                        Ensemble.FileIO._winRetrieveMusicProperties(Ensemble.FileIO._pickItemsTempFiles[i]._src, i);
                        break;
                    case "picture":
                        Ensemble.FileIO._winRetrieveImageProperties(Ensemble.FileIO._pickItemsTempFiles[i]._src, i);
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
                    //console.log("Retrieved video properties for the item at index " + index + ".");
                    var returnVal = {
                        bitrate: success.bitrate,
                        duration: success.duration,
                        height: success.height,
                        width: success.width,
                        title: success.title
                    };
                    
                    Ensemble.MediaBrowser.updateMediaFileMeta(index + Ensemble.FileIO._pickItemsTempFolders.length, returnVal);
                    Ensemble.FileIO._winCompleteMediaPropertyLookup();
                });
            })();
        },

        _winRetrieveMusicProperties: function (srcfile, index) {
            /// <summary>Retrieves media properties for all of the temporary media items. </summary>
            /// <param name="srcfile" type="Windows.Storage.StorageFile">The file whose properties to look up.</param>
            /// <param name="index" type="Number">The file's position in the overall list.</param>
            (function () {
                srcfile.properties.getMusicPropertiesAsync().done(function (success) {
                    //console.log("Retrieved music properties.");

                    var returnVal = {
                        album: success.album,
                        albumArtist: success.albumArtist,
                        artist: success.artist,
                        bitrate: success.bitrate,
                        duration: success.duration,
                        genre: success.genre,
                        title: success.title
                    };

                    Ensemble.MediaBrowser.updateMediaFileMeta(index + Ensemble.FileIO._pickItemsTempFolders.length, returnVal);
                    Ensemble.FileIO._winCompleteMediaPropertyLookup();
                });
            })();
        },

        _winRetrieveImageProperties: function (srcfile, index) {
            /// <summary>Retrieves media properties for all of the temporary media items. </summary>
            /// <param name="srcfile" type="Windows.Storage.StorageFile">The file whose properties to look up.</param>
            /// <param name="index" type="Number">The file's position in the overall list.</param>
            (function () {
                srcfile.properties.getImagePropertiesAsync().done(function (success) {
                    //console.log("Retrieved image properties for file \"" + srcfile.name + ".\"");
                    var returnVal = {
                        dateTaken: success.dateTaken,
                        height: success.height,
                        width: success.width,
                        title: success.title,
                    };
                    Ensemble.MediaBrowser.updateMediaFileMeta(index + Ensemble.FileIO._pickItemsTempFolders.length, returnVal);
                    Ensemble.FileIO._winCompleteMediaPropertyLookup();
                });
            })();
        },

        _winCompleteMediaPropertyLookup: function () {
            Ensemble.FileIO._pickItemsTempFilesCount++;
            if (Ensemble.FileIO._pickItemsTempFilesCount >= Ensemble.FileIO._pickItemsTempFiles.length) {
                //Lookup complete. Execute callback.
                //Ensemble.FileIO._pickItemsCallback(Ensemble.FileIO._pickItemsTempFiles, Ensemble.FileIO._pickItemsTempFolders);
                console.info("Metadata retrieval complete.");
                //Reset the temporary file-lookup references.
                Ensemble.FileIO._clearTempItemsLookup();
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
        },

        deleteAllProjects: function () {
            /// <summary>Permanently deletes all projects and their accompanying thumbnails.</summary>
            console.log("Deleting all projects...");
            switch (Ensemble.Platform.currentPlatform) {
                case "win8":
                    Windows.Storage.ApplicationData.current.localFolder.getFolderAsync("Projects").then(function (projectDir) {
                        var projectQueryOptions = new Windows.Storage.Search.QueryOptions(Windows.Storage.Search.CommonFileQuery.orderByName, [".eo1", ".jpg"]);
                        var projectQuery = projectDir.createFileQueryWithOptions(projectQueryOptions);
                        projectQuery.getFilesAsync().then(function (projectFiles) {
                            if (projectFiles.length > 0) {
                                for (var i = 0; i < projectFiles.length; i++) {
                                    projectFiles[i].deleteAsync(Windows.Storage.StorageDeleteOption.permanentDelete).done(function (success) {
                                        //console.log("Deleted a project file.");
                                    });
                                }
                            }
                            else console.log("No projects to delete.");
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