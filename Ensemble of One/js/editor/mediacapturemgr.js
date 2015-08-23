(function () {
    WinJS.Namespace.define("Ensemble.Editor.MediaCaptureMGR", {
        /// <summary>Manages media capture devices and recording sessions.</summary>

        captureSession: {
            video: {
                captureInitSettings: new Windows.Media.Capture.MediaCaptureInitializationSettings(),
                captureMGR: new Windows.Media.Capture.MediaCapture(),
                captureReady: false,
                captureActive: false,
                encodingProfile: Windows.Media.MediaProperties.MediaEncodingProfile.createMp4(Windows.Media.MediaProperties.VideoEncodingQuality.hd720p),
                videoDevices: {
                    deviceList: [],
                    properties: []
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
            this.captureSession.video.encodingProfile = null;

            this.captureSession.video.videoDevices.deviceList = [];
            this.captureSession.video.videoDevices.properties = [];

            this.captureSession.video.audioDevices.deviceList = [];
            this.captureSession.video.audioDevices.properties = [];

            this.captureSession.video.previewActive = false;
            this.captureSession.video.previewMirroring = false;

            this.captureSession.video.targetFiles.currentTarget = [];
            this.captureSession.video.targetFiles.captureStartTime = null;
            this.captureSession.video.targetFiles.recordingStartTime = null;
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
                        Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.initializeAsync(Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureInitSettings).then(Ensemble.Editor.MediaCaptureMGR._listeners.webcamMediaCapturerInitialized);
                    });
                }
                else console.error("No video devices detected.");
            });
        },

        cancelVideoCaptureSession: function () {
            /// <summary>Cancels the current capture session. All video previews will be stopped and any pending recordings will be lost.</summary>
            this.ui.videoCaptureElement.pause();
            this.ui.videoCaptureElement.src = "";
            this.captureSession.video.previewActive = false;

            this.captureSession.video.captureMGR.close();

            this.captureSession.video.captureInitSettings = null;
            this.captureSession.video.captureMGR = null;
            this.captureSession.video.captureReady = false;
            this.captureSession.video.captureActive = false;
            this.captureSession.video.encodingProfile = null;

            this.captureSession.video.videoDevices.deviceList = [];
            this.captureSession.video.videoDevices.properties = [];

            this.captureSession.video.audioDevices.deviceList = [];
            this.captureSession.video.audioDevices.properties = [];

            this.captureSession.video.previewActive = false;
            this.captureSession.video.previewMirroring = false;

            this.captureSession.video.targetFiles.currentTarget = [];
            this.captureSession.video.targetFiles.captureStartTime = null;
            this.captureSession.video.targetFiles.recordingStartTime = null;
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
                Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureReady = false;

                Ensemble.Editor.MediaCaptureMGR.ui.videoCaptureElement.pause();
                Ensemble.Editor.MediaCaptureMGR.ui.videoCaptureElement.src = "";

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
                Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.initializeAsync(Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureInitSettings).then(Ensemble.Editor.MediaCaptureMGR._listeners.webcamMediaCapturerInitialized);
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
            let currentResolution = Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.videoDeviceController.getMediaStreamProperties(Windows.Media.Capture.MediaStreamType.videoRecord),
                    allResolutions = Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.videoDeviceController.getAvailableMediaStreamProperties(Windows.Media.Capture.MediaStreamType.videoRecord),
                    resCount = allResolutions.length,
                    menuItems = [];
            for (let i = 0; i < resCount; i++) {
                // add an item to the flyout
                let resString = allResolutions[i].width + "x" + allResolutions[i].height + "@" + Ensemble.Utilities.TimeConverter.convertFPS(allResolutions[i].frameRate.numerator, allResolutions[i].frameRate.denominator) + "fps, " + (allResolutions[i].bitrate * 0.000001) + "Mbps",
                    newItem = new WinJS.UI.MenuCommand(document.createElement("button"), { type: 'toggle', label: resString, onclick: Ensemble.Editor.MediaCaptureMGR._listeners.webcamQualitySelected });
                newItem.element.dataset.webcamStreamIndex = i;
                menuItems.push(newItem);
                if (Ensemble.Editor.MediaCaptureMGR.webcamStreamPropertiesEqual(currentResolution, allResolutions[i])) menuItems[menuItems.length - 1].selected = true;
            }
            Ensemble.Editor.MediaCaptureMGR.ui.webcamDeviceQualityContextMenu.winControl.commands = menuItems;
            Ensemble.Editor.MediaCaptureMGR.captureSession.video.videoDevices.properties = allResolutions;
        },

        refreshMicDeviceQualityContextMenu: function () {
            let currentQuality = Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.audioDeviceController.getMediaStreamProperties(Windows.Media.Capture.MediaStreamType.audio),
                    allQualities = [currentQuality],
                    qualityCount = allQualities.length,
                    menuItems = [];
            for (let i = 0; i < qualityCount; i++) {
                // add an item to the flyout
                let resString = +(allQualities[i].sampleRate * 0.001) + "kHz, " + allQualities[i].channelCount + " channels, " + (allQualities[i].bitrate * 0.001) + "Kbps",
                    newItem = new WinJS.UI.MenuCommand(document.createElement("button"), { type: 'toggle', label: resString, onclick: Ensemble.Editor.MediaCaptureMGR._listeners.micQualitySelected });
                newItem.element.dataset.micStreamIndex = i;
                menuItems.push(newItem);
                if (Ensemble.Editor.MediaCaptureMGR.micStreamPropertiesEqual(currentQuality, allQualities[i])) menuItems[menuItems.length - 1].selected = true;
            }
            Ensemble.Editor.MediaCaptureMGR.ui.micDeviceQualityContextMenu.winControl.commands = menuItems;
            Ensemble.Editor.MediaCaptureMGR.captureSession.video.audioDevices.properties = allQualities;
        },

        ui: {
            videoCaptureElement: null,
            videoCaptureSettingsButton: null,
            videoCaptureSettingsContextMenu: null,
            webcamDeviceQualityContextMenu: null,
            webcamDeviceSelectContextMenu: null,
            micDeviceQualityContextMenu: null,
            micDeviceSelectContextMenu: null,
            webcamCaptureLoadingIndicator: null
        },

        _refreshUI: function () {
            this.ui.videoCaptureElement = document.getElementsByClassName("media-capture-preview--webcam")[0];
            this.ui.videoCaptureSettingsButton = document.getElementsByClassName("eo1-btn--webcam-capture-settings")[0];
            this.ui.videoCaptureSettingsContextMenu = document.getElementsByClassName("contextmenu--webcam-popin-options")[0];
            this.ui.webcamDeviceQualityContextMenu = document.getElementsByClassName("contextmenu--webcam-device-quality")[0];
            this.ui.webcamDeviceSelectContextMenu = document.getElementsByClassName("contextmenu--webcam-device-select")[0];
            this.ui.micDeviceQualityContextMenu = document.getElementsByClassName("contextmenu--mic-device-quality")[0];
            this.ui.micDeviceSelectContextMenu = document.getElementsByClassName("contextmenu--mic-device-select")[0];
            this.ui.webcamCaptureLoadingIndicator = document.getElementsByClassName("media-capture-loading--webcam")[0];
            this.ui.webcamCaptureStartStopButton = document.getElementsByClassName("eo1-btn--webcam-capture-startstop")[0];

            this.ui.videoCaptureElement.addEventListener("playing", Ensemble.Editor.MediaCaptureMGR._listeners.mediaPreviewBegan);
            this.ui.videoCaptureSettingsButton.addEventListener("click", Ensemble.Editor.MediaCaptureMGR._listeners.videoCaptureSettingsButtonClicked);
            this.ui.webcamCaptureStartStopButton.addEventListener("click", Ensemble.Editor.MediaCaptureMGR._listeners.videoCaptureStartStopButtonClicked);
        },

        _cleanUI: function () {
            this.ui.videoCaptureElement.removeEventListener("playing", Ensemble.Editor.MediaCaptureMGR._listeners.mediaPreviewBegan);
            this.ui.videoCaptureSettingsButton.removeEventListener("click", Ensemble.Editor.MediaCaptureMGR._listeners.videoCaptureSettingsButtonClicked);
            this.ui.webcamCaptureStartStopButton.removeEventListener("click", Ensemble.Editor.MediaCaptureMGR._listeners.videoCaptureStartStopButtonClicked);

            this.ui.videoCaptureElement = null;
            this.ui.videoCaptureSettingsButton = null;
            this.ui.videoCaptureSettingsContextMenu = null;
            this.ui.webcamDeviceQualityContextMenu = null;
            this.ui.webcamDeviceSelectContextMenu = null;
            this.ui.micDeviceQualityContextMenu = null;
            this.ui.micDeviceSelectContextMenu = null;
            this.ui.webcamCaptureLoadingIndicator = null;
            this.ui.webcamCaptureStartStopButton = null;
        },

        _listeners: {
            webcamMediaCapturerInitialized: function (success) {
                Ensemble.Editor.MediaCaptureMGR.refreshWebcamDeviceQualityContextMenu();
                Ensemble.Editor.MediaCaptureMGR.refreshMicDeviceQualityContextMenu();

                Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureReady = true;
                Ensemble.Editor.MediaCaptureMGR.captureSession.video.encodingProfile = Windows.Media.MediaProperties.MediaEncodingProfile.createMp4(Windows.Media.MediaProperties.VideoEncodingQuality.auto);
                Ensemble.Editor.MediaCaptureMGR._listeners.webcamInitializationCaptureCheck();
            },

            webcamFileCreated: function (file) {
                console.log("Created file for recording session.");
                Ensemble.Editor.MediaCaptureMGR.captureSession.video.targetFiles.currentTarget = file;
                Ensemble.Editor.MediaCaptureMGR._listeners.webcamInitializationCaptureCheck();
            },

            webcamInitializationCaptureCheck: function () {
                /// <summary>Checks if both the media capture manager and the target file have been initialized and starts the camera preview if they have.</summary>
                if (Ensemble.Editor.MediaCaptureMGR.captureSession.video.targetFiles.currentTarget != null && Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureReady) {
                    if (Ensemble.Editor.MediaCaptureMGR.captureSession.video.previewMirroring) WinJS.Utilities.addClass(Ensemble.Editor.MediaCaptureMGR.ui.videoCaptureElement, "media-capture-preview--mirrored");
                    else WinJS.Utilities.removeClass(Ensemble.Editor.MediaCaptureMGR.ui.videoCaptureElement, "media-capture-preview--mirrored");

                    let captureUrl = URL.createObjectURL(Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR);
                    Ensemble.Editor.MediaCaptureMGR.ui.videoCaptureElement.src = captureUrl;
                    Ensemble.Editor.MediaCaptureMGR.ui.videoCaptureElement.play();
                    WinJS.Utilities.removeClass(Ensemble.Editor.MediaCaptureMGR.ui.webcamCaptureLoadingIndicator, "media-capture-loading--visible");

                    Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.startRecordToStorageFileAsync(Ensemble.Editor.MediaCaptureMGR.captureSession.video.encodingProfile, Ensemble.Editor.MediaCaptureMGR.captureSession.video.targetFiles.currentTarget).then(Ensemble.Editor.MediaCaptureMGR._listeners.webcamCaptureBegan);
                }
            },

            webcamCaptureBegan: function (status) {
                Ensemble.Editor.MediaCaptureMGR.captureSession.video.targetFiles.captureStartTime = performance.now();
                Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureActive = true;
                console.log("Started media capture.");
            },

            mediaPreviewBegan: function (event) {
                Ensemble.Editor.MediaCaptureMGR.captureSession.video.previewActive = true;
            },

            videoCaptureSettingsButtonClicked: function (event) {
                Ensemble.Editor.MediaCaptureMGR.ui.videoCaptureSettingsContextMenu.winControl.show(Ensemble.Editor.MediaCaptureMGR.ui.videoCaptureSettingsButton, "auto");
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
                Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.videoDeviceController.setMediaStreamPropertiesAsync(Windows.Media.Capture.MediaStreamType.videoRecord, Ensemble.Editor.MediaCaptureMGR.captureSession.video.videoDevices.properties[event.currentTarget.dataset.webcamStreamIndex]);
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

            micQualitySelected: function (event) {
                let allButtons = $(Ensemble.Editor.MediaCaptureMGR.ui.micDeviceQualityContextMenu).find("button"),
                    buttonCount = allButtons.length;
                for (let i = 0; i < buttonCount; i++) {
                    allButtons[i].winControl.selected = false;
                }
                event.currentTarget.winControl.selected = true;
                try {
                    Ensemble.Editor.MediaCaptureMGR.captureSession.video.captureMGR.audioDeviceController.setMediaStreamPropertiesAsync(Windows.Media.Capture.MediaStreamType.audio, Ensemble.Editor.MediaCaptureMGR.captureSession.video.audioDevices.properties[event.currentTarget.dataset.micStreamIndex]);
                }
                catch (exception) {
                    console.error("Unable to change microphone quality setting.");
                }
            },

            videoCaptureStartStopButtonClicked: function (event) {
                console.info("Starting webcam capture...");
                // todo: add cases for karaoke recording (where capture is already technicaly running)
            }
        }
    });
})();