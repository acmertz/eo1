(function () {
    WinJS.Namespace.define("Ensemble.Editor.VideoCaptureMGR", {
        /// <summary>Manages media capture devices and recording sessions.</summary>

        session: {
            captureInitSettings: new Windows.Media.Capture.MediaCaptureInitializationSettings(),
            captureMGR: new Windows.Media.Capture.MediaCapture(),
            captureReady: false,
            captureActive: false,
            recordingActive: false,
            encodingProfile: Windows.Media.MediaProperties.MediaEncodingProfile.createMp4(Windows.Media.MediaProperties.VideoEncodingQuality.hd720p),
            videoDevices: {
                deviceList: [],
                captureProperties: [],
                previewProperties: []
            },
            audioDevices: {
                deviceList: [],
                properties: []
            },
            previewMirroring: false,
            previewActive: false,
            targetFiles: {
                currentTarget: null,
                captureStartTime: 0,
                recordingStartTime: 0,
                recordingStopTime: 0,
                projectTimeAtStart: 0
            }
        },

        displayRequest: null,

        init: function () {
            this._refreshUI();

            this.session.captureInitSettings = null;
            this.session.captureMGR = null;
            this.session.captureReady = false;
            this.session.captureActive = false;
            this.session.recordingActive = false;
            this.session.encodingProfile = null;

            this.session.videoDevices.deviceList = [];
            this.session.videoDevices.captureProperties = [];
            this.session.videoDevices.previewProperties = [];

            this.session.audioDevices.deviceList = [];
            this.session.audioDevices.properties = [];

            this.session.previewActive = false;
            this.session.previewMirroring = false;

            this.session.targetFiles.currentTarget = null;
            this.session.targetFiles.captureStartTime = null;
            this.session.targetFiles.recordingStartTime = null;
            this.session.targetFiles.recordingStopTime = null;
            this.session.targetFiles.projectTimeAtStart = null;

            this.displayRequest = new Windows.System.Display.DisplayRequest();
        },

        unload: function () {
            if (this.session.previewActive) this.cleanupVideoCaptureSession();
            this._cleanUI();
        },

        initCaptureSession: function () {
            /// <summary>Enumerates media capture devices, sets up the video recording Panel, and initializes a video capture session.</summary>
            WinJS.Utilities.addClass(Ensemble.Editor.VideoCaptureMGR.ui.webcamCaptureLoadingIndicator, "media-capture-loading--visible");
            Ensemble.Editor.VideoCaptureMGR.session.captureInitSettings = new Windows.Media.Capture.MediaCaptureInitializationSettings();
            Ensemble.Editor.VideoCaptureMGR.session.captureInitSettings.audioDeviceId = "";
            Ensemble.Editor.VideoCaptureMGR.session.captureInitSettings.videoDeviceId = "";
            Ensemble.Editor.VideoCaptureMGR.session.captureInitSettings.streamingCaptureMode = Windows.Media.Capture.StreamingCaptureMode.audioAndVideo;
            Ensemble.Editor.VideoCaptureMGR.session.captureInitSettings.photoCaptureSource = Windows.Media.Capture.PhotoCaptureSource.videoPreview;
            Windows.Devices.Enumeration.DeviceInformation.findAllAsync(Windows.Devices.Enumeration.DeviceClass.videoCapture).then(function (videoDevices) {
                if (videoDevices.length > 0) {
                    WinJS.Utilities.removeClass(Ensemble.Editor.VideoCaptureMGR.ui.webcamCaptureUnavailableDialog, "media-capture-unavailable-dialog--visible");
                    Ensemble.Editor.VideoCaptureMGR.createVideoFile(null, Ensemble.Editor.VideoCaptureMGR._listeners.webcamFileCreated);

                    Ensemble.Editor.VideoCaptureMGR.session.videoDevices.deviceList = videoDevices;

                    let selectedCameraId = Ensemble.Settings.retrieveSetting("last-used-camera-device"),
                        numOfVideoDevices = videoDevices.length,
                        webcamMenuCommands = [];
                    for (let i = 0; i < numOfVideoDevices; i++) {
                        let newItem = new WinJS.UI.MenuCommand(document.createElement("button"), { type: 'toggle', label: videoDevices[i].name, onclick: Ensemble.Editor.VideoCaptureMGR._listeners.webcamDeviceSelected });
                        newItem.element.dataset.webcamDeviceIndex = i;
                        if (videoDevices[i].id == selectedCameraId) newItem.selected = true;
                        webcamMenuCommands.push(newItem);
                    }
                    if (1 > selectedCameraId.length) {
                        webcamMenuCommands[0].selected = true;
                        selectedCameraId = videoDevices[0].id;
                    }
                    Ensemble.Editor.VideoCaptureMGR.ui.webcamDeviceSelectContextMenu.winControl.commands = webcamMenuCommands;
                    Ensemble.Settings.saveSetting("last-used-camera-device", selectedCameraId);

                    Ensemble.Editor.VideoCaptureMGR.session.captureInitSettings.videoDeviceId = selectedCameraId;

                    Windows.Devices.Enumeration.DeviceInformation.findAllAsync(Windows.Devices.Enumeration.DeviceClass.audioCapture).then(function (audioDevices) {
                        Ensemble.Editor.VideoCaptureMGR.session.audioDevices.deviceList = audioDevices;

                        let numOfAudioDevices = audioDevices.length,
                            micMenuCommands = [];
                        for (let i = 0; i < numOfAudioDevices; i++) {
                            let newItem = new WinJS.UI.MenuCommand(document.createElement("button"), { type: 'toggle', label: audioDevices[i].name, onclick: Ensemble.Editor.VideoCaptureMGR._listeners.micDeviceSelected });
                            newItem.element.dataset.micDeviceIndex = i;
                            micMenuCommands.push(newItem);
                        }
                        micMenuCommands[0].selected = true;
                        Ensemble.Editor.VideoCaptureMGR.ui.micDeviceSelectContextMenu.winControl.commands = micMenuCommands;

                        if (numOfAudioDevices > 0) Ensemble.Editor.VideoCaptureMGR.session.captureInitSettings.audioDeviceId = audioDevices[0].id;


                        Ensemble.Editor.VideoCaptureMGR.session.captureMGR = new Windows.Media.Capture.MediaCapture();
                        Ensemble.Editor.VideoCaptureMGR.session.captureMGR.addEventListener("recordlimitationexceeded", Ensemble.Editor.VideoCaptureMGR._listeners.captureRecordLimitationExceeded);
                        Ensemble.Editor.VideoCaptureMGR.session.captureMGR.addEventListener("failed", Ensemble.Editor.VideoCaptureMGR._listeners.captureFailed);
                        Ensemble.Editor.VideoCaptureMGR.session.captureMGR.initializeAsync(Ensemble.Editor.VideoCaptureMGR.session.captureInitSettings).then(Ensemble.Editor.VideoCaptureMGR._listeners.webcamMediaCapturerInitialized);
                    });
                }
                else {
                    console.error("No video devices detected.");
                    WinJS.Utilities.addClass(Ensemble.Editor.VideoCaptureMGR.ui.webcamCaptureUnavailableDialog, "media-capture-unavailable-dialog--visible");
                }
            });
        },

        cleanupVideoCaptureSession: function () {
            /// <summary>Cleans up the current recording session.</summary>

            this.ui.webcamCapturePreview.pause();
            this.ui.webcamCapturePreview.src = "";
            this.session.previewActive = false;
            try {
                this.displayRequest.requestRelease();
            }
            catch (exception) { }

            if (this.session.captureMGR != null) this.session.captureMGR.close();

            this.session.captureInitSettings = null;
            this.session.captureMGR = null;
            this.session.captureReady = false;
            this.session.captureActive = false;
            this.session.recordingActive = false;
            this.session.encodingProfile = null;

            this.session.videoDevices.deviceList = [];
            this.session.videoDevices.captureProperties = [];
            this.session.videoDevices.previewProperties = [];

            this.session.audioDevices.deviceList = [];
            this.session.audioDevices.properties = [];

            this.session.previewActive = false;
            this.session.previewMirroring = false;

            if (this.session.targetFiles.currentTarget != null) this.session.targetFiles.currentTarget.deleteAsync();
            this.session.targetFiles.currentTarget = null;
            this.session.targetFiles.captureStartTime = null;
            this.session.targetFiles.recordingStartTime = null;
            this.session.targetFiles.recordingStopTime = null;
            this.session.targetFiles.projectTimeAtStart = null;

            WinJS.Utilities.removeClass(Ensemble.Editor.VideoCaptureMGR.ui.webcamCaptureLoadingIndicator, "media-capture-loading--visible");
        },

        changeCameraPreviewDevice: function (videoDevice, audioDevice, force) {
            /// <summary>Switches the camera preview to the device with the given ID. Starts the preview if it's not already active. Fails if the capture session has not been initialized.</summary>
            /// <param name="videoDeviceId" type="String">The ID of the camera device to activate.</param>
            /// <param name="audioDeviceId" type="String">The ID of the microphone device to activate.</param>
            /// <param name="force" type="Boolean">If true, forces the video device to be started even if it's already the active device.</param>
            let videoDeviceId = videoDevice ? videoDevice.id : null,
                audioDeviceId = audioDevice ? audioDevice.id : null;
            if (force || Ensemble.Editor.VideoCaptureMGR.session.captureMGR.mediaCaptureSettings.videoDeviceId != videoDeviceId || Ensemble.Editor.VideoCaptureMGR.session.captureMGR.mediaCaptureSettings.audioDeviceId != audioDeviceId) {
                WinJS.Utilities.addClass(Ensemble.Editor.VideoCaptureMGR.ui.webcamCaptureLoadingIndicator, "media-capture-loading--visible");
                Ensemble.Editor.VideoCaptureMGR.session.captureReady = false;
                
                Ensemble.Editor.VideoCaptureMGR.session.captureMGR.stopRecordAsync().then(function () {
                    Ensemble.Editor.VideoCaptureMGR.session.captureActive = false;

                    let oldTarget = Ensemble.Editor.VideoCaptureMGR.session.targetFiles.currentTarget;
                    Ensemble.Editor.VideoCaptureMGR.session.targetFiles.currentTarget = null;
                    Ensemble.Editor.VideoCaptureMGR.replaceVideoFile(oldTarget, Ensemble.Editor.VideoCaptureMGR._listeners.webcamFileCreated);

                    Ensemble.Editor.VideoCaptureMGR.ui.webcamCapturePreview.pause();
                    Ensemble.Editor.VideoCaptureMGR.ui.webcamCapturePreview.src = "";
                    Ensemble.Editor.VideoCaptureMGR.displayRequest.requestRelease();

                    let tempInitCaptureSettings = new Windows.Media.Capture.MediaCaptureInitializationSettings();
                    tempInitCaptureSettings.audioDeviceId = (audioDeviceId && Ensemble.Editor.VideoCaptureMGR.session.captureMGR.mediaCaptureSettings.audioDeviceId != audioDeviceId) ? audioDeviceId : Ensemble.Editor.VideoCaptureMGR.session.captureInitSettings.audioDeviceId;
                    tempInitCaptureSettings.videoDeviceId = (videoDeviceId && Ensemble.Editor.VideoCaptureMGR.session.captureMGR.mediaCaptureSettings.videoDeviceId != videoDeviceId) ? videoDeviceId : Ensemble.Editor.VideoCaptureMGR.session.captureInitSettings.videoDeviceId;
                    tempInitCaptureSettings.streamingCaptureMode = Ensemble.Editor.VideoCaptureMGR.session.captureInitSettings.streamingCaptureMode;
                    tempInitCaptureSettings.photoCaptureSource = Ensemble.Editor.VideoCaptureMGR.session.captureInitSettings.photoCaptureSource;
                    Ensemble.Editor.VideoCaptureMGR.session.captureInitSettings = tempInitCaptureSettings;

                    Ensemble.Settings.saveSetting("last-used-camera-device", tempInitCaptureSettings.videoDeviceId);

                    if (videoDevice) {
                        if (videoDevice.enclosureLocation.panel == Windows.Devices.Enumeration.Panel.front) Ensemble.Editor.VideoCaptureMGR.session.previewMirroring = true;
                        else Ensemble.Editor.VideoCaptureMGR.session.previewMirroring = false;
                    }

                    Ensemble.Editor.VideoCaptureMGR.session.captureMGR.close();
                    Ensemble.Editor.VideoCaptureMGR.session.captureMGR = new Windows.Media.Capture.MediaCapture();
                    Ensemble.Editor.VideoCaptureMGR.session.captureMGR.addEventListener("recordlimitationexceeded", Ensemble.Editor.VideoCaptureMGR._listeners.captureRecordLimitationExceeded);
                    Ensemble.Editor.VideoCaptureMGR.session.captureMGR.addEventListener("failed", Ensemble.Editor.VideoCaptureMGR._listeners.captureFailed);
                    Ensemble.Editor.VideoCaptureMGR.session.captureMGR.initializeAsync(Ensemble.Editor.VideoCaptureMGR.session.captureInitSettings).then(Ensemble.Editor.VideoCaptureMGR._listeners.webcamMediaCapturerInitialized);
                });
            }
        },

        changeCameraPreviewQuality: function (videoQuality) {
            if (videoQuality != null) {
                WinJS.Utilities.addClass(Ensemble.Editor.VideoCaptureMGR.ui.webcamCaptureLoadingIndicator, "media-capture-loading--visible");
                Ensemble.Editor.VideoCaptureMGR.session.captureReady = false;
                Ensemble.Editor.VideoCaptureMGR.session.captureMGR.stopRecordAsync().then(function () {
                    Ensemble.Editor.VideoCaptureMGR.session.captureActive = false;
                    let oldTarget = Ensemble.Editor.VideoCaptureMGR.session.targetFiles.currentTarget;
                    Ensemble.Editor.VideoCaptureMGR.session.targetFiles.currentTarget = null;
                    Ensemble.Editor.VideoCaptureMGR.replaceVideoFile(oldTarget, function (file) {
                        Ensemble.Editor.VideoCaptureMGR.session.targetFiles.currentTarget = file;
                        Ensemble.Editor.VideoCaptureMGR.session.captureMGR.videoDeviceController.setMediaStreamPropertiesAsync(Windows.Media.Capture.MediaStreamType.videoRecord, videoQuality).then(function () {
                            let previewQuality = Ensemble.Editor.VideoCaptureMGR.matchPreviewToCaptureQuality(videoQuality, Ensemble.Editor.VideoCaptureMGR.session.videoDevices.previewProperties);
                            Ensemble.Editor.VideoCaptureMGR.session.captureMGR.videoDeviceController.setMediaStreamPropertiesAsync(Windows.Media.Capture.MediaStreamType.videoPreview, previewQuality).done(
                                Ensemble.Editor.VideoCaptureMGR._listeners.webcamCaptureQualityChanged
                            );
                        });
                    });
                });
            }
        },

        webcamStreamPropertiesEqual: function (first, second) {
            /// <summary>Returns whether or not the given two MediaEncodingProperties objects are equivalent.</summary>
            /// <returns type="Boolean"></returns>
            let valid = true;
            if (first.bitrate != second.bitrate) valid = false;
            if (first.frameRate.denominator != second.frameRate.denominator) valid = false;
            if (first.frameRate.numerator != second.frameRate.numerator) valid = false;
            if (first.height != second.height) valid = false;
            if (first.pixelAspectRatio.denominator != second.pixelAspectRatio.denominator) valid = false;
            if (first.pixelAspectRatio.numerator != second.pixelAspectRatio.numerator) valid = false;
            if (first.subtype != second.subtype) valid = false;
            if (first.type != second.type) valid = false;
            if (first.width != second.width) valid = false;
            return valid;
        },

        micStreamPropertiesEqual: function (first, second) {
            /// <summary>Returns whether or not the given two MediaEncodingProperties objects are equivalent.</summary>
            /// <returns type="Boolean"></returns>
            let valid = true;
            if (first.bitrate != second.bitrate) valid = false;
            if (first.channelCount != second.channelCount) valid = false;
            if (first.sampleRate != second.sampleRate) valid = false;
            return valid;
        },

        refreshWebcamDeviceQualityContextMenu: function () {
            let captureResolutions = Ensemble.Editor.VideoCaptureMGR.session.captureMGR.videoDeviceController.getAvailableMediaStreamProperties(Windows.Media.Capture.MediaStreamType.videoRecord),
                previewResolutions = Ensemble.Editor.VideoCaptureMGR.session.captureMGR.videoDeviceController.getAvailableMediaStreamProperties(Windows.Media.Capture.MediaStreamType.videoPreview),
                resCount = captureResolutions.length,
                prunedCaptureResolutions = Ensemble.Editor.VideoCaptureMGR.pruneDuplicateVideoQualities(captureResolutions),
                prunedResLen = prunedCaptureResolutions.length,
                prunedPreviewResolutions = Ensemble.Editor.VideoCaptureMGR.pruneDuplicateVideoQualities(previewResolutions),
                prunedPreviewResLen = prunedPreviewResolutions.length,
                menuItems = [];

            // retrieve saved quality setting, or default to the highest available capture quality
            let retrievedQuality = Ensemble.Settings.retrieveSetting("last-used-camera-quality"),
                selectedQuality = null;
            try {
                retrievedQuality = JSON.parse(retrievedQuality);
                selectedQuality = Ensemble.Editor.VideoCaptureMGR.matchVideoQuality(retrievedQuality.width, retrievedQuality.height, retrievedQuality.frameRate.numerator, retrievedQuality.frameRate.denominator, captureResolutions);
            }
            catch (exception) {
                console.log("Unable to determine previous quality -- defaulting to highest available.");
                selectedQuality = prunedCaptureResolutions[prunedResLen - 1];
                Ensemble.Settings.saveSetting("last-used-camera-quality", JSON.stringify({
                    width: selectedQuality.width,
                    height: selectedQuality.height,
                    frameRate: {
                        numerator: selectedQuality.frameRate.numerator,
                        denominator: selectedQuality.frameRate.denominator
                    }
                }));
            }

            // populate the webcam quality flyout menu
            for (let i = 0; i < prunedResLen; i++) {
                // add an item to the flyout
                let resString = prunedCaptureResolutions[i].width + "x" + prunedCaptureResolutions[i].height + ", " + Ensemble.Utilities.TimeConverter.convertFPS(prunedCaptureResolutions[i].frameRate.numerator, prunedCaptureResolutions[i].frameRate.denominator) + "fps",
                    newItem = new WinJS.UI.MenuCommand(document.createElement("button"), { type: 'toggle', label: resString, onclick: Ensemble.Editor.VideoCaptureMGR._listeners.webcamQualitySelected });
                newItem.element.dataset.webcamStreamIndex = i;
                menuItems.push(newItem);
                if (Ensemble.Editor.VideoCaptureMGR.webcamStreamPropertiesEqual(selectedQuality, prunedCaptureResolutions[i])) menuItems[menuItems.length - 1].selected = true;
            }
            Ensemble.Editor.VideoCaptureMGR.ui.webcamDeviceQualityContextMenu.winControl.commands = menuItems;

            // select a preview quality that matches the capture aspect ratio. try to match (but not exceed) the selected capture resolution.
            let selectedPreview = Ensemble.Editor.VideoCaptureMGR.matchPreviewToCaptureQuality(selectedQuality, prunedPreviewResolutions);

            // store the list of retrieved capture quality settings so we don't have to enumerate it again as long as the same camera remains active
            Ensemble.Editor.VideoCaptureMGR.session.videoDevices.captureProperties = prunedCaptureResolutions;
            Ensemble.Editor.VideoCaptureMGR.session.videoDevices.previewProperties = prunedPreviewResolutions;

            // finally, set the device's capture and preview qualities to match the selected values
            Ensemble.Editor.VideoCaptureMGR.session.captureMGR.videoDeviceController.setMediaStreamPropertiesAsync(Windows.Media.Capture.MediaStreamType.videoRecord, selectedQuality).then(function () {
                Ensemble.Editor.VideoCaptureMGR.session.captureMGR.videoDeviceController.setMediaStreamPropertiesAsync(Windows.Media.Capture.MediaStreamType.videoPreview, selectedPreview).done(
                    Ensemble.Editor.VideoCaptureMGR._listeners.webcamAutosetQuality
                );
            });
        },

        pruneDuplicateVideoQualities: function (captureResolutions) {
            let resCount = captureResolutions.length,
                prunedCaptureResolutions = [];
            for (let i = 0; i < resCount; i++) {
                if (prunedCaptureResolutions.length > 0) {
                    // there is already at least one item in the list. Check to see if it should be replaced.
                    let prunedLen = prunedCaptureResolutions.length,
                        previousRes = prunedCaptureResolutions[prunedLen - 1];
                    if (previousRes.width == captureResolutions[i].width && previousRes.height == captureResolutions[i].height && previousRes.frameRate.numerator == captureResolutions[i].frameRate.numerator && previousRes.frameRate.denominator == captureResolutions[i].frameRate.denominator) {
                        // there is already a duplicate resolution in this list. Since we're going in order of increasing quality, simply replace it.
                        prunedCaptureResolutions[prunedLen - 1] = captureResolutions[i];
                    }
                    else prunedCaptureResolutions.push(captureResolutions[i]);
                }
                else prunedCaptureResolutions.push(captureResolutions[i]);
            }
            return prunedCaptureResolutions;
        },

        matchVideoQuality: function (width, height, fpsNum, fpsDenom, captureResolutions) {
            /// <summary>Returns the webcam capture quality that matches the given parameters.</summary>
            /// <param name="width" type="Number">Width of the video stream.</param>
            /// <param name="height" type="Number">Height of the video stream.</param>
            /// <param name="fpsNum" type="Number">FPS numerator of the video stream.</param>
            /// <param name="fpsDenom" type="Number">FPS denominator of the video stream.</param>
            /// <param name="captureResolutions" type="Array">An array of resolutions from which to pick a match.</param>
            /// <returns type="Object">The matched resolution.</returns>
            let resCount = captureResolutions.length,
                returnVal = null;

            for (let i = 0; i < resCount; i++) {
                let currentRes = captureResolutions[i];
                if (currentRes.width == width && currentRes.height == height && currentRes.frameRate.numerator == fpsNum && currentRes.frameRate.denominator == fpsDenom) {
                    returnVal = currentRes;
                    break;
                }
            }

            if (returnVal == null) {
                // match resolution as closely as possible. ignore fps.
                let pixelCount = width * height,
                    closestRes = captureResolutions[0];
                for (let i = 0; i < resCount; i++) {
                    let currentRes = captureResolutions[i],
                        currentProduct = currentRes.width * currentRes.height;
                    if (Math.abs(currentProduct - (currentRes.width * currentRes.height)) < Math.abs(currentProduct - (closestRes.width * closestRes.height))) closestRes = currentRes;
                }
                returnVal = closestRes;
            }

            return returnVal;
        },

        matchPreviewToCaptureQuality: function (captureQuality, previewCandidates) {
            let selectedPreview = previewCandidates[0],
                prunedPreviewResLen = previewCandidates.length,
                selectedQualityAspect = captureQuality.width / captureQuality.height;
            for (let i = 0; i < prunedPreviewResLen; i++) {
                let currentPreview = previewCandidates[i],
                    currentDif = Math.abs((currentPreview.width / currentPreview.height) - selectedQualityAspect),
                    selectedDif = Math.abs((selectedPreview.width / selectedPreview.height) - selectedQualityAspect);
                if (selectedDif >= currentDif && captureQuality.width >= currentPreview.width && captureQuality.height >= currentPreview.height) {
                    selectedPreview = currentPreview;
                }
            }
            return selectedPreview;
        },

        createVideoFile: function (name, cb) {
            /// <summary>Creates a new video file for webcam capture.</summary>
            /// <param name="name" type="String">The name for the file, omitting the extension. Defaults to "Recording" if null.</param>
            /// <param name="cb" type="Function">The callback to execute when the file has been created.</param>
            Windows.Storage.KnownFolders.videosLibrary.createFolderAsync("Ensemble of One Recordings", Windows.Storage.CreationCollisionOption.openIfExists).then(function (createdFolder) {
                let fileType = ".mp4",
                    fileName = name || "Recording";
                createdFolder.createFileAsync(fileName + fileType, Windows.Storage.CreationCollisionOption.generateUniqueName).done(cb);
            });
        },

        replaceVideoFile: function (file, cb) {
            /// <summary>Deletes the given StorageFile and creates a new file with the same name. Calls the provided callback upon copmletion.</summary>
            /// <param name="file" type="Windows.Storage.StorageFile">The file to replace.</param>
            /// <param name="cb" type="Function">The callback to execute when the file has been replaced.</param>
            let fileName = file.displayName;
            file.deleteAsync().then(function () {
                Ensemble.Editor.VideoCaptureMGR.createVideoFile(fileName, cb);
            });
        },

        webcamSessionInProgress: function () {
            /// <summary>Returns whether or not a webcam capture session is currently in progress.</summary>
            /// <returns type="Boolean"></returns>
            return Ensemble.Editor.VideoCaptureMGR.session.recordingActive;
        },

        cancelCurrentWebcamSession: function () {
            /// <summary>Cancels the current recording session.</summary>
            Ensemble.Editor.VideoCaptureMGR.session.recordingActive = false;
        },

        ui: {
            webcamCapturePreview: null,
            webcamCaptureSettingsButton: null,
            webcamCaptureSettingsContextMenu: null,
            webcamDeviceQualityContextMenu: null,
            webcamDeviceSelectContextMenu: null,
            micDeviceSelectContextMenu: null,
            webcamCaptureLoadingIndicator: null,
            webcamCaptureStartStopButton: null,
            webcamCaptureUnavailableDialog: null,
            webcamKaraokeToggle: null
        },

        _refreshUI: function () {
            this.ui.webcamCapturePreview = document.getElementsByClassName("media-capture-preview--webcam")[0];
            this.ui.webcamCaptureSettingsButton = document.getElementsByClassName("eo1-btn--webcam-capture-settings")[0];
            this.ui.webcamCaptureSettingsContextMenu = document.getElementsByClassName("contextmenu--webcam-panel-options")[0];
            this.ui.webcamDeviceQualityContextMenu = document.getElementsByClassName("contextmenu--webcam-device-quality")[0];
            this.ui.webcamDeviceSelectContextMenu = document.getElementsByClassName("contextmenu--webcam-device-select")[0];
            this.ui.micDeviceSelectContextMenu = document.getElementsByClassName("contextmenu--mic-device-select")[0];
            this.ui.webcamCaptureLoadingIndicator = document.getElementsByClassName("media-capture-loading--webcam")[0];
            this.ui.webcamCaptureStartStopButton = document.getElementsByClassName("eo1-btn--webcam-capture-startstop")[0];
            this.ui.webcamCaptureUnavailableDialog = document.getElementsByClassName("media-capture-unavailable-dialog--webcam")[0];
            this.ui.webcamKaraokeToggle = document.getElementsByClassName("contextmenu--webcam-panel-options__karaoke-toggle")[0];

            this.ui.webcamCapturePreview.addEventListener("playing", Ensemble.Editor.VideoCaptureMGR._listeners.mediaPreviewBegan);
            this.ui.webcamCaptureSettingsButton.addEventListener("click", Ensemble.Editor.VideoCaptureMGR._listeners.webcamCaptureSettingsButtonClicked);
            this.ui.webcamCaptureStartStopButton.addEventListener("click", Ensemble.Editor.VideoCaptureMGR._listeners.videoCaptureStartStopButtonClicked);
        },

        _cleanUI: function () {
            this.ui.webcamCapturePreview.removeEventListener("playing", Ensemble.Editor.VideoCaptureMGR._listeners.mediaPreviewBegan);
            this.ui.webcamCaptureSettingsButton.removeEventListener("click", Ensemble.Editor.VideoCaptureMGR._listeners.webcamCaptureSettingsButtonClicked);
            this.ui.webcamCaptureStartStopButton.removeEventListener("click", Ensemble.Editor.VideoCaptureMGR._listeners.videoCaptureStartStopButtonClicked);

            this.ui.webcamCapturePreview = null;
            this.ui.webcamCaptureSettingsButton = null;
            this.ui.webcamCaptureSettingsContextMenu = null;
            this.ui.webcamDeviceQualityContextMenu = null;
            this.ui.webcamDeviceSelectContextMenu = null;
            this.ui.micDeviceSelectContextMenu = null;
            this.ui.webcamCaptureLoadingIndicator = null;
            this.ui.webcamCaptureStartStopButton = null;
            this.ui.webcamCaptureUnavailableDialog = null;
            this.ui.webcamKaraokeToggle = null;
        },

        _listeners: {
            webcamMediaCapturerInitialized: function (success) {
                Ensemble.Editor.VideoCaptureMGR.session.encodingProfile = Windows.Media.MediaProperties.MediaEncodingProfile.createMp4(Windows.Media.MediaProperties.VideoEncodingQuality.auto);
                Ensemble.Editor.VideoCaptureMGR.refreshWebcamDeviceQualityContextMenu();
            },

            webcamFileCreated: function (file) {
                console.log("Created file for recording session.");
                Ensemble.Editor.VideoCaptureMGR.session.targetFiles.currentTarget = file;
                Ensemble.Editor.VideoCaptureMGR._listeners.webcamInitializationCaptureCheck();
            },

            webcamAutosetQuality: function () {
                Ensemble.Editor.VideoCaptureMGR.session.captureReady = true;
                Ensemble.Editor.VideoCaptureMGR._listeners.webcamInitializationCaptureCheck();
            },

            webcamInitializationCaptureCheck: function () {
                /// <summary>Checks if both the media capture manager and the target file have been initialized and starts the camera preview if they have.</summary>
                if (Ensemble.Editor.VideoCaptureMGR.session.targetFiles.currentTarget != null && Ensemble.Editor.VideoCaptureMGR.session.captureReady) {

                    if (Ensemble.Editor.VideoCaptureMGR.session.previewMirroring) WinJS.Utilities.addClass(Ensemble.Editor.VideoCaptureMGR.ui.webcamCapturePreview, "media-capture-preview--mirrored");
                    else WinJS.Utilities.removeClass(Ensemble.Editor.VideoCaptureMGR.ui.webcamCapturePreview, "media-capture-preview--mirrored");

                    let captureUrl = URL.createObjectURL(Ensemble.Editor.VideoCaptureMGR.session.captureMGR);
                    Ensemble.Editor.VideoCaptureMGR.ui.webcamCapturePreview.src = captureUrl;
                    Ensemble.Editor.VideoCaptureMGR.displayRequest.requestActive();
                    Ensemble.Editor.VideoCaptureMGR.ui.webcamCapturePreview.play();
                    // wait for media preview to begin before attempting to start capture
                }
            },

            webcamCaptureBegan: function (status) {
                Ensemble.Editor.VideoCaptureMGR.session.targetFiles.captureStartTime = performance.now();
                Ensemble.Editor.VideoCaptureMGR.session.captureActive = true;
                WinJS.Utilities.removeClass(Ensemble.Editor.VideoCaptureMGR.ui.webcamCaptureLoadingIndicator, "media-capture-loading--visible");
                console.log("Started media capture.");
            },

            webcamCaptureQualityChanged: function () {
                Ensemble.Editor.VideoCaptureMGR.session.captureReady = true;
                Ensemble.Editor.VideoCaptureMGR.session.captureMGR.startRecordToStorageFileAsync(Ensemble.Editor.VideoCaptureMGR.session.encodingProfile, Ensemble.Editor.VideoCaptureMGR.session.targetFiles.currentTarget).then(Ensemble.Editor.VideoCaptureMGR._listeners.webcamCaptureBegan);
            },

            mediaPreviewBegan: function (event) {
                console.log("Started media preview.");
                Ensemble.Editor.VideoCaptureMGR.session.previewActive = true;
                setTimeout(function () {
                    Ensemble.Editor.VideoCaptureMGR.session.captureMGR.startRecordToStorageFileAsync(Ensemble.Editor.VideoCaptureMGR.session.encodingProfile, Ensemble.Editor.VideoCaptureMGR.session.targetFiles.currentTarget).then(Ensemble.Editor.VideoCaptureMGR._listeners.webcamCaptureBegan);
                }, 200);
                
            },

            webcamCaptureSettingsButtonClicked: function (event) {
                Ensemble.Editor.VideoCaptureMGR.ui.webcamCaptureSettingsContextMenu.winControl.show(Ensemble.Editor.VideoCaptureMGR.ui.webcamCaptureSettingsButton, "auto");
            },

            webcamDeviceSelected: function (event) {
                let allButtons = $(Ensemble.Editor.VideoCaptureMGR.ui.webcamDeviceSelectContextMenu).find("button"),
                    buttonCount = allButtons.length;
                for (let i = 0; i < buttonCount; i++) {
                    allButtons[i].winControl.selected = false;
                }
                event.currentTarget.winControl.selected = true;
                Ensemble.Editor.VideoCaptureMGR.changeCameraPreviewDevice(Ensemble.Editor.VideoCaptureMGR.session.videoDevices.deviceList[event.currentTarget.dataset.webcamDeviceIndex]);
            },

            webcamQualitySelected: function (event) {
                let allButtons = $(Ensemble.Editor.VideoCaptureMGR.ui.webcamDeviceQualityContextMenu).find("button"),
                    buttonCount = allButtons.length;
                for (let i = 0; i < buttonCount; i++) {
                    allButtons[i].winControl.selected = false;
                }
                event.currentTarget.winControl.selected = true;
                //Ensemble.Editor.VideoCaptureMGR.session.captureMGR.videoDeviceController.setMediaStreamPropertiesAsync(Windows.Media.Capture.MediaStreamType.videoRecord, Ensemble.Editor.VideoCaptureMGR.session.videoDevices.captureProperties[event.currentTarget.dataset.webcamStreamIndex]);
                Ensemble.Editor.VideoCaptureMGR.changeCameraPreviewQuality(Ensemble.Editor.VideoCaptureMGR.session.videoDevices.captureProperties[event.currentTarget.dataset.webcamStreamIndex]);
            },

            micDeviceSelected: function (event) {
                let allButtons = $(Ensemble.Editor.VideoCaptureMGR.ui.micDeviceSelectContextMenu).find("button"),
                    buttonCount = allButtons.length;
                for (let i = 0; i < buttonCount; i++) {
                    allButtons[i].winControl.selected = false;
                }
                event.currentTarget.winControl.selected = true;
                Ensemble.Editor.VideoCaptureMGR.changeCameraPreviewDevice(null, Ensemble.Editor.VideoCaptureMGR.session.audioDevices.deviceList[event.currentTarget.dataset.micDeviceIndex]);
            },

            videoCaptureStartStopButtonClicked: function (event) {
                if (Ensemble.Editor.VideoCaptureMGR.session.recordingActive) {
                    // currently recording. stop recording and move temp file into the import list.
                    Ensemble.Editor.VideoCaptureMGR.session.recordingActive = false;
                    Ensemble.Editor.VideoCaptureMGR.ui.webcamCaptureStartStopButton.innerHTML = "&#9210;";
                    Ensemble.Editor.VideoCaptureMGR.ui.webcamCaptureSettingsButton.removeAttribute("disabled");
                    WinJS.Utilities.addClass(Ensemble.Editor.VideoCaptureMGR.ui.webcamCaptureLoadingIndicator, "media-capture-loading--visible");
                    Ensemble.Editor.VideoCaptureMGR.session.captureMGR.stopRecordAsync().then(function () {
                        Ensemble.Editor.VideoCaptureMGR.session.targetFiles.recordingStopTime = performance.now();

                        let rawFile = Ensemble.Editor.VideoCaptureMGR.session.targetFiles.currentTarget,
                            ensembleFile = Ensemble.FileIO._createFileFromSrc(rawFile),
                            newClip = new Ensemble.Editor.Clip(null),
                            importTime = Ensemble.Editor.VideoCaptureMGR.session.targetFiles.projectTimeAtStart,
                            importTrim = Math.floor(Ensemble.Editor.VideoCaptureMGR.session.targetFiles.recordingStartTime - Ensemble.Editor.VideoCaptureMGR.session.targetFiles.captureStartTime),
                            newTrackId = Ensemble.Editor.TimelineMGR.generateNewTrackId(),
                            trackCreateAction = new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.createTrack, {
                                trackId: newTrackId
                            });

                        newClip.file = {
                            path: ensembleFile.path,
                            token: ensembleFile.token
                        };
                        newClip.preExisting = false;
                        newClip.startTrim = importTrim;

                        let clipImportAction = new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.importClip,
                            {
                                clipId: newClip.id,
                                clipObj: newClip,
                                destinationTrack: newTrackId,
                                destinationTime: importTime
                            }
                        );

                        Ensemble.Editor.VideoCaptureMGR.session.targetFiles.currentTarget = null;
                        Ensemble.Editor.VideoCaptureMGR.session.targetFiles.projectTimeAtStart = null;
                        Ensemble.Editor.VideoCaptureMGR.session.targetFiles.captureStartTime = null;

                        Ensemble.Editor.VideoCaptureMGR.ui.webcamCapturePreview.pause();
                        Ensemble.Editor.VideoCaptureMGR.ui.webcamCapturePreview.src = "";
                        Ensemble.Editor.VideoCaptureMGR.displayRequest.requestRelease();

                        Ensemble.HistoryMGR.performBatch([trackCreateAction, clipImportAction], Ensemble.Editor.VideoCaptureMGR._listeners.webcamImportAllFinished);
                    });
                }
                else {
                    // not recording. start the recording stream and disable all buttons.
                    Ensemble.Editor.VideoCaptureMGR.ui.webcamCaptureStartStopButton.disabled = "disabled";
                    Ensemble.Editor.VideoCaptureMGR.ui.webcamCaptureSettingsButton.disabled = "disabled";
                    if (Ensemble.Editor.VideoCaptureMGR.ui.webcamKaraokeToggle.winControl.selected) Ensemble.Editor.PlaybackMGR.play(Ensemble.Editor.VideoCaptureMGR._listeners.webcamKaraokeStartCallback);
                    else Ensemble.Editor.VideoCaptureMGR._listeners.webcamKaraokeStartCallback();
                }
            },

            captureRecordLimitationExceeded: function (event) {
                console.error("Recording limitation exceeded: " + event);
            },

            captureFailed: function (event) {
                console.error("Media capture failed.");
            },

            webcamImportAllFinished: function (event) {
                console.info("Finished importing the captured clip.");
                Ensemble.Editor.VideoCaptureMGR.createVideoFile(null, Ensemble.Editor.VideoCaptureMGR._listeners.webcamFileCreated);
            },

            webcamKaraokeStartCallback: function () {
                Ensemble.Editor.VideoCaptureMGR.session.targetFiles.recordingStartTime = performance.now();
                Ensemble.Editor.VideoCaptureMGR.session.targetFiles.projectTimeAtStart = Ensemble.Editor.PlaybackMGR.lastTime;
                Ensemble.Editor.VideoCaptureMGR.session.recordingActive = true;
                Ensemble.Editor.VideoCaptureMGR.ui.webcamCaptureStartStopButton.innerHTML = "&#57691;";
                Ensemble.Editor.VideoCaptureMGR.ui.webcamCaptureStartStopButton.removeAttribute("disabled");
            }
        }
    });
})();