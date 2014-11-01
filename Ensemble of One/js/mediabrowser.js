﻿(function () {
    WinJS.Namespace.define("Ensemble.MediaBrowser", {
        /// <summary>A central location for tracking information related to the in-app file browser.</summary>
        _breadCrumbsVideo: [],
        _breadCrumbsMusic: [],
        _breadCrumbsPicture: [],
        _mediaItems: [],
        _context: "video",
        _dragging: false,
        _dragCheck: false,
        _dragEnsembleFile: null,

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
            Ensemble.Pages.Editor.UI.PageSections.menu.mediaMenu.local.loadingIndicator.style.display = "inline";
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

        updateFileThumbnail: function (index, thumb) {
            /// <summary>Updates the media file at the given index in the Media Browser with the new thumbnail.</summary>
            /// <param name="index" type="Number">The index of the media item in the Media Browser.</param>
            /// <param name="thumb" type="URI">The image to set as the thumbnail.</param>

            var element = Ensemble.Pages.Editor.UI.PageSections.menu.mediaMenu.local.mediaList.childNodes[index];
            var elementIcon = element.getElementsByClassName("mediaBrowserListItemIcon")[0];
            elementIcon.style.backgroundImage = thumb;
            $(elementIcon).addClass("mediaBrowserIconFilled");
        },

        _metaDataCallback: function (index, meta, id) {
            if (Ensemble.MediaBrowser._mediaItems[index] && Ensemble.MediaBrowser._mediaItems[index]._uniqueId == id) {
                if (Ensemble.MediaBrowser._mediaItems.length > index + 1) {
                    Ensemble.FileIO.retrieveMediaProperties(Ensemble.MediaBrowser._mediaItems[index + 1], index + 1, Ensemble.MediaBrowser._metaDataCallback);
                }
                else {
                    console.log("Done loading metadata.");
                }
                if (meta != null) {
                    Ensemble.MediaBrowser.updateMediaFileMeta(index, meta);
                }
            }
            else console.warn("Canceled metadata lookup.");
        },

        _thumbnailCallback: function (index, thumb, id) {
            if (Ensemble.MediaBrowser._mediaItems[index] && Ensemble.MediaBrowser._mediaItems[index]._uniqueId == id) {
                if (Ensemble.MediaBrowser._mediaItems.length > index + 1) {
                    Ensemble.FileIO.retrieveThumbnail(Ensemble.MediaBrowser._mediaItems[index + 1], index + 1, Ensemble.MediaBrowser._thumbnailCallback);
                }
                else {
                    console.log("Done loading thumbnails.");
                    Ensemble.Pages.Editor.UI.PageSections.menu.mediaMenu.local.loadingIndicator.style.display = "none";
                }
                if (thumb != null) {
                    Ensemble.MediaBrowser.updateFileThumbnail(index, thumb);
                }
            }
            else console.warn("Canceled thumbnail lookup.");
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
                mediaString = mediaString + '<div class="mediaBrowserListItem" id="' + "mediaBrowserListItemIndex" + (i + folders.length).toString() + '"><div class="mediaBrowserListItemIcon">' + files[i].icon + '</div><div class="mediaBrowserListItemMeta"><div class="mediaBrowserListItemRow mediaBrowserListItemTitle">' + (files[i].title || files[i].displayName) + '</div><div class="mediaBrowserListItemRow"><div class="mediaBrowserListItemRowComponent">' + files[i].displayType + '</div><div class="mediaBrowserListItemRowComponent mediaBrowserListItemDuration"></div><div class="mediaBrowserListItemRowComponent mediaBrowserListItemQuality"></div></div></div></div>';
                Ensemble.MediaBrowser._mediaItems.push(files[i]);
            }
            Ensemble.Pages.Editor.UI.PageSections.menu.mediaMenu.local.mediaList.innerHTML = mediaString;
            //Ensemble.Pages.Editor.UI.PageSections.menu.mediaMenu.local.mediaList.addEventListener("click", Ensemble.MediaBrowser._listItemClicked, false);
            Ensemble.Pages.Editor.UI.PageSections.menu.mediaMenu.local.mediaList.addEventListener("mousedown", Ensemble.MediaBrowser._listItemMouseDown, false);
            Ensemble.FileIO.retrieveMediaProperties(Ensemble.MediaBrowser._mediaItems[0], 0, Ensemble.MediaBrowser._metaDataCallback);
            Ensemble.FileIO.retrieveThumbnail(Ensemble.MediaBrowser._mediaItems[0], 0, Ensemble.MediaBrowser._thumbnailCallback);

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

        showMediaPreview: function (ensembleFile, fileUri) {
            /// <summary>Shows the preview dialog for the given Ensemble file and URI reference.</summary>
            /// <param name="ensembleFile" type="Ensemble.EnsembleFile">The file for which to load a preview.</param>
            /// <param name="fileUri" type="String">The URI to the Ensemble file's source.</param>
            $(Ensemble.Pages.Editor.UI.UserInput.ClickEaters.mediaPreview).removeClass("editorClickEaterFaded");

            Ensemble.Pages.Editor.UI.Graphics.mediaBrowserPreviewVideo.style.display = "none";
            Ensemble.Pages.Editor.UI.Graphics.mediaBrowserPreviewMusic.style.display = "none";
            Ensemble.Pages.Editor.UI.Graphics.mediaBrowserPreviewPic.style.display = "none";

            switch (ensembleFile.eo1type) {
                case "video":
                    Ensemble.Pages.Editor.UI.Graphics.mediaBrowserPreviewVideo.style.display = "block";
                    var vidTag = Ensemble.Pages.Editor.UI.Graphics.mediaBrowserPreviewVideo.getElementsByTagName("video")[0];
                    vidTag.addEventListener("play", Ensemble.MediaBrowser._openMediaPreviewPopup, false);
                    vidTag.src = fileUri;
                    break;
                case "audio":
                    Ensemble.Pages.Editor.UI.Graphics.mediaBrowserPreviewMusic.style.display = "block";
                    var audioTag = Ensemble.Pages.Editor.UI.Graphics.mediaBrowserPreviewMusic.getElementsByTagName("audio")[0];
                    audioTag.addEventListener("play", Ensemble.MediaBrowser._openMediaPreviewPopup, false);
                    audioTag.src = fileUri;
                    break;
                case "picture":
                    Ensemble.Pages.Editor.UI.Graphics.mediaBrowserPreviewPic.style.display = "block";
                    var picTag = Ensemble.Pages.Editor.UI.Graphics.mediaBrowserPreviewPic.getElementsByTagName("img")[0];
                    picTag.addEventListener("load", Ensemble.MediaBrowser._openMediaPreviewPopup, false);
                    picTag.src = fileUri;
                    break;
            }

            Ensemble.Pages.Editor.UI.UserInput.ClickEaters.mediaPreview.addEventListener("click", Ensemble.MediaBrowser.closeMediaPreview, false);
        },

        closeMediaPreview: function () {
            /// <summary>Stops any playback occuring in the media preview dialog and hides the dialog.</summary>
            Ensemble.Pages.Editor.UI.UserInput.ClickEaters.mediaPreview.removeEventListener("click", Ensemble.MediaBrowser.closeMediaPreview);
            $(Ensemble.Pages.Editor.UI.UserInput.ClickEaters.mediaPreview).addClass("editorClickEaterFaded");
            $(Ensemble.Pages.Editor.UI.Popups.mediaBrowserPreviewDialog).removeClass("mainMenuZoomDialogVisible");
            $(Ensemble.Pages.Editor.UI.Popups.mediaBrowserPreviewDialog).addClass("mainMenuZoomDialogHidden");

            var vidTag = Ensemble.Pages.Editor.UI.Graphics.mediaBrowserPreviewVideo.getElementsByTagName("video")[0];
            var audioTag = Ensemble.Pages.Editor.UI.Graphics.mediaBrowserPreviewMusic.getElementsByTagName("audio")[0];
            var picTag = Ensemble.Pages.Editor.UI.Graphics.mediaBrowserPreviewPic.getElementsByTagName("img")[0];

            vidTag.removeEventListener("play", Ensemble.MediaBrowser._openMediaPreviewPopup);
            audioTag.removeEventListener("play", Ensemble.MediaBrowser._openMediaPreviewPopup);
            picTag.removeEventListener("load", Ensemble.MediaBrowser._openMediaPreviewPopup);

            vidTag.pause();
            audioTag.pause();
            //Ensemble.Pages.Editor.UI.Graphics.mediaBrowserPreviewVideo.src = "";
        },

        //Private functions

        _openMediaPreviewPopup: function () {
            $(Ensemble.Pages.Editor.UI.Popups.mediaBrowserPreviewDialog).removeClass("mainMenuZoomDialogHidden");
            $(Ensemble.Pages.Editor.UI.Popups.mediaBrowserPreviewDialog).addClass("mainMenuZoomDialogVisible");

            var vidTag = Ensemble.Pages.Editor.UI.Graphics.mediaBrowserPreviewVideo.getElementsByTagName("video")[0];
            var audioTag = Ensemble.Pages.Editor.UI.Graphics.mediaBrowserPreviewMusic.getElementsByTagName("audio")[0];
            var picTag = Ensemble.Pages.Editor.UI.Graphics.mediaBrowserPreviewPic.getElementsByTagName("img")[0];

            vidTag.removeEventListener("play", Ensemble.MediaBrowser._openMediaPreviewPopup);
            audioTag.removeEventListener("play", Ensemble.MediaBrowser._openMediaPreviewPopup);
            picTag.removeEventListener("load", Ensemble.MediaBrowser._openMediaPreviewPopup);
        },

        _listItemMouseDown: function (event) {
            console.log("Media browser mousedown.");
            var closestListItem = $(event.srcElement).closest(".mediaBrowserListItem");
            if (closestListItem[0]) {
                var itemIndex = parseInt(closestListItem[0].id.replace("mediaBrowserListItemIndex", ""));
                if (!isNaN(itemIndex)) {
                    
                    Ensemble.MediaBrowser._dragEnsembleFile = Ensemble.MediaBrowser._mediaItems[itemIndex];
                    if (Ensemble.MediaBrowser._dragEnsembleFile.eo1type != "folder") {
                        Ensemble.MediaBrowser._dragCheck = true;
                        Ensemble.Utilities.MouseTracker.startTracking(event.clientX, event.clientY);
                        window.setTimeout(function (timeoutEvent) {
                            if (Ensemble.MediaBrowser._dragCheck) {
                                //Still dragging - start drag operation.
                                Ensemble.MediaBrowser._listItemBeginDrag();
                            }
                        }, 500);
                        
                    }
                    document.addEventListener("mouseup", Ensemble.MediaBrowser._listItemMouseUp, false);
                }
            }
        },

        _listItemMouseUp: function (event) {
            console.log("Media browser check mouseup.");
            if (!Ensemble.MediaBrowser._dragging) {
                Ensemble.MediaBrowser._dragCheck = false;

                var closestListItem = $(event.srcElement).closest(".mediaBrowserListItem");
                if (closestListItem[0]) {
                    var itemIndex = parseInt(closestListItem[0].id.replace("mediaBrowserListItemIndex", ""));
                    if (!isNaN(itemIndex)) {
                        if (Ensemble.MediaBrowser._mediaItems[itemIndex] === Ensemble.MediaBrowser._dragEnsembleFile) {
                            if (Ensemble.MediaBrowser._mediaItems[itemIndex].eo1type == "folder") {
                                document.removeEventListener("mouseup", Ensemble.MediaBrowser._listItemMouseUp);
                                Ensemble.MediaBrowser.navigateToFolder(Ensemble.MediaBrowser._mediaItems[itemIndex]);
                            }
                            else {
                                console.info("Showing media item preview...");
                                document.removeEventListener("mouseup", Ensemble.MediaBrowser._listItemMouseUp);
                                Ensemble.FileIO.retrieveMediaPreview(Ensemble.MediaBrowser._mediaItems[itemIndex], Ensemble.MediaBrowser.showMediaPreview);
                            }
                        }
                    }
                }
            }
        },

        _listItemBeginDrag: function () {
            console.log("Media browser beginning drag.");
            Ensemble.Pages.Editor.UI.PageSections.menu.mediaMenu.local.mediaList.style.overflowY = "hidden";
            document.removeEventListener("mouseup", Ensemble.MediaBrowser._listItemMouseUp);
            Ensemble.MediaBrowser._dragging = true;
            Ensemble.MediaBrowser._dragCheck = false;
            Ensemble.Pages.Editor.UI.Popups.mediaBrowserPreviewDrag.style.transform = "translate(" + Ensemble.Utilities.MouseTracker.x + "px," + Ensemble.Utilities.MouseTracker.y + "px)";
            $(Ensemble.Pages.Editor.UI.Popups.mediaBrowserPreviewDrag).removeClass("editorDraggedPreviewHidden");
            $(Ensemble.Pages.Editor.UI.Popups.mediaBrowserPreviewDrag).addClass("editorDraggedPreviewVisible");
            window.requestAnimationFrame(Ensemble.MediaBrowser._listItemDragUpdate);
            document.addEventListener("mouseup", Ensemble.MediaBrowser._listItemEndDrag, false);
            },

        _listItemDragUpdate: function (event) {
            // Update the item's position.
            Ensemble.Pages.Editor.UI.Popups.mediaBrowserPreviewDrag.style.transform = "translate(" + Ensemble.Utilities.MouseTracker.x + "px," + Ensemble.Utilities.MouseTracker.y + "px)";
            if (Ensemble.MediaBrowser._dragging) window.requestAnimationFrame(Ensemble.MediaBrowser._listItemDragUpdate);
        },

        _listItemEndDrag: function (event) {
            console.log("Media browser ending drag.");
            Ensemble.MediaBrowser._dragging = false;
            Ensemble.Pages.Editor.UI.PageSections.menu.mediaMenu.local.mediaList.style.overflowY = "";
            document.removeEventListener("mouseup", Ensemble.MediaBrowser._listItemEndDrag);
            $(Ensemble.Pages.Editor.UI.Popups.mediaBrowserPreviewDrag).removeClass("editorDraggedPreviewVisible");
            $(Ensemble.Pages.Editor.UI.Popups.mediaBrowserPreviewDrag).addClass("editorDraggedPreviewHidden");
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