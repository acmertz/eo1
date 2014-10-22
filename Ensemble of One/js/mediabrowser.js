(function () {
    WinJS.Namespace.define("Ensemble.MediaBrowser", {
        /// <summary>A central location for tracking information related to the in-app file browser.</summary>
        _breadCrumbsVideo: [],
        _breadCrumbsMusic: [],
        _breadCrumbsPicture: [],
        _mediaItems: [],
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
            Ensemble.MediaBrowser._disableMediaFolderListeners();
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
                Ensemble.MediaBrowser._mediaItems[index][prop] = meta[prop];
            }

            var element = Ensemble.Pages.Editor.UI.PageSections.menu.mediaMenu.local.mediaList.childNodes[index];
            switch (Ensemble.MediaBrowser._mediaItems[index].eo1type) {
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
            Ensemble.MediaBrowser._mediaItems = [];
            var mediaString = "";
            for (var i = 0; i < folders.length; i++) {
                mediaString = mediaString + '<div class="mediaBrowserListItem" id="' + "mediaBrowserListItemIndex" + i.toString() + '"><div class="mediaBrowserListItemIcon">' + folders[i].icon + '</div><div class="mediaBrowserListItemMeta"><div class="mediaBrowserListItemRow mediaBrowserListItemTitle">' + (folders[i].title || folders[i].displayName) + '</div><div class="mediaBrowserListItemRow"><div class="mediaBrowserListItemRowComponent">' + folders[i].displayType + '</div><div class="mediaBrowserListItemRowComponent"></div><div class="mediaBrowserListItemRowComponent"></div></div></div></div>';
                Ensemble.MediaBrowser._mediaItems.push(folders[i]);
            }
            for (var i = 0; i < files.length; i++) {
                mediaString = mediaString + '<div class="mediaBrowserListItem" id="' + "mediaBrowserListItemIndex" + i.toString() + '"><div class="mediaBrowserListItemIcon">' + files[i].icon + '</div><div class="mediaBrowserListItemMeta"><div class="mediaBrowserListItemRow mediaBrowserListItemTitle">' + (files[i].title || files[i].displayName) + '</div><div class="mediaBrowserListItemRow"><div class="mediaBrowserListItemRowComponent">' + files[i].displayType + '</div><div class="mediaBrowserListItemRowComponent mediaBrowserListItemDuration"></div><div class="mediaBrowserListItemRowComponent mediaBrowserListItemQuality"></div></div></div></div>';
                Ensemble.MediaBrowser._mediaItems.push(files[i]);
            }
            Ensemble.Pages.Editor.UI.PageSections.menu.mediaMenu.local.mediaList.innerHTML = mediaString;
            Ensemble.Pages.Editor.UI.PageSections.menu.mediaMenu.local.mediaList.addEventListener("click", Ensemble.MediaBrowser._listItemClicked, false);

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

        pickMediaFile: function (multi) {
            /// <summary>Shows a file picker appropriate to the current platform so the user can select a file.</summary>
            /// <param name="multi" type="Boolean">(Optionl) Show a multi-select file picker instead of the default one.</param>
            /// <returns type="File">The selected file. Returns null if no file was selected.</returns>
        },

        //Private functions
        _listItemClicked: function (event) {
            var closestListItem = $(event.srcElement).closest(".mediaBrowserListItem");
            if (closestListItem[0]) {
                var itemIndex = parseInt(closestListItem[0].id.replace("mediaBrowserListItemIndex", ""));
                if (!isNaN(itemIndex)) {
                    if (Ensemble.MediaBrowser._mediaItems[itemIndex].eo1type == "folder") {
                        Ensemble.MediaBrowser.navigateToFolder(Ensemble.MediaBrowser._mediaItems[itemIndex]);
                    }
                }
            }
        },

        _disableMediaFolderListeners: function () {
            Ensemble.Pages.Editor.UI.PageSections.menu.mediaMenu.local.mediaList.removeEventListener("click", Ensemble.MediaBrowser._listItemClicked);
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