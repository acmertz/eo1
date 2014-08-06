var FileIO = {
    loadProject: function (filename, cloud) {
        /// <summary>Loads a previously saved project from storage.</summary>
        /// <param name="filename" type="String">The name of the project to be loaded.</param>
        /// <param name="cloud" type="Boolean">(Optional) Indicates whether or not the project is to be loaded from the cloud.</param>
    },

    saveProject: function () {
        /// <summary>Saves the currently loaded project to disk.</summary>
    },

    pickMediaFile: function (multi) {
        /// <summary>Shows a file picker appropriate to the current platform so the user can select a file.</summary>
        /// <param name="multi" type="Boolean">(Optionl) Show a multi-select file picker instead of the default one.</param>
        /// <returns type="File">The selected file. Returns null if no file was selected.</returns>
    }
}

FileIO.pickMediaFile()