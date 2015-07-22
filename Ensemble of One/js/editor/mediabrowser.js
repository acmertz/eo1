(function () {
    WinJS.Namespace.define("Ensemble.Editor.MediaBrowser", {
        /// <summary>A central location for tracking information related to the in-app file browser.</summary>
        _breadCrumbsVideo: [],
        _breadCrumbsMusic: [],
        _breadCrumbsPicture: [],
        _mediaItems: [],
        _context: "video",
        _dragging: false,
        _dragCheck: false,
        _dragEnsembleFile: null,
        _currentPreview: null,

        _dragOffset: {
            left: 0,
            top: 0
        },
        _dragTimeline: false,

        _dragDestination: {
            time: 0,
            track: 0
        },

        init: function () {
            this._refreshUI();
        },

        unload: function () {
            this._cleanUI();
        },

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

        refresh: function () {
            /// <summary>Refreshes the Media Browser at its current location.</summary>
            Ensemble.Editor.MediaBrowser.navigateToFolder(Ensemble.Editor.MediaBrowser.currentLocation());
        },

        upOneLevel: function () {
            /// <summary>Navigates the media browser up one level in the current context, if possible.</summary>
            switch (this._context) {
                case "video":
                    if (this._breadCrumbsVideo.length > 1) {
                        this._breadCrumbsVideo.pop();
                        Ensemble.Editor.MediaBrowser.navigateToFolder(this._breadCrumbsVideo[this._breadCrumbsVideo.length - 1]);
                    }
                    else console.log("Unable to go up one level - already at the top level.");
                    break;
                case "music":
                    if (this._breadCrumbsMusic.length > 1) {
                        this._breadCrumbsMusic.pop();
                        Ensemble.Editor.MediaBrowser.navigateToFolder(this._breadCrumbsMusic[this._breadCrumbsMusic.length - 1]);
                    }
                    else console.log("Unable to go up one level - already at the top level.");
                    break;
                case "picture":
                    if (this._breadCrumbsPicture.length > 1) {
                        this._breadCrumbsPicture.pop();
                        Ensemble.Editor.MediaBrowser.navigateToFolder(this._breadCrumbsPicture[this._breadCrumbsPicture.length - 1]);
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
            Ensemble.Editor.MediaBrowser.navigateToFolder(Ensemble.Editor.MediaBrowser.currentLocation());
        },

        navigateToFolder: function (destination) {
            /// <summary>Navigates to the given folder in the current context.</summary>
            /// <param name="destination" type="Ensemble.EnsembleFolder">The folder to which to navigate.</param>
            Ensemble.Editor.MediaBrowser._disableMediaFolderListeners();
            Ensemble.Editor.UI.PageSections.menu.mediaMenu.local.loadingIndicator.style.display = "inline";
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
            Ensemble.FileIO.pickItemsFromFolder(destination, Ensemble.Editor.MediaBrowser._populateMediaBrowserDisplay);
        },

        updateMediaFileMeta: function (index, meta) {
            /// <summary>Updates the media file at the given index in the Media Browser with the new metadata.</summary>
            /// <param name="index" type="Number">The index of the media item in the Media Browser.</param>
            /// <param name="meta" type="Object">An object containing the EnsembleFile instance variables to update.</param>

            for (prop in meta) {
                Ensemble.Editor.MediaBrowser._mediaItems[index][prop] = meta[prop];
            }

            var element = Ensemble.Editor.UI.PageSections.menu.mediaMenu.local.mediaList.childNodes[index];
            switch (Ensemble.Editor.MediaBrowser._mediaItems[index].eo1type) {
                case "video":
                    element.getElementsByClassName("media-browser__list-itemQuality")[0].innerText = Ensemble.Utilities.FriendlyResolutionGenerator.turnFriendly(meta["width"], meta["height"]);
                    element.getElementsByClassName("media-browser__list-itemDuration")[0].innerText = Ensemble.Utilities.TimeConverter.convertTime(meta["duration"]);
                    break;
                case "audio":
                    element.getElementsByClassName("media-browser__list-itemQuality")[0].innerText = meta["albumArtist"];
                    element.getElementsByClassName("media-browser__list-itemDuration")[0].innerText = Ensemble.Utilities.TimeConverter.convertTime(meta["duration"]);
                    break;
                case "picture":
                    element.getElementsByClassName("media-browser__list-itemQuality")[0].innerText = meta["width"] + " x " + meta["height"];
                    break;
            }
            

        },

        updateFileThumbnail: function (index, thumb) {
            /// <summary>Updates the media file at the given index in the Media Browser with the new thumbnail.</summary>
            /// <param name="index" type="Number">The index of the media item in the Media Browser.</param>
            /// <param name="thumb" type="URI">The image to set as the thumbnail.</param>

            var element = Ensemble.Editor.UI.PageSections.menu.mediaMenu.local.mediaList.childNodes[index];
            var elementIcon = element.getElementsByClassName("media-browser__list-itemIcon")[0];
            elementIcon.style.backgroundImage = 'url(' + URL.createObjectURL(thumb, { oneTimeOnly: true }) + ')';
            Ensemble.Editor.MediaBrowser._mediaItems[index].thumb = thumb;
            $(elementIcon).addClass("mediaBrowserIconFilled");
        },

        _metaDataCallback: function (index, meta, id) {
            if (Ensemble.Editor.MediaBrowser._mediaItems[index] && Ensemble.Editor.MediaBrowser._mediaItems[index]._uniqueId == id) {
                if (Ensemble.Editor.MediaBrowser._mediaItems.length > index + 1) {
                    Ensemble.FileIO.retrieveMediaProperties(Ensemble.Editor.MediaBrowser._mediaItems[index + 1], index + 1, Ensemble.Editor.MediaBrowser._metaDataCallback);
                }
                else {
                    console.log("Done loading metadata.");
                }
                if (meta != null) {
                    Ensemble.Editor.MediaBrowser.updateMediaFileMeta(index, meta);
                }
            }
            else console.warn("Canceled metadata lookup.");
        },

        _thumbnailCallback: function (index, thumb, id) {
            if (Ensemble.Editor.MediaBrowser._mediaItems[index] && Ensemble.Editor.MediaBrowser._mediaItems[index]._uniqueId == id) {
                if (Ensemble.Editor.MediaBrowser._mediaItems.length > index + 1) {
                    Ensemble.FileIO.retrieveThumbnail(Ensemble.Editor.MediaBrowser._mediaItems[index + 1], index + 1, Ensemble.Editor.MediaBrowser._thumbnailCallback);
                }
                else {
                    console.log("Done loading thumbnails.");
                    Ensemble.Editor.UI.PageSections.menu.mediaMenu.local.loadingIndicator.style.display = "none";
                }
                if (thumb != null) {
                    Ensemble.Editor.MediaBrowser.updateFileThumbnail(index, thumb);
                }
            }
            else console.warn("Canceled thumbnail lookup.");
        },

        _populateMediaBrowserDisplay: function (files, folders) {
            /// <summary>Given a set of files and folders, fills the media browser display with representations of the data.</summary>
            /// <param name="files" type="Array">The files to display.</param>
            /// <param name="folders" type="Array">The folders to display.</param>
            Ensemble.Editor.MediaBrowser._mediaItems = [];
            var mediaString = "";
            for (var i = 0; i < folders.length; i++) {
                mediaString = mediaString + '<div class="media-browser__list-item" id="' + "media-browser__list-itemIndex" + i.toString() + '"><div class="media-browser__list-itemIcon">' + folders[i].icon + '</div><div class="media-browser__list-itemMeta"><div class="media-browser-item__row media-browser-item__title">' + (folders[i].title || folders[i].displayName) + '</div><div class="media-browser-item__row"><div class="media-browser-item__rowComponent">' + folders[i].displayType + '</div><div class="media-browser-item__rowComponent"></div><div class="media-browser-item__rowComponent"></div></div></div></div>';
                Ensemble.Editor.MediaBrowser._mediaItems.push(folders[i]);
            }
            for (var i = 0; i < files.length; i++) {
                mediaString = mediaString + '<div class="media-browser__list-item media-browser__list-item--file" id="' + "media-browser__list-itemIndex" + (i + folders.length).toString() + '"><div class="media-browser__list-itemIcon">' + files[i].icon + '</div><div class="media-browser__list-itemMeta"><div class="media-browser-item__row media-browser-item__title">' + (files[i].title || files[i].displayName) + '</div><div class="media-browser-item__row media-browser__list-itemDetails"><div class="media-browser-item__rowComponent">' + files[i].displayType + '</div><div class="media-browser-item__rowComponent media-browser__list-itemDuration"></div><div class="media-browser-item__rowComponent media-browser__list-itemQuality"></div></div><div class="media-browser-item__row media-browser__list-itemControls"><span class="media-browser-item__control" data-media-command="import">&#57609;</span><span class="media-browser-item__control" data-media-command="preview">&#57602;</span><span class="media-browser-item__control" data-media-command="properties">&#57676;</span></div></div></div>';
                Ensemble.Editor.MediaBrowser._mediaItems.push(files[i]);
            }
            Ensemble.Editor.UI.PageSections.menu.mediaMenu.local.mediaList.innerHTML = mediaString;
            Ensemble.Editor.UI.PageSections.menu.mediaMenu.local.mediaList.addEventListener("pointerdown", Ensemble.Editor.MediaBrowser._listItemMouseDown, false);
            Ensemble.FileIO.retrieveMediaProperties(Ensemble.Editor.MediaBrowser._mediaItems[0], 0, Ensemble.Editor.MediaBrowser._metaDataCallback);
            Ensemble.FileIO.retrieveThumbnail(Ensemble.Editor.MediaBrowser._mediaItems[0], 0, Ensemble.Editor.MediaBrowser._thumbnailCallback);

            //Rebuild the breadcrumb trail
            Ensemble.Editor.UI.PageSections.menu.mediaMenu.local.pathDisplay.innerHTML = "";
            var listToUse = null;
            switch (Ensemble.Editor.MediaBrowser._context) {
                case "video":
                    listToUse = Ensemble.Editor.MediaBrowser._breadCrumbsVideo;
                    break;
                case "music":
                    listToUse = Ensemble.Editor.MediaBrowser._breadCrumbsMusic;
                    break;
                case "picture":
                    listToUse = Ensemble.Editor.MediaBrowser._breadCrumbsPicture;
                    break;
            }

            Ensemble.Editor.UI.PageSections.menu.mediaMenu.local.pathDisplay.innerText = listToUse[listToUse.length - 1].displayName;
        },

        //Private methods

        _addPreviewToProject: function (event) {
            var allCommands = [];
            for (var i = 0; i < Ensemble.Editor.TimelineMGR.tracks.length; i++) {
                //Create a new menu item for each track.
                var menuItem = new WinJS.UI.MenuCommand();
                menuItem.label = (i + 1) + ".) " + Ensemble.Editor.TimelineMGR.tracks[i].name;
                menuItem.extraClass = "mediaBrowserImportMediaToTrack" + Ensemble.Editor.TimelineMGR.tracks[i].id;
                menuItem.onclick = Ensemble.Editor.MediaBrowser._addPreviewToTrack;
                allCommands.push(menuItem);
               
            }
            document.getElementById("flyout--editor-media-browser-add-to-project").winControl.commands = allCommands;
            setTimeout(function () { document.getElementById("flyout--editor-media-browser-add-to-project").winControl.show(event.currentTarget, "auto") }, 100);
        },

        _addPreviewToTrack: function (event) {
            var trackId = parseInt(event.currentTarget.className.match(/\d+$/));

            var newClip = new Ensemble.Editor.Clip(null);
            newClip.file = {
                path: Ensemble.Editor.MediaBrowser._currentPreview.path,
                token: Ensemble.Editor.MediaBrowser._currentPreview.token
            };
            newClip.preExisting = false;

            let clipImportAction = new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.importClip,
                {
                    clipId: newClip.id,
                    clipObj: newClip,
                    destinationTrack: trackId,
                    destinationTime: Ensemble.Editor.PlaybackMGR.lastTime
                }
            );
            Ensemble.HistoryMGR.performAction(clipImportAction, Ensemble.Editor.MediaBrowser._addPreviewToLayerLoadFinished);
        },

        _addPreviewToLayerLoadFinished: function (clipObj) {
            /// <param name="clipObj" type="Object">The loaded Clip, ready for playback and rendering.</param>
            console.log("Finished loading clip.");
        },

        _listItemMouseDown: function (event) {
            console.log("Media browser mousedown.");
            var closestListItem = $(event.srcElement).closest(".media-browser__list-item");
            if (closestListItem[0]) {
                var itemIndex = parseInt(closestListItem[0].id.replace("media-browser__list-itemIndex", ""));
                Ensemble.Editor.MediaBrowser._currentPreview = Ensemble.Editor.MediaBrowser._mediaItems[itemIndex];
                if ($(event.target).hasClass("media-browser-item__control")) {
                    console.log("Clicked a media browser control.");
                    if (event.target.dataset.mediaCommand == "import") {
                        var allCommands = [];
                        for (var i = 0; i < Ensemble.Editor.TimelineMGR.tracks.length; i++) {
                            //Create a new menu item for each track.
                            var menuItem = new WinJS.UI.MenuCommand();
                            menuItem.label = (i + 1) + ".) " + Ensemble.Editor.TimelineMGR.tracks[i].name;
                            menuItem.extraClass = "mediaBrowserImportMediaToTrack" + Ensemble.Editor.TimelineMGR.tracks[i].id;
                            menuItem.onclick = Ensemble.Editor.MediaBrowser._addPreviewToTrack;
                            allCommands.push(menuItem);
                        }
                        document.getElementById("flyout--editor-media-browser-add-to-project").winControl.commands = allCommands;
                        setTimeout(function () { document.getElementById("flyout--editor-media-browser-add-to-project").winControl.show(event.target, "auto"); }, 0);
                    }
                    else if (event.target.dataset.mediaCommand == "preview") {
                        Ensemble.FileIO.retrieveMediaPreview(Ensemble.Editor.MediaBrowser._mediaItems[itemIndex], Ensemble.Editor.MediaBrowser._listeners.retrievedMediaPreview, event);
                    }
                    else if (event.target.dataset.mediaCommand == "properties") {
                        document.getElementsByClassName("media-browser-property--display-name")[0].innerText = Ensemble.Editor.MediaBrowser._mediaItems[itemIndex].title || Ensemble.Editor.MediaBrowser._mediaItems[itemIndex].displayName;
                        document.getElementsByClassName("media-browser-property--unique-id")[0].innerText = Ensemble.Editor.MediaBrowser._mediaItems[itemIndex]._uniqueId;
                        document.getElementsByClassName("media-browser-property--bitrate")[0].innerText = Ensemble.Editor.MediaBrowser._mediaItems[itemIndex].bitrate;
                        document.getElementsByClassName("media-browser-property--duration")[0].innerText = Ensemble.Editor.MediaBrowser._mediaItems[itemIndex].duration;
                        document.getElementsByClassName("media-browser-property--width")[0].innerText = Ensemble.Editor.MediaBrowser._mediaItems[itemIndex].width;
                        document.getElementsByClassName("media-browser-property--height")[0].innerText = Ensemble.Editor.MediaBrowser._mediaItems[itemIndex].height;
                        document.getElementsByClassName("media-browser-property--mime")[0].innerText = Ensemble.Editor.MediaBrowser._mediaItems[itemIndex].mime;
                        document.getElementsByClassName("media-browser-property--path")[0].innerText = Ensemble.Editor.MediaBrowser._mediaItems[itemIndex].path;
                        setTimeout(function () { Ensemble.Editor.MediaBrowser.ui.propertiesFlyout.winControl.show(event.target, "auto"); }, 0);
                    }
                }
                else {
                    if (!isNaN(itemIndex)) {
                        Ensemble.Editor.MediaBrowser._dragEnsembleFile = Ensemble.Editor.MediaBrowser._mediaItems[itemIndex];
                        if (Ensemble.Editor.MediaBrowser._dragEnsembleFile.eo1type == "picture") Ensemble.Editor.MediaBrowser._dragEnsembleFile.duration = Ensemble.Settings.retrieveSetting("default-picture-duration");
                        if (Ensemble.Editor.MediaBrowser._dragEnsembleFile.eo1type != "folder") {
                            Ensemble.Editor.MediaBrowser._dragCheck = true;
                            Ensemble.Utilities.MouseTracker.startTracking(event.clientX, event.clientY);
                            window.setTimeout(function (timeoutEvent) {
                                if (Ensemble.Editor.MediaBrowser._dragCheck) {
                                    //Still dragging - start drag operation.
                                    Ensemble.Editor.MediaBrowser._listItemBeginDrag();
                                }
                            }, 100);

                        }
                        document.addEventListener("mouseup", Ensemble.Editor.MediaBrowser._listItemMouseUp, false);
                    }
                }
            }
        },

        _listItemMouseUp: function (event) {
            console.log("Media browser check mouseup.");
            if (!Ensemble.Editor.MediaBrowser._dragging) {
                Ensemble.Editor.MediaBrowser._dragCheck = false;

                var closestListItem = $(event.srcElement).closest(".media-browser__list-item");
                if (closestListItem[0]) {
                    var itemIndex = parseInt(closestListItem[0].id.replace("media-browser__list-itemIndex", ""));
                    if (!isNaN(itemIndex)) {
                        if (Ensemble.Editor.MediaBrowser._mediaItems[itemIndex] === Ensemble.Editor.MediaBrowser._dragEnsembleFile) {
                            if (Ensemble.Editor.MediaBrowser._mediaItems[itemIndex].eo1type == "folder") {
                                document.removeEventListener("mouseup", Ensemble.Editor.MediaBrowser._listItemMouseUp);
                                Ensemble.Editor.MediaBrowser.navigateToFolder(Ensemble.Editor.MediaBrowser._mediaItems[itemIndex]);
                            }
                        }
                    }
                }
            }
        },

        _listItemBeginDrag: function () {
            console.log("Media browser beginning drag.");
            Ensemble.Editor.MediaBrowser.ui.dragPreview.style.backgroundImage = 'url(' + URL.createObjectURL(Ensemble.Editor.MediaBrowser._dragEnsembleFile.thumb, { oneTimeOnly: true }) + ')';
            Ensemble.Editor.TimelineMGR.ui.dropPreview.innerText = Ensemble.Editor.MediaBrowser._dragEnsembleFile.title || Ensemble.Editor.MediaBrowser._dragEnsembleFile.displayName;

            Ensemble.Editor.UI.PageSections.menu.mediaMenu.local.mediaList.style.overflowY = "hidden";
            document.removeEventListener("mouseup", Ensemble.Editor.MediaBrowser._listItemMouseUp);
            Ensemble.Editor.MediaBrowser._dragging = true;
            Ensemble.Editor.MediaBrowser._dragCheck = false;

            Ensemble.Editor.MediaBrowser.ui.dragPreview.style.left = Ensemble.Utilities.MouseTracker.x + "px";
            Ensemble.Editor.MediaBrowser.ui.dragPreview.style.top = Ensemble.Utilities.MouseTracker.y + "px";

            $(Ensemble.Editor.MediaBrowser.ui.dragPreview).removeClass("media-browser__drag-preview--hidden").addClass("media-browser__drag-preview--visible");

            window.requestAnimationFrame(Ensemble.Editor.MediaBrowser._listItemDragUpdate);
            document.addEventListener("mouseup", Ensemble.Editor.MediaBrowser._listItemEndDrag, false);

            $(Ensemble.Editor.MenuMGR.ui.clickEater).click();
            Ensemble.Editor.Renderer.disableStandardInteraction();

            Ensemble.Editor.TimelineMGR.ui.scrollableContainer.addEventListener("pointerenter", Ensemble.Editor.MediaBrowser._listeners.draggedClipEnteredTimeline);
            Ensemble.Editor.TimelineMGR.ui.scrollableContainer.addEventListener("pointerleave", Ensemble.Editor.MediaBrowser._listeners.draggedClipLeftTimeline);
        },

        _listItemDragUpdate: function (event) {
            // Update the item's position.
            if (Ensemble.Editor.MediaBrowser._dragTimeline) {
                let zoomRatio = Ensemble.Editor.TimelineZoomMGR.zoomLevels[Ensemble.Editor.TimelineZoomMGR.currentLevel].ratio;
                let offsetX = Ensemble.Utilities.MouseTracker.x - Ensemble.Editor.MediaBrowser._dragOffset.left;
                let offsetY = Ensemble.Utilities.MouseTracker.y - Ensemble.Editor.MediaBrowser._dragOffset.top;
                
                let trackDragIndex = Math.floor(offsetY / Ensemble.Editor.TimelineMGR._currentTrackHeight) - Ensemble.Editor.TimelineMGR._currentScrollIndex;
                let dragTime = (offsetX + Ensemble.Editor.TimelineMGR.ui.scrollableContainer.scrollLeft) * zoomRatio;

                if (0 > trackDragIndex) trackDragIndex = 0;
                else if (trackDragIndex >= Ensemble.Editor.TimelineMGR.tracks.length) trackDragIndex = Ensemble.Editor.TimelineMGR.tracks.length - 1;

                let replacementY = Ensemble.Editor.TimelineMGR._currentTrackHeight * trackDragIndex;
                let replacementTime = Ensemble.Editor.TimelineMGR.tracks[trackDragIndex].closestFreeSlot(dragTime, Ensemble.Editor.MediaBrowser._dragEnsembleFile.duration, -1); //time, duration, omit, skipBefore, skipAfter

                Ensemble.Editor.MediaBrowser._dragDestination.time = replacementTime;
                Ensemble.Editor.MediaBrowser._dragDestination.track = trackDragIndex;

                Ensemble.Editor.TimelineMGR.ui.dropPreview.style.left = (replacementTime / zoomRatio) + "px";
                Ensemble.Editor.TimelineMGR.ui.dropPreview.style.top = replacementY + "px";
            }
            else {
                Ensemble.Editor.MediaBrowser.ui.dragPreview.style.left = Ensemble.Utilities.MouseTracker.x + "px";
                Ensemble.Editor.MediaBrowser.ui.dragPreview.style.top = Ensemble.Utilities.MouseTracker.y + "px";
            }
            if (Ensemble.Editor.MediaBrowser._dragging) window.requestAnimationFrame(Ensemble.Editor.MediaBrowser._listItemDragUpdate);
        },

        _listItemEndDrag: function (event) {
            Ensemble.Editor.MediaBrowser._dragging = false;
            Ensemble.Editor.UI.PageSections.menu.mediaMenu.local.mediaList.style.overflowY = "";
            document.removeEventListener("mouseup", Ensemble.Editor.MediaBrowser._listItemEndDrag);

            $(Ensemble.Editor.MediaBrowser.ui.dragPreview).removeClass("media-browser__drag-preview--visible").addClass("media-browser__drag-preview--hidden");

            Ensemble.Editor.Renderer.enableStandardInteraction();

            Ensemble.Editor.TimelineMGR.ui.scrollableContainer.removeEventListener("pointerenter", Ensemble.Editor.MediaBrowser._listeners.draggedClipEnteredTimeline);
            Ensemble.Editor.TimelineMGR.ui.scrollableContainer.removeEventListener("pointerleave", Ensemble.Editor.MediaBrowser._listeners.draggedClipLeftTimeline);

            if (Ensemble.Editor.MediaBrowser._dragTimeline) {
                // import the clip
                let newClip = new Ensemble.Editor.Clip(null);
                newClip.file = {
                    path: Ensemble.Editor.MediaBrowser._dragEnsembleFile.path,
                    token: ""
                };
                newClip.preExisting = false;

                let clipImportAction = new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.importClip,
                    {
                        clipId: newClip.id,
                        clipObj: newClip,
                        destinationTrack: Ensemble.Editor.TimelineMGR.tracks[Ensemble.Editor.MediaBrowser._dragDestination.track].id,
                        destinationTime: Ensemble.Editor.MediaBrowser._dragDestination.time
                    }
                );
                Ensemble.HistoryMGR.performAction(clipImportAction);
            }

            $(Ensemble.Editor.TimelineMGR.ui.dropPreview).removeClass("timeline__drop-preview--visible").addClass("timeline__drop-preview--hidden");
            Ensemble.Editor.MediaBrowser._dragTimeline = false;
        },

        _disableMediaFolderListeners: function () {
            Ensemble.Editor.UI.PageSections.menu.mediaMenu.local.mediaList.removeEventListener("click", Ensemble.Editor.MediaBrowser._listItemClicked);
        },

        ui: {
            previewFlyout: null,
            propertiesFlyout: null,
            dragPreview: null
        },

        _refreshUI: function () {
            this.ui.previewFlyout = document.getElementsByClassName("media-browser__preview-flyout")[0];
            this.ui.propertiesFlyout = document.getElementsByClassName("flyout--editor-media-browser-properties")[0];
            this.ui.dragPreview = document.getElementsByClassName("media-browser__drag-preview")[0];

            this.ui.previewFlyout.addEventListener("afterhide", Ensemble.Editor.MediaBrowser._listeners.closedMediaPreview);

            let locationCommands = document.getElementsByClassName("media-browser-location-flyout__command");
            for (let i = 0; i < locationCommands.length; i++) {
                locationCommands[i].addEventListener("click", Ensemble.Editor.MediaBrowser._listeners.locationContextButtonClicked);
            }
        },

        _cleanUI: function () {
            this.ui.previewFlyout.removeEventListener("afterhide", Ensemble.Editor.MediaBrowser._listeners.closedMediaPreview);

            this.ui.previewFlyout = null;
            this.ui.propertiesFlyout = null;
            this.ui.dragPreview = null;

            let locationCommands = document.getElementsByClassName("media-browser-location-flyout__command");
            for (let i = 0; i < locationCommands.length; i++) {
                locationCommands[i].removeEventListener("click", Ensemble.Editor.MediaBrowser._listeners.locationContextButtonClicked);
            }
        },

        _listeners: {
            retrievedMediaPreview: function (file, uri, event) {
                console.log("Loaded preview.");
                $(".media-browser-preview").addClass("media-browser-preview--hidden");

                let item = document.getElementsByClassName("media-browser-preview--" + file.eo1type)[0];
                item.src = uri;
                $(item).removeClass("media-browser-preview--hidden");

                setTimeout(function () { Ensemble.Editor.MediaBrowser.ui.previewFlyout.winControl.show(event.target); }, 0);
            },

            closedMediaPreview: function () {
                $(".media-browser-preview").attr("src", "");
            },

            draggedClipEnteredTimeline: function (event) {
                Ensemble.Editor.MediaBrowser._dragTimeline = true;

                let myOffset = $(event.currentTarget).offset();
                Ensemble.Editor.MediaBrowser._dragOffset.left = myOffset.left;
                Ensemble.Editor.MediaBrowser._dragOffset.top = myOffset.top;
                
                Ensemble.Editor.TimelineMGR.ui.dropPreview.style.width = (Ensemble.Editor.MediaBrowser._dragEnsembleFile.duration / Ensemble.Editor.TimelineZoomMGR.zoomLevels[Ensemble.Editor.TimelineZoomMGR.currentLevel].ratio) + "px";
                Ensemble.Editor.TimelineMGR.ui.dropPreview.style.height = Ensemble.Editor.TimelineMGR._currentTrackHeight + "px";

                $(Ensemble.Editor.MediaBrowser.ui.dragPreview).removeClass("media-browser__drag-preview--visible").addClass("media-browser__drag-preview--hidden");
                $(Ensemble.Editor.TimelineMGR.ui.dropPreview).removeClass("timeline__drop-preview--hidden").addClass("timeline__drop-preview--visible");

                
            },

            draggedClipLeftTimeline: function (event) {
                Ensemble.Editor.MediaBrowser._dragTimeline = false;
                $(Ensemble.Editor.TimelineMGR.ui.dropPreview).removeClass("timeline__drop-preview--visible").addClass("timeline__drop-preview--hidden");
                $(Ensemble.Editor.MediaBrowser.ui.dragPreview).removeClass("media-browser__drag-preview--hidden").addClass("media-browser__drag-preview--visible");
            },

            locationContextButtonClicked: function (event) {
                switch (event.currentTarget.dataset.mediabrowserLocation) {
                    case "video":
                        Ensemble.Editor.MediaBrowser.setContext("video");
                        Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserLocation.innerHTML = "Videos library";
                        break;
                    case "music":
                        Ensemble.Editor.MediaBrowser.setContext("music");
                        Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserLocation.innerHTML = "Music library";
                        break;
                    case "picture":
                        Ensemble.Editor.MediaBrowser.setContext("picture");
                        Ensemble.Editor.UI.UserInput.Buttons.mediaBrowserLocation.innerHTML = "Pictures library";
                        break;
                }
            }
        }

    });
})();