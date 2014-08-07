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
                            Windows.Storage.FileIO.writeTextAsync(projectFile, xml.toString()).then(function () {
                                Windows.Storage.StorageFile.getFileFromApplicationUriAsync(new Windows.Foundation.Uri("ms-appx:///img/projectThumbnails/" + aspect.replace(":", "") + ".jpg")).then(function (defaultThumb) {
                                    defaultThumb.copyAsync(projectDir, projectFile.name + ".jpg").done(function () {
                                        //Finished creating project files. Now update session state.
                                        Ensemble.Session.currentProjectName = name;
                                        Ensemble.Session.currentProjectAspect = aspect;
                                        Ensemble.Session.currentProjectFileName = projectFile.name;
                                        Ensemble.Session.horizontalDividerPosition = 0.5;
                                        Ensemble.Session.verticalDividerPosition = 0.5;

                                        Ensemble.Session.projectLoading = false;
                                        console.log("Project finished creating.");
                                    });
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

        loadProject: function (filename, cloud) {
            /// <summary>Loads a previously saved project from storage.</summary>
            /// <param name="filename" type="String">The name of the project to be loaded.</param>
            /// <param name="cloud" type="Boolean">(Optional) Indicates whether or not the project is to be loaded from the cloud.</param>
        },

        pickMediaFile: function (multi) {
            /// <summary>Shows a file picker appropriate to the current platform so the user can select a file.</summary>
            /// <param name="multi" type="Boolean">(Optionl) Show a multi-select file picker instead of the default one.</param>
            /// <returns type="File">The selected file. Returns null if no file was selected.</returns>
        },

        saveProject: function () {
            /// <summary>Saves the currently loaded project to disk.</summary>
        }
    });
})();