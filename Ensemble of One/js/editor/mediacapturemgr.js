(function () {
    WinJS.Namespace.define("Ensemble.Editor.MediaCaptureMGR", {
        /// <summary>Manages media capture devices and recording sessions.</summary>

        captureSession: {
            video: {
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
                    projectTimeAtStart: 0,
                    capturedFiles: []
                }
            },
            audio: {

            }
        },

        init: function () {
            this._refreshUI();

            this.captureSession.video.captureInitSettings = null;
            this.captureSession.video.captureMGR = null;
            this.captureSession.video.captureReady = false;
            this.captureSession.video.captureActive = false;
            this.captureSession.video.recordingActive = false;
            this.captureSession.video.encodingProfile = null;

            this.captureSession.video.videoDevices.deviceList = [];
            this.captureSession.video.videoDevices.captureProperties = [];
            this.captureSession.video.videoDevices.previewProperties = [];

            this.captureSession.video.audioDevices.deviceList = [];
            this.captureSession.video.audioDevices.properties = [];

            this.captureSession.video.previewActive = false;
            this.captureSession.video.previewMirroring = false;

            this.captureSession.video.targetFiles.currentTarget = [];
            this.captureSession.video.targetFiles.captureStartTime = null;
            this.captureSession.video.targetFiles.recordingStartTime = null;
            this.captureSession.video.targetFiles.projectTimeAtStart = null;
            this.captureSession.video.targetFiles.capturedFiles = [];
        },

        unload: function () {
            if (this.captureSession.video.previewActive) this.cancelVideoCaptureSession();
            this._cleanUI();
        },

        initVideoCaptureSession: function () {
            /// <summary>Enumerates media capture devices, sets up the video recording Popin, and initializes a video capture session.</summary>
            WinJS.Utilities.addClass(Ensemble.Editor.MediaCaptureMGR.ui.webcamCaptureLoadingIndicator, "media-capture-loading--visible");
            Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureInitSettings = new Windows.Media.Capture.MediaCaptureInitializationSettings();
            Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureInitSettings.audioDeviceId = "";
            Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureInitSettings.videoDeviceId = "";
            Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureInitSettings.streamingCaptureMode = Windows.Media.Capture.StreamingCaptureMode.audioAndVideo;
            Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureInitSettings.photoCaptureSource = Windows.Media.Capture.PhotoCaptureSource.videoPreview;
            Windows.Devices.Enumeration.DeviceInformation.findAllAsync(Windows.Devices.Enumeration.DeviceClass.videoCapture).then(function (videoDevices) {
                if (videoDevices.length > 0) {
                    Windows.Storage.ApplicationData.current.temporaryFolder.createFileAsync("recording.mp4", Windows.Storage.CreationCollisionOption.generateUniqueName).then(Ensemble.Editor.MediaCaptureMGR._listeners.webcamFileCreated);

                    Ensemble.Editor.MediaCaptureMGR.captureSession.video.videoDevices.deviceList = videoDevices;

                    let numOfVideoDevices = videoDevices.length,
                        webcamMenuCommands = [];
                    for (let i = 0; i < numOfVideoDevices; i++) {
                        let newItem = new WinJS.UI.MenuCommand(document.createElement("button"), { type: 'toggle', label: videoDevices[i].name, onclick: Ensemble.Editor.MediaCaptureMGR._listeners.webcamDeviceSelected });
                        newItem.element.dataset.webcamDeviceIndex = i;
                        webcamMenuCommands.push(newItem);
                    }
                    webcamMenuCommands[0].selected = true;
                    Ensemble.Editor.MediaCaptureMGR.ui.webcamDeviceSelectContextMenu.winControl.commands = webcamMenuCommands;

                    Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureInitSettings.videoDeviceId = videoDevices[0].id;

                    Windows.Devices.Enumeration.DeviceInformation.findAllAsync(Windows.Devices.Enumeration.DeviceClass.audioCapture).then(function (audioDevices) {
                        Ensemble.Editor.MediaCaptureMGR.captureSession.video.audioDevices.deviceList = audioDevices;

                        let numOfAudioDevices = audioDevices.length,
                            micMenuCommands = [];
                        for (let i = 0; i < numOfAudioDevices; i++) {
                            let newItem = new WinJS.UI.MenuCommand(document.createElement("button"), { type: 'toggle', label: audioDevices[i].name, onclick: Ensemble.Editor.MediaCaptureMGR._listeners.micDeviceSelected });
                            newItem.element.dataset.micDeviceIndex = i;
                            micMenuCommands.push(newItem);
                        }
                        micMenuCommands[0].selected = true;
                        Ensemble.Editor.MediaCaptureMGR.ui.micDeviceSelectContextMenu.winControl.commands = micMenuCommands;

                        if (numOfAudioDevices > 0) Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureInitSettings.audioDeviceId = audioDevices[0].id;
                                                
                        
                        Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR = new Windows.Media.Capture.MediaCapture();
                        Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.addEventListener("recordlimitationexceeded", Ensemble.Editor.MediaCaptureMGR._listeners.captureRecordLimitationExceeded);
                        Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.addEventListener("failed", Ensemble.Editor.MediaCaptureMGR._listeners.captureFailed);
                        Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.initializeAsync(Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureInitSettings).then(Ensemble.Editor.MediaCaptureMGR._listeners.webcamMediaCapturerInitialized);
                    });
                }
                else console.error("No video devices detected.");
            });
        },

        cancelVideoCaptureSession: function () {
            /// <summary>Cancels the current capture session. All video previews will be stopped and any pending recordings will be lost.</summary>
            this.ui.webcamCapturePreview.pause();
            this.ui.webcamCapturePreview.src = "";
            this.captureSession.video.previewActive = false;

            this.captureSession.video.captureMGR.close();

            this.captureSession.video.captureInitSettings = null;
            this.captureSession.video.captureMGR = null;
            this.captureSession.video.captureReady = false;
            this.captureSession.video.captureActive = false;
            this.captureSession.video.recordingActive = false;
            this.captureSession.video.encodingProfile = null;

            this.captureSession.video.videoDevices.deviceList = [];
            this.captureSession.video.videoDevices.captureProperties = [];
            this.captureSession.video.videoDevices.previewProperties = [];

            this.captureSession.video.audioDevices.deviceList = [];
            this.captureSession.video.audioDevices.properties = [];

            this.captureSession.video.previewActive = false;
            this.captureSession.video.previewMirroring = false;

            this.captureSession.video.targetFiles.currentTarget = [];
            this.captureSession.video.targetFiles.captureStartTime = null;
            this.captureSession.video.targetFiles.recordingStartTime = null;
            this.captureSession.video.targetFiles.projectTimeAtStart = null;
            this.captureSession.video.targetFiles.capturedFiles = [];
        },

        changeCameraPreviewDevice: function (videoDevice, audioDevice, force) {
            /// <summary>Switches the camera preview to the device with the given ID. Starts the preview if it's not already active. Fails if the capture session has not been initialized.</summary>
            /// <param name="videoDeviceId" type="String">The ID of the camera device to activate.</param>
            /// <param name="audioDeviceId" type="String">The ID of the microphone device to activate.</param>
            /// <param name="force" type="Boolean">If true, forces the video device to be started even if it's already the active device.</param>
            let videoDeviceId = videoDevice ? videoDevice.id : null,
                audioDeviceId = audioDevice ? audioDevice.id : null;
            if (force || Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.mediaCaptureSettings.videoDeviceId != videoDeviceId || Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.mediaCaptureSettings.audioDeviceId != audioDeviceId) {
                WinJS.Utilities.addClass(Ensemble.Editor.MediaCaptureMGR.ui.webcamCaptureLoadingIndicator, "media-capture-loading--visible");
                Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureReady = false;
                
                Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.stopRecordAsync().then(function () {
                    Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureActive = false;

                    Ensemble.Editor.MediaCaptureMGR.captureSession.video.targetFiles.currentTarget = null;
                    Windows.Storage.ApplicationData.current.temporaryFolder.createFileAsync("recording.mp4", Windows.Storage.CreationCollisionOption.generateUniqueName).then(Ensemble.Editor.MediaCaptureMGR._listeners.webcamFileCreated);

                    Ensemble.Editor.MediaCaptureMGR.ui.webcamCapturePreview.pause();
                    Ensemble.Editor.MediaCaptureMGR.ui.webcamCapturePreview.src = "";

                    let tempInitCaptureSettings = new Windows.Media.Capture.MediaCaptureInitializationSettings();
                    tempInitCaptureSettings.audioDeviceId = (audioDeviceId && Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.mediaCaptureSettings.audioDeviceId != audioDeviceId) ? audioDeviceId : Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureInitSettings.audioDeviceId;
                    tempInitCaptureSettings.videoDeviceId = (videoDeviceId && Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.mediaCaptureSettings.videoDeviceId != videoDeviceId) ? videoDeviceId : Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureInitSettings.videoDeviceId;
                    tempInitCaptureSettings.streamingCaptureMode = Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureInitSettings.streamingCaptureMode;
                    tempInitCaptureSettings.photoCaptureSource = Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureInitSettings.photoCaptureSource;
                    Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureInitSettings = tempInitCaptureSettings;

                    if (videoDevice) {
                        if (videoDevice.enclosureLocation.panel == Windows.Devices.Enumeration.Panel.front) Ensemble.Editor.MediaCaptureMGR.captureSession.video.previewMirroring = true;
                        else Ensemble.Editor.MediaCaptureMGR.captureSession.video.previewMirroring = false;
                    }

                    Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.close();
                    Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR = new Windows.Media.Capture.MediaCapture();
                    Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.addEventListener("recordlimitationexceeded", Ensemble.Editor.MediaCaptureMGR._listeners.captureRecordLimitationExceeded);
                    Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.addEventListener("failed", Ensemble.Editor.MediaCaptureMGR._listeners.captureFailed);
                    Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.initializeAsync(Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureInitSettings).then(Ensemble.Editor.MediaCaptureMGR._listeners.webcamMediaCapturerInitialized);
                });
            }
        },

        changeCameraPreviewQuality: function (videoQuality, force) {
            if (force || videoQuality != null) {
                WinJS.Utilities.addClass(Ensemble.Editor.MediaCaptureMGR.ui.webcamCaptureLoadingIndicator, "media-capture-loading--visible");
                Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureReady = false;
                Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.stopRecordAsync().then(function () {
                    Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureActive = false;
                    Ensemble.Editor.MediaCaptureMGR.captureSession.video.targetFiles.currentTarget = null;
                    Windows.Storage.ApplicationData.current.temporaryFolder.createFileAsync("recording.mp4", Windows.Storage.CreationCollisionOption.generateUniqueName).then(function (resultFile) {
                        Ensemble.Editor.MediaCaptureMGR.captureSession.video.targetFiles.currentTarget = resultFile;
                        if (videoQuality != null) {
                            Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.videoDeviceController.setMediaStreamPropertiesAsync(Windows.Media.Capture.MediaStreamType.videoRecord, videoQuality).then(function () {
                                let previewQuality = Ensemble.Editor.MediaCaptureMGR.matchPreviewToCaptureQuality(videoQuality, Ensemble.Editor.MediaCaptureMGR.captureSession.video.videoDevices.previewProperties);
                                Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.videoDeviceController.setMediaStreamPropertiesAsync(Windows.Media.Capture.MediaStreamType.videoPreview, previewQuality).done(
                                    Ensemble.Editor.MediaCaptureMGR._listeners.webcamCaptureQualityChanged
                                );
                            });
                        }
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
            let captureResolutions = Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.videoDeviceController.getAvailableMediaStreamProperties(Windows.Media.Capture.MediaStreamType.videoRecord),
                previewResolutions = Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.videoDeviceController.getAvailableMediaStreamProperties(Windows.Media.Capture.MediaStreamType.videoPreview),
                resCount = captureResolutions.length,
                prunedCaptureResolutions = Ensemble.Editor.MediaCaptureMGR.pruneDuplicateVideoQualities(captureResolutions),
                prunedResLen = prunedCaptureResolutions.length,
                prunedPreviewResolutions = Ensemble.Editor.MediaCaptureMGR.pruneDuplicateVideoQualities(previewResolutions),
                prunedPreviewResLen = prunedPreviewResolutions.length,
                menuItems = [];

            // retrieve saved quality setting, or default to the highest available capture quality
            let retrievedQuality = Ensemble.Settings.retrieveSetting("last-used-camera-quality"),
                selectedQuality = null;
            try {
                retrievedQuality = JSON.parse(retrievedQuality);
                selectedQuality = Ensemble.Editor.MediaCaptureMGR.matchVideoQuality(retrievedQuality.width, retrievedQuality.height, retrievedQuality.frameRate.numerator, retrievedQuality.frameRate.denominator, captureResolutions);
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
                    newItem = new WinJS.UI.MenuCommand(document.createElement("button"), { type: 'toggle', label: resString, onclick: Ensemble.Editor.MediaCaptureMGR._listeners.webcamQualitySelected });
                newItem.element.dataset.webcamStreamIndex = i;
                menuItems.push(newItem);
                if (Ensemble.Editor.MediaCaptureMGR.webcamStreamPropertiesEqual(selectedQuality, prunedCaptureResolutions[i])) menuItems[menuItems.length - 1].selected = true;
            }
            Ensemble.Editor.MediaCaptureMGR.ui.webcamDeviceQualityContextMenu.winControl.commands = menuItems;

            // select a preview quality that matches the capture aspect ratio. try to match (but not exceed) the selected capture resolution.
            let selectedPreview = Ensemble.Editor.MediaCaptureMGR.matchPreviewToCaptureQuality(selectedQuality, prunedPreviewResolutions);

            // store the list of retrieved capture quality settings so we don't have to enumerate it again as long as the same camera remains active
            Ensemble.Editor.MediaCaptureMGR.captureSession.video.videoDevices.captureProperties = prunedCaptureResolutions;
            Ensemble.Editor.MediaCaptureMGR.captureSession.video.videoDevices.previewProperties = prunedPreviewResolutions;

            // finally, set the device's capture and preview qualities to match the selected values
            Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.videoDeviceController.setMediaStreamPropertiesAsync(Windows.Media.Capture.MediaStreamType.videoRecord, selectedQuality).then(function () {
                Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.videoDeviceController.setMediaStreamPropertiesAsync(Windows.Media.Capture.MediaStreamType.videoPreview, selectedPreview).done(
                    Ensemble.Editor.MediaCaptureMGR._listeners.webcamAutosetQuality
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

        ui: {
            webcamCapturePreview: null,
            webcamCaptureSettingsButton: null,
            webcamCaptureSettingsContextMenu: null,
            webcamDeviceQualityContextMenu: null,
            webcamDeviceSelectContextMenu: null,
            micDeviceSelectContextMenu: null,
            webcamCaptureLoadingIndicator: null,
            webcamCaptureStartStopButton: null,
            webcamCaptureListButton: null,
            webcamCaptureImportDialog: null,
            webcamHideCaptureListButton: null,
            webcamImportListview: null
        },

        _refreshUI: function () {
            this.ui.webcamCapturePreview = document.getElementsByClassName("media-capture-preview--webcam")[0];
            this.ui.webcamCaptureSettingsButton = document.getElementsByClassName("eo1-btn--webcam-capture-settings")[0];
            this.ui.webcamCaptureSettingsContextMenu = document.getElementsByClassName("contextmenu--webcam-popin-options")[0];
            this.ui.webcamDeviceQualityContextMenu = document.getElementsByClassName("contextmenu--webcam-device-quality")[0];
            this.ui.webcamDeviceSelectContextMenu = document.getElementsByClassName("contextmenu--webcam-device-select")[0];
            this.ui.micDeviceSelectContextMenu = document.getElementsByClassName("contextmenu--mic-device-select")[0];
            this.ui.webcamCaptureLoadingIndicator = document.getElementsByClassName("media-capture-loading--webcam")[0];
            this.ui.webcamCaptureStartStopButton = document.getElementsByClassName("eo1-btn--webcam-capture-startstop")[0];
            this.ui.webcamCaptureListButton = document.getElementsByClassName("eo1-btn--show-webcam-capture-list")[0];
            this.ui.webcamCaptureImportDialog = document.getElementsByClassName("media-capture-import-dialog--webcam")[0];
            this.ui.webcamHideCaptureListButton = document.getElementsByClassName("eo1-btn--hide-webcam-capture-list")[0];
            this.ui.webcamImportListview = document.getElementsByClassName("media-capture-import-dialog__listview--webcam")[0];

            this.ui.webcamCapturePreview.addEventListener("playing", Ensemble.Editor.MediaCaptureMGR._listeners.mediaPreviewBegan);
            this.ui.webcamCaptureSettingsButton.addEventListener("click", Ensemble.Editor.MediaCaptureMGR._listeners.webcamCaptureSettingsButtonClicked);
            this.ui.webcamCaptureStartStopButton.addEventListener("click", Ensemble.Editor.MediaCaptureMGR._listeners.videoCaptureStartStopButtonClicked);
            this.ui.webcamCaptureListButton.addEventListener("click", Ensemble.Editor.MediaCaptureMGR._listeners.webcamCaptureListButtonClicked);
            this.ui.webcamHideCaptureListButton.addEventListener("click", Ensemble.Editor.MediaCaptureMGR._listeners.webcamHideCaptureListButtonClicked);
        },

        _cleanUI: function () {
            this.ui.webcamCapturePreview.removeEventListener("playing", Ensemble.Editor.MediaCaptureMGR._listeners.mediaPreviewBegan);
            this.ui.webcamCaptureSettingsButton.removeEventListener("click", Ensemble.Editor.MediaCaptureMGR._listeners.webcamCaptureSettingsButtonClicked);
            this.ui.webcamCaptureStartStopButton.removeEventListener("click", Ensemble.Editor.MediaCaptureMGR._listeners.videoCaptureStartStopButtonClicked);
            this.ui.webcamCaptureListButton.removeEventListener("click", Ensemble.Editor.MediaCaptureMGR._listeners.webcamCaptureListButtonClicked);
            this.ui.webcamHideCaptureListButton.removeEventListener("click", Ensemble.Editor.MediaCaptureMGR._listeners.webcamHideCaptureListButtonClicked);

            this.ui.webcamCapturePreview = null;
            this.ui.webcamCaptureSettingsButton = null;
            this.ui.webcamCaptureSettingsContextMenu = null;
            this.ui.webcamDeviceQualityContextMenu = null;
            this.ui.webcamDeviceSelectContextMenu = null;
            this.ui.micDeviceSelectContextMenu = null;
            this.ui.webcamCaptureLoadingIndicator = null;
            this.ui.webcamCaptureStartStopButton = null;
            this.ui.webcamCaptureListButton = null;
            this.ui.webcamCaptureImportDialog = null;
            this.ui.webcamHideCaptureListButton = null;
            this.ui.webcamImportListview = null;
        },

        _listeners: {
            webcamMediaCapturerInitialized: function (success) {
                Ensemble.Editor.MediaCaptureMGR.captureSession.video.encodingProfile = Windows.Media.MediaProperties.MediaEncodingProfile.createMp4(Windows.Media.MediaProperties.VideoEncodingQuality.auto);
                Ensemble.Editor.MediaCaptureMGR.refreshWebcamDeviceQualityContextMenu();
            },

            webcamFileCreated: function (file) {
                console.log("Created file for recording session.");
                Ensemble.Editor.MediaCaptureMGR.captureSession.video.targetFiles.currentTarget = file;
                Ensemble.Editor.MediaCaptureMGR._listeners.webcamInitializationCaptureCheck();
            },

            webcamAutosetQuality: function () {
                Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureReady = true;
                Ensemble.Editor.MediaCaptureMGR._listeners.webcamInitializationCaptureCheck();
            },

            webcamInitializationCaptureCheck: function () {
                /// <summary>Checks if both the media capture manager and the target file have been initialized and starts the camera preview if they have.</summary>
                if (Ensemble.Editor.MediaCaptureMGR.captureSession.video.targetFiles.currentTarget != null && Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureReady) {

                    if (Ensemble.Editor.MediaCaptureMGR.captureSession.video.previewMirroring) WinJS.Utilities.addClass(Ensemble.Editor.MediaCaptureMGR.ui.webcamCapturePreview, "media-capture-preview--mirrored");
                    else WinJS.Utilities.removeClass(Ensemble.Editor.MediaCaptureMGR.ui.webcamCapturePreview, "media-capture-preview--mirrored");

                    let captureUrl = URL.createObjectURL(Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR);
                    Ensemble.Editor.MediaCaptureMGR.ui.webcamCapturePreview.src = captureUrl;
                    Ensemble.Editor.MediaCaptureMGR.ui.webcamCapturePreview.play();
                    // wait for media preview to begin before attempting to start capture
                }
            },

            webcamCaptureBegan: function (status) {
                Ensemble.Editor.MediaCaptureMGR.captureSession.video.targetFiles.captureStartTime = performance.now();
                Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureActive = true;
                WinJS.Utilities.removeClass(Ensemble.Editor.MediaCaptureMGR.ui.webcamCaptureLoadingIndicator, "media-capture-loading--visible");
                console.log("Started media capture.");
            },

            webcamCaptureQualityChanged: function () {
                Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureReady = true;
                Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.startRecordToStorageFileAsync(Ensemble.Editor.MediaCaptureMGR.captureSession.video.encodingProfile, Ensemble.Editor.MediaCaptureMGR.captureSession.video.targetFiles.currentTarget).then(Ensemble.Editor.MediaCaptureMGR._listeners.webcamCaptureBegan);
            },

            mediaPreviewBegan: function (event) {
                console.log("Started media preview.");
                Ensemble.Editor.MediaCaptureMGR.captureSession.video.previewActive = true;
                Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.startRecordToStorageFileAsync(Ensemble.Editor.MediaCaptureMGR.captureSession.video.encodingProfile, Ensemble.Editor.MediaCaptureMGR.captureSession.video.targetFiles.currentTarget).then(Ensemble.Editor.MediaCaptureMGR._listeners.webcamCaptureBegan);
            },

            webcamCaptureSettingsButtonClicked: function (event) {
                Ensemble.Editor.MediaCaptureMGR.ui.webcamCaptureSettingsContextMenu.winControl.show(Ensemble.Editor.MediaCaptureMGR.ui.webcamCaptureSettingsButton, "auto");
            },

            webcamDeviceSelected: function (event) {
                let allButtons = $(Ensemble.Editor.MediaCaptureMGR.ui.webcamDeviceSelectContextMenu).find("button"),
                    buttonCount = allButtons.length;
                for (let i = 0; i < buttonCount; i++) {
                    allButtons[i].winControl.selected = false;
                }
                event.currentTarget.winControl.selected = true;
                Ensemble.Editor.MediaCaptureMGR.changeCameraPreviewDevice(Ensemble.Editor.MediaCaptureMGR.captureSession.video.videoDevices.deviceList[event.currentTarget.dataset.webcamDeviceIndex]);
            },

            webcamQualitySelected: function (event) {
                let allButtons = $(Ensemble.Editor.MediaCaptureMGR.ui.webcamDeviceQualityContextMenu).find("button"),
                    buttonCount = allButtons.length;
                for (let i = 0; i < buttonCount; i++) {
                    allButtons[i].winControl.selected = false;
                }
                event.currentTarget.winControl.selected = true;
                //Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.videoDeviceController.setMediaStreamPropertiesAsync(Windows.Media.Capture.MediaStreamType.videoRecord, Ensemble.Editor.MediaCaptureMGR.captureSession.video.videoDevices.captureProperties[event.currentTarget.dataset.webcamStreamIndex]);
                Ensemble.Editor.MediaCaptureMGR.changeCameraPreviewQuality(Ensemble.Editor.MediaCaptureMGR.captureSession.video.videoDevices.captureProperties[event.currentTarget.dataset.webcamStreamIndex]);
            },

            micDeviceSelected: function (event) {
                let allButtons = $(Ensemble.Editor.MediaCaptureMGR.ui.micDeviceSelectContextMenu).find("button"),
                    buttonCount = allButtons.length;
                for (let i = 0; i < buttonCount; i++) {
                    allButtons[i].winControl.selected = false;
                }
                event.currentTarget.winControl.selected = true;
                Ensemble.Editor.MediaCaptureMGR.changeCameraPreviewDevice(null, Ensemble.Editor.MediaCaptureMGR.captureSession.video.audioDevices.deviceList[event.currentTarget.dataset.micDeviceIndex]);
            },

            videoCaptureStartStopButtonClicked: function (event) {
                console.info("Starting webcam capture...");
                if (Ensemble.Editor.MediaCaptureMGR.captureSession.video.recordingActive) {
                    // currently recording. stop recording and move temp file into the import list.
                    Ensemble.Editor.MediaCaptureMGR.captureSession.video.recordingActive = false;
                    Ensemble.Editor.MediaCaptureMGR.ui.webcamCaptureStartStopButton.innerHTML = "&#9210;";
                    Ensemble.Editor.MediaCaptureMGR.ui.webcamCaptureSettingsButton.removeAttribute("disabled");
                    Ensemble.Editor.MediaCaptureMGR.ui.webcamCaptureListButton.removeAttribute("disabled");
                    WinJS.Utilities.addClass(Ensemble.Editor.MediaCaptureMGR.ui.webcamCaptureLoadingIndicator, "media-capture-loading--visible");
                    Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.stopRecordAsync().then(function () {
                        Ensemble.Editor.MediaCaptureMGR.captureSession.video.targetFiles.capturedFiles.push({
                            file: Ensemble.Editor.MediaCaptureMGR.captureSession.video.targetFiles.currentTarget,
                            projectTime: Ensemble.Editor.MediaCaptureMGR.captureSession.video.targetFiles.projectTimeAtStart,
                            startTrim: Ensemble.Editor.MediaCaptureMGR.captureSession.video.targetFiles.recordingStartTime - Ensemble.Editor.MediaCaptureMGR.captureSession.video.targetFiles.captureStartTime
                        });
                        Ensemble.Editor.MediaCaptureMGR.captureSession.video.targetFiles.currentTarget = null;
                        Ensemble.Editor.MediaCaptureMGR.captureSession.video.targetFiles.projectTimeAtStart = null;
                        Ensemble.Editor.MediaCaptureMGR.captureSession.video.targetFiles.captureStartTime = null;

                        // init a new capture session
                        Ensemble.Editor.MediaCaptureMGR.ui.webcamCapturePreview.pause();
                        Ensemble.Editor.MediaCaptureMGR.ui.webcamCapturePreview.src = "";
                        Windows.Storage.ApplicationData.current.temporaryFolder.createFileAsync("recording.mp4", Windows.Storage.CreationCollisionOption.generateUniqueName).then(Ensemble.Editor.MediaCaptureMGR._listeners.webcamFileCreated);
                    });
                }
                else {
                    // not recording. start the recording stream and disable all buttons.
                    Ensemble.Editor.MediaCaptureMGR.captureSession.video.targetFiles.recordingStartTime = performance.now();
                    Ensemble.Editor.MediaCaptureMGR.captureSession.video.targetFiles.projectTimeAtStart = Ensemble.Editor.PlaybackMGR.lastTime;
                    Ensemble.Editor.MediaCaptureMGR.captureSession.video.recordingActive = true;
                    Ensemble.Editor.MediaCaptureMGR.ui.webcamCaptureStartStopButton.innerHTML = "&#57691;";
                    Ensemble.Editor.MediaCaptureMGR.ui.webcamCaptureSettingsButton.disabled = "disabled";
                    Ensemble.Editor.MediaCaptureMGR.ui.webcamCaptureListButton.disabled = "disabled";
                }
                // todo: add cases for karaoke recording (where capture is already technicaly running)
            },

            captureRecordLimitationExceeded: function (event) {
                console.error("Recording limitation exceeded: " + event);
            },

            captureFailed: function (event) {
                console.error("Media capture failed.");
            },

            webcamCaptureListButtonClicked: function (event) {
                console.log("Showing webcam capture list.");
                let observableList = [],
                    fileCount = Ensemble.Editor.MediaCaptureMGR.captureSession.video.targetFiles.capturedFiles.length;
                for (let i = 0; i < fileCount; i++) {
                    observableList.push({
                        title: Ensemble.Editor.MediaCaptureMGR.captureSession.video.targetFiles.capturedFiles[i].file.displayName
                    });
                }

                let importList = new WinJS.Binding.List(observableList);
                Ensemble.Editor.MediaCaptureMGR.ui.webcamImportListview.winControl.itemDataSource = importList.dataSource;

                WinJS.Utilities.addClass(Ensemble.Editor.MediaCaptureMGR.ui.webcamCaptureImportDialog, "media-capture-import-dialog--visible");
            },

            webcamHideCaptureListButtonClicked: function (event) {
                console.log("Hiding webcam capture list.");
                WinJS.Utilities.removeClass(Ensemble.Editor.MediaCaptureMGR.ui.webcamCaptureImportDialog, "media-capture-import-dialog--visible");
            }
        }
    });
})();