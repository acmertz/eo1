(function () {
    WinJS.Namespace.define("Ensemble.FileIO", {
        /// <summary>Provides platform-agnostic interfaces for accessing the host device's file system.</summary>

        _win8_supportedVideoTypes: [".3g2", ".3gp2", ".3gp", ".3gpp", ".m4v", ".mp4v", ".mp4", ".mov", ".m2ts", ".asf", ".wm", ".wmv", ".avi"],
        _win8_supportedAudioTypes: [".m4a", ".wma", ".aac", ".adt", ".adts", ".mp3", ".wav", ".ac3", ".ec3"],
        _win8_supportedImageTypes: [".jpg", ".jpeg", ".png", ".gif", ".bmp"],

        _clipLoadBuffer: {},

        _pickItemsCallback: null,
        _pickItemsTempFiles: [],
        _pickItemsTempFilesCount: 0,
        _pickItemsTempFolders: [],
        _pickItemsTempFoldersCount: 0,

        saveProject: function () {
            /// <summary>Saves the currently loaded project to disc.</summary>

            //Generate XML string
            var xml = new XMLWriter();
            xml.BeginNode("EnsembleOfOneProject");

            xml.BeginNode("ProjectName");
            xml.WriteString(Ensemble.Session.projectName);
            xml.EndNode();

            xml.BeginNode("DateCreated");
            xml.WriteString(Ensemble.Session.projectDateCreated.getTime().toString());
            xml.EndNode();

            xml.BeginNode("DateModified");
            xml.WriteString(Date.now().toString(10));
            xml.EndNode();

            xml.BeginNode("AspectRatio");
            xml.WriteString(Ensemble.Session.projectAspect);
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
            xml.WriteString(Ensemble.Session.projectDuration.toString());
            xml.EndNode();

            xml.BeginNode("Tracks");
            xml.Attrib("FreeTrackId", Ensemble.Editor.TimelineMGR._uniqueTrackID.toString());
            xml.Attrib("FreeClipId", Ensemble.Editor.TimelineMGR._uniqueClipID.toString());
            //Write track data
            if (Ensemble.Session.projectTrackCount == 0) xml.WriteString("");
            else {
                for (var i = 0; i < Ensemble.Session.projectTrackCount; i++) {
                    xml = Ensemble.FileIO._writeTrackToXML(xml, Ensemble.Editor.TimelineMGR.tracks[i]);
                }
            }
            xml.EndNode();

            xml.BeginNode("History");
            xml.BeginNode("Undo");
            if (Ensemble.HistoryMGR.canUndo()) {
                for (var i = 0; i < Ensemble.HistoryMGR._backStack.length; i++) {
                    xml.BeginNode("HistoryAction");
                    switch (Ensemble.HistoryMGR._backStack[i]._type) {
                        case Ensemble.Events.Action.ActionType.createTrack:
                            xml.Attrib("type", Ensemble.HistoryMGR._backStack[i]._type);
                            xml.Attrib("trackId", Ensemble.HistoryMGR._backStack[i]._payload.trackId.toString());                            
                            break;
                        case Ensemble.Events.Action.ActionType.renameTrack:
                            xml.Attrib("type", Ensemble.HistoryMGR._backStack[i]._type);
                            xml.Attrib("trackId", Ensemble.HistoryMGR._backStack[i]._payload.trackId.toString());                            
                            xml.Attrib("oldName", Ensemble.HistoryMGR._backStack[i]._payload.oldName);
                            xml.Attrib("newName", Ensemble.HistoryMGR._backStack[i]._payload.newName);
                            break;
                        case Ensemble.Events.Action.ActionType.trackVolumeChanged:
                            xml.Attrib("type", Ensemble.HistoryMGR._backStack[i]._type);
                            xml.Attrib("trackId", Ensemble.HistoryMGR._backStack[i]._payload.trackId.toString());                            
                            xml.Attrib("oldVolume", Ensemble.HistoryMGR._backStack[i]._payload.oldVolume.toString());
                            xml.Attrib("newVolume", Ensemble.HistoryMGR._backStack[i]._payload.newVolume.toString());
                            break;
                        case Ensemble.Events.Action.ActionType.moveTrack:
                            xml.Attrib("type", Ensemble.HistoryMGR._backStack[i]._type);
                            xml.Attrib("trackId", Ensemble.HistoryMGR._backStack[i]._payload.trackId.toString());                            
                            xml.Attrib("origin", Ensemble.HistoryMGR._backStack[i]._payload.origin.toString());
                            xml.Attrib("destination", Ensemble.HistoryMGR._backStack[i]._payload.destination.toString());
                            break;
                        case Ensemble.Events.Action.ActionType.removeTrack:
                            xml.Attrib("type", Ensemble.HistoryMGR._backStack[i]._type);
                            xml.Attrib("trackId", Ensemble.HistoryMGR._backStack[i]._payload.trackId.toString());                            
                            xml.Attrib("originalLocation", Ensemble.HistoryMGR._backStack[i]._payload.originalLocation.toString())
                            xml = Ensemble.FileIO._writeTrackToXML(xml, Ensemble.HistoryMGR._backStack[i]._payload.trackObj);
                            break;
                        case Ensemble.Events.Action.ActionType.importClip:
                            xml.Attrib("type", Ensemble.HistoryMGR._backStack[i]._type);
                            xml.Attrib("destinationTrack", Ensemble.HistoryMGR._backStack[i]._payload.destinationTrack.toString());
                            xml.Attrib("clipId", Ensemble.HistoryMGR._backStack[i]._payload.clipObj.id.toString());
                            break;
                        default:
                            console.error("Unable to save History Action to disk - unknown type.");
                    }
                    xml.EndNode();
                }
            }
            else xml.WriteString("");
            xml.EndNode();

            xml.BeginNode("Redo");
            if (Ensemble.HistoryMGR.canRedo()) {
                for (var i = 0; i < Ensemble.HistoryMGR._forwardStack.length; i++) {
                    xml.BeginNode("HistoryAction");
                    switch (Ensemble.HistoryMGR._forwardStack[i]._type) {
                        case Ensemble.Events.Action.ActionType.createTrack:
                            xml.Attrib("type", Ensemble.HistoryMGR._forwardStack[i]._type);
                            xml.Attrib("trackId", Ensemble.HistoryMGR._forwardStack[i]._payload.trackId.toString());                            
                            break;
                        case Ensemble.Events.Action.ActionType.renameTrack:
                            xml.Attrib("type", Ensemble.HistoryMGR._forwardStack[i]._type);
                            xml.Attrib("trackId", Ensemble.HistoryMGR._forwardStack[i]._payload.trackId.toString());                            
                            xml.Attrib("oldName", Ensemble.HistoryMGR._forwardStack[i]._payload.oldName);
                            xml.Attrib("newName", Ensemble.HistoryMGR._forwardStack[i]._payload.newName);
                            break;
                        case Ensemble.Events.Action.ActionType.trackVolumeChanged:
                            xml.Attrib("type", Ensemble.HistoryMGR._forwardStack[i]._type);
                            xml.Attrib("trackId", Ensemble.HistoryMGR._forwardStack[i]._payload.trackId.toString());                            
                            xml.Attrib("oldVolume", Ensemble.HistoryMGR._forwardStack[i]._payload.oldVolume.toString());
                            xml.Attrib("newVolume", Ensemble.HistoryMGR._forwardStack[i]._payload.newVolume.toString());
                            break;
                        case Ensemble.Events.Action.ActionType.moveTrack:
                            xml.Attrib("type", Ensemble.HistoryMGR._forwardStack[i]._type);
                            xml.Attrib("trackId", Ensemble.HistoryMGR._forwardStack[i]._payload.trackId.toString());                            
                            xml.Attrib("origin", Ensemble.HistoryMGR._forwardStack[i]._payload.origin.toString());
                            xml.Attrib("destination", Ensemble.HistoryMGR._forwardStack[i]._payload.destination.toString());
                            break;
                        case Ensemble.Events.Action.ActionType.removeTrack:
                            xml.Attrib("type", Ensemble.HistoryMGR._forwardStack[i]._type);
                            xml.Attrib("trackId", Ensemble.HistoryMGR._forwardStack[i]._payload.trackId.toString());                            
                            xml.Attrib("originalLocation", Ensemble.HistoryMGR._forwardStack[i]._payload.originalLocation.toString())
                            xml = Ensemble.FileIO._writeTrackToXML(xml, Ensemble.HistoryMGR._forwardStack[i]._payload.trackObj);
                            break;
                        case Ensemble.Events.Action.ActionType.importClip:
                            xml.Attrib("type", Ensemble.HistoryMGR._forwardStack[i]._type);
                            xml.Attrib("destinationTrack", Ensemble.HistoryMGR._forwardStack[i]._payload.destinationTrack.toString());
                            xml = Ensemble.FileIO._writeClipToXML(xml, Ensemble.HistoryMGR._forwardStack[i]._payload.clipObj);
                            break;
                        default:
                            console.error("Unable to save History Action to disk - unknown type.");
                    }
                    xml.EndNode();
                }
            }
            else xml.WriteString("");
            xml.EndNode();
            xml.EndNode();

            xml.EndNode();
            xml.Close();

            xml = xml.ToString();
            
            switch (Ensemble.Platform.currentPlatform) {
                case "win8":
                    var uri = new Windows.Foundation.Uri('ms-appdata:///local/Projects/' + Ensemble.Session.projectFilename);
                    Windows.Storage.StorageFile.getFileFromApplicationUriAsync(uri).then(function (outputFile) {
                        Windows.Storage.FileIO.writeTextAsync(outputFile, xml).done(function (complete) {
                            console.info("Saved " + Ensemble.Session.projectName + ".");
                        });
                    }, function (error) {
                        console.error("Unable to save project: " + error);
                    });
                    break;
                case "android":
                    break;
                case "ios":
                    break;
            }
        },

        _writeTrackToXML: function (xml, track) {
            /// <summary>Writes XML data for the given track to the XML file.</summary>
            /// <param name="xml" type="XMLWriter">The XML writer.</param>
            /// <param name="track" type="Ensemble.Editor.Track">The Track to save.</param>
            /// <returns type="XMLWriter">The updated XML writer, including the new Track.</returns>
            xml.BeginNode("Track");
            xml.Attrib("trackId", track.id.toString());
            xml.Attrib("trackName", track.name);
            xml.Attrib("trackVolume", track.volume.toString());

            //Write clip data
            if (track.clips.length == 0) xml.WriteString("");
            else {
                for (var k = 0; k < track.clips.length; k++) {
                    xml = this._writeClipToXML(xml, track.clips[k])
                }
            }
            xml.EndNode();

            return xml;
        },

        _writeClipToXML: function (xml, clip) {
            /// <summary>Writes XML data for the given track to the XML file.</summary>
            /// <param name="xml" type="XMLWriter">The XML writer.</param>
            /// <param name="clip" type="Ensemble.Editor.Clip">The Clip to save.</param>
            /// <returns type="XMLWriter">The updated XML writer, including the new Clip.</returns>
            xml.BeginNode("Clip");
            xml.Attrib("id", clip.id.toString());
            xml.Attrib("name", clip.name);
            xml.Attrib("volume", clip.volume.toString());
            xml.Attrib("start", clip.startTime.toString());
            xml.Attrib("duration", clip.duration.toString());
            xml.Attrib("type", clip.type);
            xml.Attrib("path", clip.file.path);
            xml.EndNode();
            return xml;
        },

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
                            xml.BeginNode("Tracks");
                            xml.Attrib("FreeTrackId", "0");
                            xml.Attrib("FreeClipId", "0");
                            xml.WriteString("");
                            xml.EndNode();
                            xml.BeginNode("History");
                            xml.BeginNode("Undo");
                            xml.WriteString("");
                            xml.EndNode();
                            xml.BeginNode("Redo");
                            xml.WriteString("");
                            xml.EndNode();
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
                                        //Ensemble.Session.projectName = name;
                                        //Ensemble.Session.projectAspect = aspect;
                                        //Ensemble.Session.projectFilename = projectFile.name;

                                        //Ensemble.Session.projectLoading = false;
                                        console.log("Project finished creating.");

                                        window.setTimeout(function () {
                                            Ensemble.Pages.MainMenu.showProjectLoadingPage(name);

                                            window.setTimeout(function () {
                                                Ensemble.FileIO.loadProject(projectFile.name);
                                            }, 500);
                                        }, 1000);
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
            /// <param name="callback" type="Function">The callback to execute when the project is fully loaded.</param>

            switch (Ensemble.Platform.currentPlatform) {
                case "win8":
                    var uri = new Windows.Foundation.Uri('ms-appdata:///local/Projects/' + filename);
                    var file = Windows.Storage.StorageFile.getFileFromApplicationUriAsync(uri).then(function (projectFile) {
                        Windows.Storage.FileIO.readTextAsync(projectFile).then(function (contents) {
                            Ensemble.FileIO._processLoadedProjectData(filename, contents);
                        })
                    });
                    break;
                case "android":
                    break;
                case "ios":
                    break;
            }
        },

        _processLoadedProjectData: function (filename, xmlString) {
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(xmlString, "text/xml");

            var ensembleProject = xmlDoc.firstChild;

            var projectName = xmlDoc.getElementsByTagName("ProjectName")[0].childNodes[0].nodeValue;
            console.log("Loading project \"" + projectName + "...\"");

            var dateModified = new Date(parseInt(xmlDoc.getElementsByTagName("DateModified")[0].childNodes[0].nodeValue, 10));
            var dateCreated = new Date(parseInt(xmlDoc.getElementsByTagName("DateCreated")[0].childNodes[0].nodeValue, 10));
            var aspectRatio = xmlDoc.getElementsByTagName("AspectRatio")[0].childNodes[0].nodeValue;
            var duration = parseInt(xmlDoc.getElementsByTagName("ProjectLength")[0].childNodes[0].nodeValue, 10);
            var thumbnailPath = "ms-appdata:///local/Projects/" + filename + ".jpg";

            var tracks = xmlDoc.getElementsByTagName("Tracks")[0].getElementsByTagName("Track");
            var freeTrackId = parseInt(xmlDoc.getElementsByTagName("Tracks")[0].getAttribute("FreeTrackId"));
            var freeClipId = parseInt(xmlDoc.getElementsByTagName("Tracks")[0].getAttribute("FreeClipId"));
            var numberOfClips = xmlDoc.getElementsByTagName("MediaClip").length;

            var historyParent = xmlDoc.getElementsByTagName("History")[0];
            var undoParent = historyParent.getElementsByTagName("Undo")[0];
            var redoParent = historyParent.getElementsByTagName("Redo")[0];

            Ensemble.Session.projectAspect = aspectRatio;
            Ensemble.Session.projectFilename = filename;
            Ensemble.Session.projectName = projectName;
            Ensemble.Session.projectDuration = duration;
            Ensemble.Session.projectDateModified = dateModified;
            Ensemble.Session.projectDateCreated = dateCreated;

            //May be overridden during the rest of the load process due to missing or invalid clip references.
            Ensemble.Session.projectClipCount = numberOfClips;
            Ensemble.Session.projectTrackCount = tracks.length;
            Ensemble.Editor.TimelineMGR._uniqueTrackID = freeTrackId;
            Ensemble.Editor.TimelineMGR._uniqueClipID = freeClipId;

            var undoActions = undoParent.getElementsByTagName("HistoryAction");
            if (undoActions.length > 0) {
                console.log("Loading " + undoActions.length + " back history items.");
                for (var i = 0; i < undoActions.length; i++) {
                    var actionType = undoActions[i].getAttribute("type");
                    switch (actionType) {
                        case Ensemble.Events.Action.ActionType.createTrack:
                            Ensemble.HistoryMGR._backStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.createTrack, { trackId: undoActions[i].getAttribute("trackId") }));
                            break;
                        case Ensemble.Events.Action.ActionType.renameTrack:
                            Ensemble.HistoryMGR._backStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.renameTrack,
                                {
                                    trackId:parseInt( undoActions[i].getAttribute("trackId"), 10),
                                    oldName: undoActions[i].getAttribute("oldName"),
                                    newName: undoActions[i].getAttribute("newName")
                                }
                            ));
                            break;
                        case Ensemble.Events.Action.ActionType.trackVolumeChanged:
                            Ensemble.HistoryMGR._backStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.trackVolumeChanged,
                                {
                                    trackId: parseInt(undoActions[i].getAttribute("trackId"), 10),
                                    oldVolume: parseInt(undoActions[i].getAttribute("oldVolume"), 10),
                                    newVolume: parseInt(undoActions[i].getAttribute("newVolume"), 10)
                                }
                            ));
                            break;
                        case Ensemble.Events.Action.ActionType.moveTrack:
                            Ensemble.HistoryMGR._backStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.moveTrack,
                                {
                                    trackId: parseInt(undoActions[i].getAttribute("trackId"), 10),
                                    origin: parseInt(undoActions[i].getAttribute("origin"), 10),
                                    destination: parseInt(undoActions[i].getAttribute("destination"), 10)
                                }
                            ));
                            break;
                        case Ensemble.Events.Action.ActionType.removeTrack:
                            let trackParent = undoActions[i].getElementsByTagName("Track")[0];
                            let generatedTrack = Ensemble.FileIO._loadTrack(trackParent);
                            Ensemble.HistoryMGR._backStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.removeTrack,
                                {
                                    trackId: parseInt(undoActions[i].getAttribute("trackId"), 10),
                                    trackObj: generatedTrack,
                                    originalLocation: parseInt(undoActions[i].getAttribute("originalLocation"), 10)
                                }
                            ));
                            break;
                        default:
                            console.error("Unable to load History Action from disk - unknown type.");
                            break;
                    }
                }
            }

            var redoActions = redoParent.getElementsByTagName("HistoryAction");
            if (redoActions.length > 0) {
                console.log("Loading " + redoActions.length + " forward history items.");
                for (var i = 0; i < redoActions.length; i++) {
                    var actionType = redoActions[i].getAttribute("type");
                    switch (actionType) {
                        case Ensemble.Events.Action.ActionType.createTrack:
                            Ensemble.HistoryMGR._forwardStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.createTrack,
                                {
                                    trackId: redoActions[i].getAttribute("trackId")
                                }
                            ));
                            break;
                        case Ensemble.Events.Action.ActionType.renameTrack:
                            Ensemble.HistoryMGR._forwardStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.renameTrack,
                                {
                                    trackId: redoActions[i].getAttribute("trackId"),
                                    oldName: redoActions[i].getAttribute("oldName"),
                                    newName: redoActions[i].getAttribute("newName")
                                }
                            ));
                            break;
                        case Ensemble.Events.Action.ActionType.trackVolumeChanged:
                            Ensemble.HistoryMGR._forwardStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.trackVolumeChanged,
                                {
                                    trackId: redoActions[i].getAttribute("trackId"),
                                    oldVolume: redoActions[i].getAttribute("oldVolume"),
                                    newVolume: redoActions[i].getAttribute("newVolume")
                                }
                            ));
                            break;
                        case Ensemble.Events.Action.ActionType.moveTrack:
                            Ensemble.HistoryMGR._forwardStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.moveTrack,
                                {
                                    trackId: redoActions[i].getAttribute("trackId"),
                                    origin: redoActions[i].getAttribute("origin"),
                                    destination: redoActions[i].getAttribute("destination")
                                }
                            ));
                            break;
                        case Ensemble.Events.Action.ActionType.removeTrack:
                            let trackParent = redoActions[i].getElementsByTagName("Track")[0];
                            let generatedTrack = Ensemble.FileIO._loadTrack(trackParent);
                            Ensemble.HistoryMGR._forwardStack.push(new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.removeTrack,
                                {
                                    trackId: parseInt(redoActions[i].getAttribute("trackId"), 10),
                                    trackObj: generatedTrack,
                                    originalLocation: parseInt(redoActions[i].getAttribute("originalLocation"), 10)
                                }
                            ));
                            break;
                        default:
                            console.error("Unable to load History Action from disk - unknown type.");
                            break;
                    }
                }
            }

            if (tracks.length > 0) {
                //Create empty tracks
                for (let i = 0; i < tracks.length; i++) {
                    let loadedTrack = Ensemble.FileIO._loadTrack(tracks[i]);

                    // todo: load clips

                    Ensemble.Editor.TimelineMGR.addTrackAtIndex(loadedTrack, i);
                    //Ensemble.Editor.TimelineMGR.createTrack(null, parseInt(tracks[i].getAttribute("trackId")), tracks[i].getAttribute("trackName"), parseFloat(tracks[i].getAttribute("trackVolume")));
                }

                //For now, navigate to the Editor after generating the tracks.
                Ensemble.Pages.MainMenu.navigateToEditor();
            }
            else {
                //Fire callback. Project is empty (no tracks or media).
                //Ensemble.FileIO._loadedProjectCallback();
                Ensemble.Pages.MainMenu.navigateToEditor();
            }
        },

        _loadTrack: function (xmlTrack) {
            /// <summary>Generates a Track object from the given XML track root.</summary>
            /// <param name="xmlTrack" type="XMLDoc">The root of the Track in the XML file.</param>
            /// <returns type="Ensemble.Editor.Track">A finished track object.</returns>
            let createdTrack = new Ensemble.Editor.Track(parseInt(xmlTrack.getAttribute("trackId")), xmlTrack.getAttribute("trackName"), parseFloat(xmlTrack.getAttribute("trackVolume")));

            // todo: create media clip objects

            return createdTrack;
        },

        loadClip: function (ensembleFile, payload, complete, progress, error) {
            /// <summary>Loads the media represented by the given EnsembleFile and passes the resulting Ensemble.Editor.Clip object and payload to the given callback.</summary>
            /// <param name="ensembleFile" type="Ensemble.EnsembleFile">The EnsembleFile to load.</param>
            /// <param name="payload" type="Object">A set of arbitrary data that will be passed to the specified callback upon loading completion.</param>
            /// <param name="complete" type="Function">The callback to execute after loading is complete.</param>
            /// <param name="progress" type="Function">The callback to execute on loading progress.</param>
            /// <param name="error" type="Function">The callback to execute if an error is encountered while loading the clip.</param>
            
            (function () {
                var file = ensembleFile;
                var data = payload;
                var callback = complete;

                var fileURI = null;
                switch (Ensemble.Platform.currentPlatform) {
                    case "win8":
                        console.log("Loaded ensembleFile.");
                        fileURI = URL.createObjectURL(file._src);
                        break;
                    case "android":
                        break;
                    case "ios":
                        break;
                }

                var srcElement = null;
                switch (file.eo1type) {
                    case "video":
                        srcElement = document.createElement("video");
                        //srcElement.oncanplaythrough = function () { console.log("Video clip finished loading!"); };
                        srcElement.oncanplaythrough = Ensemble.FileIO._clipFinishedLoading;
                        break;
                    case "audio":
                        srcElement = document.createElement("audio");
                        //srcElement.oncanplaythrough = function () { console.log("Audio clip finished loading!"); };
                        srcElement.oncanplaythrough = Ensemble.FileIO._clipFinishedLoading;
                        break;
                    case "picture":
                        srcElement = document.createElement("img");
                        //srcElement.onload = function () { console.log("Image loaded!"); };
                        srcElement.onload = Ensemble.FileIO._clipFinishedLoading;
                        break;
                }
                Ensemble.FileIO._clipLoadBuffer[file._uniqueId] = {
                    file: file,
                    payload: payload,
                    complete: complete,
                    progress: progress,
                    error: error
                };
                srcElement.setAttribute("data-eo1-uniqueid", file._uniqueId);
                srcElement.src = fileURI;
            })();
        },

        _clipFinishedLoading: function (event) {
            var clipUniqueId = event.currentTarget.getAttribute("data-eo1-uniqueid");
            var bufferItem = Ensemble.FileIO._clipLoadBuffer[clipUniqueId];

            var ensembleFile = bufferItem.file;
            var payload = bufferItem.payload;
            var callback = bufferItem.complete;
            var srcPlayer = event.currentTarget;

            delete Ensemble.FileIO._clipLoadBuffer[clipUniqueId];

            callback({
                file: ensembleFile,
                payload: payload,
                player: srcPlayer
            });
        },

        _clipLoadError: function (event) {
            var clipUniqueId = event.currentTarget.getAttribute("data-eo1-uniqueid");
            var bufferItem = Ensemble.FileIO._clipLoadBuffer[clipUniqueId];

            var ensembleFile = bufferItem.file;
            var payload = bufferItem.payload;
            var callback = bufferItem.error;

            delete Ensemble.FileIO._clipLoadBuffer[clipUniqueId];

            console.error("Error loading clip: " + ensembleFile.displayName);
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
                                    (function () { 
                                        var loadedFilename = projectFiles[i].name;
                                        Windows.Storage.FileIO.readTextAsync(projectFiles[i]).then(function (contents) {
                                            var parser = new DOMParser();
                                            var xmlDoc = parser.parseFromString(contents, "text/xml");

                                            var ensembleProject = xmlDoc.firstChild;

                                            var loadedProjectName = xmlDoc.getElementsByTagName("ProjectName")[0].childNodes[0].nodeValue;
                                            console.log("Found project \"" + loadedProjectName + "\" in the Projects directory!");
                                            try {
                                                var loadedDateModified = new Date(parseInt(xmlDoc.getElementsByTagName("DateModified")[0].childNodes[0].nodeValue, 10));
                                                //loadedDateModified = loadedDateModified.customFormat("#MMM# #DD#, #YYYY# #h#:#mm##ampm#");
                                            }
                                            catch (exception) {
                                                var loadedDateModified = "Unknown";
                                            }
                                            var loadedAspectRatio = xmlDoc.getElementsByTagName("AspectRatio")[0].childNodes[0].nodeValue;
                                            var loadedNumberOfClips = xmlDoc.getElementsByTagName("MediaClip").length;
                                            //var loadedFilename = xmlDoc.getElementsByTagName("ProjectFilename")[0].childNodes[0].nodeValue;
                                            var loadedProjectLength = xmlDoc.getElementsByTagName("ProjectLength")[0].childNodes[0].nodeValue;
                                            var loadedThumbnailPath = "ms-appdata:///local/Projects/" + loadedFilename + ".jpg";

                                            dataArray.push(new Ensemble.Editor.ProjectFile(loadedProjectName, loadedFilename, loadedDateModified, loadedNumberOfClips, loadedAspectRatio, loadedProjectLength, loadedThumbnailPath));

                                            if (dataArray.length == projectFiles.length) {
                                                callback(dataArray);
                                            }
                                        });
                                    })();
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
                                    try {
                                        callback(index, 'url(' + URL.createObjectURL(success) + ')', ensembleFile._uniqueId);
                                    }
                                    catch (exception) {
                                        //Item does not have a thumbnail.
                                        callback(index, '', ensembleFile._uniqueId);
                                    }
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

        retrieveMediaPreview: function (ensembleFile, callback) {
            /// <summary>Loads a preview for the given Ensemble file.</summary>
            /// <param name="ensembleFile" type="Ensemble.EnsembleFile">The file for which to load a preview.</param>
            /// <param name="callback" type="Function">The callback to execute after the preview loaded. The callback will be passed both the Ensemble file and a URI referencing its media.</param>
            var returnVal = "";
            switch (Ensemble.Platform.currentPlatform) {
                case "win8":
                    returnVal = URL.createObjectURL(ensembleFile._src);
                    break;
                case "ios":
                    break;
                case "android":
                    break;
            }
            callback(ensembleFile, returnVal);
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