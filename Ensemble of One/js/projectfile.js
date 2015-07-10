(function () {
    var ProjectFile = WinJS.Class.define(
    function (projectName, projectFilename, dateModified, numOfClips, aspect, dur, thumbnailPath, extra) {
            /// <summary>Responsible for tracking and managing time-based events as they occur during playback.</summary>
            /// <param name="projectName" type="String">The name of the project.</param>
            /// <param name="projectFilename" type="String">The filename of the project.</param>
            /// <param name="dateModified" type="Date">Date the project was last modified.</param>
            /// <param name="numOfClips" type="Number">The number of clips in the project.</param>
            /// <param name="aspect" type="String">The aspect ratio of the project.</param>
            /// <param name="dur" type="Number">The duration of the project.</param>
            /// <param name="thumbnailPath" type="String">A path to the project's thumbnail.</param>
            /// <param name="extra" type="Number">Optional. May contain arbitrary data.</param>
            //Constructor
            this.name = projectName;
            this.filename = projectFilename;
            this.modified = dateModified;
            this.numberOfClips = numOfClips;
            this.aspectRatio = aspect;
            this.duration = dur;
            this.thumbnail = thumbnailPath;
            this.extra = extra;
        },
        {
            //Instance members
            //The name of the project.
            name: null,
            //The filename of the project.
            filename: null,
            //Date the project was last modified.
            modified: null,
            //Number of clips in the project.
            numberOfClips: null,
            //Aspect ratio of the project.
            aspectRatio: null,
            //Duration of the project, in milliseconds.
            duration: null,
            //Source path of the project's thumbnail.
            thumbnail: null,
            //Optional extra value.
            extra: null
        },
        {
            //Static members
        }
    );

    WinJS.Namespace.define("Ensemble.Editor", {
        ProjectFile: ProjectFile
    });
})();