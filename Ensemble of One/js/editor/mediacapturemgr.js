(function () {
    WinJS.Namespace.define("Ensemble.Editor.MediaCaptureMGR", {
        /// <summary>Manages media capture devices and recording sessions.</summary>
        _videoCaptureInitSettings: null,
        _videoCaptureDevices: null,
        _audioCaptureDevices: null,
        _videoCapturer: null,
        _previewActive: false,

        init: function () {
            this._refreshUI();
            this._videoCaptureDevices = [];
            this._audioCaptureDevices = [];
            this._previewActive = false;
        },

        unload: function () {
            if (this._previewActive) this.cancelVideoCaptureSession();
            this._cleanUI();

            this._videoCaptureInitSettings = null;
            this._videoCaptureDevices = null;
            this._audioCaptureDevices = null;
            this._videoCapturer = null;
            this._previewActive = false;
        },

        initVideoCaptureSession: function () {
            /// <summary>Enumerates media capture devices, sets up the video recording Popin, and initializes a video capture session.</summary>
            this._videoCaptureInitSettings = new Windows.Media.Capture.MediaCaptureInitializationSettings();
            this._videoCaptureInitSettings.audioDeviceId = "";
            this._videoCaptureInitSettings.videoDeviceId = "";
            this._videoCaptureInitSettings.streamingCaptureMode = Windows.Media.Capture.StreamingCaptureMode.audioAndVideo;
            this._videoCaptureInitSettings.photoCaptureSource = Windows.Media.Capture.PhotoCaptureSource.videoPreview;
            Windows.Devices.Enumeration.DeviceInformation.findAllAsync(Windows.Devices.Enumeration.DeviceClass.videoCapture).then(function (videoDevices) {
                if (videoDevices.length > 0) {
                    Ensemble.Editor.MediaCaptureMGR._videoCaptureDevices = videoDevices;

                    Ensemble.Editor.MediaCaptureMGR.ui.webcamCaptureDeviceSelect.innerHTML = "";
                    Ensemble.Editor.MediaCaptureMGR.ui.webcamCaptureMicSelect.innerHTML = "";

                    let numOfVideoDevices = videoDevices.length;
                    for (let i = 0; i < numOfVideoDevices; i++) {
                        let deviceEl = document.createElement("option");
                        deviceEl.value = videoDevices[i].id;
                        deviceEl.innerText = videoDevices[i].name;
                        Ensemble.Editor.MediaCaptureMGR.ui.webcamCaptureDeviceSelect.appendChild(deviceEl);
                    }

                    Ensemble.Editor.MediaCaptureMGR._videoCaptureInitSettings.videoDeviceId = videoDevices[0].id;

                    Windows.Devices.Enumeration.DeviceInformation.findAllAsync(Windows.Devices.Enumeration.DeviceClass.audioCapture).then(function (audioDevices) {
                        Ensemble.Editor.MediaCaptureMGR._audioCaptureDevices = audioDevices;

                        let numOfAudioDevices = audioDevices.length;
                        for (let i = 0; i < numOfAudioDevices; i++) {
                            let deviceEl = document.createElement("option");
                            deviceEl.value = audioDevices[i].id;
                            deviceEl.innerText = audioDevices[i].name;
                            Ensemble.Editor.MediaCaptureMGR.ui.webcamCaptureMicSelect.appendChild(deviceEl);
                        }
                        if (numOfAudioDevices > 0) Ensemble.Editor.MediaCaptureMGR._videoCaptureInitSettings.audioDeviceId = audioDevices[0].id;

                        
                        
                        Ensemble.Editor.MediaCaptureMGR._videoCapturer = new Windows.Media.Capture.MediaCapture();
                        Ensemble.Editor.MediaCaptureMGR._videoCapturer.initializeAsync(Ensemble.Editor.MediaCaptureMGR._videoCaptureInitSettings).then(Ensemble.Editor.MediaCaptureMGR._listeners.webcamMediaCapturerInitialized);
                    });

                    
                }
                else console.error("No video devices detected.");
            });
        },

        cancelVideoCaptureSession: function () {
            /// <summary>Cancels the current capture session. All video previews will be stopped and any pending recordings will be lost.</summary>
            this.ui.videoCaptureElement.pause();
            this.ui.videoCaptureElement.src = "";
            this._videoCaptureInitSettings = null;
            this._videoCaptureDevices = null;
            this._videoCapturer = null;
            this._previewActive = false;
            Ensemble.Editor.MediaCaptureMGR.ui.webcamCaptureDeviceSelect.removeEventListener("change", Ensemble.Editor.MediaCaptureMGR._listeners.webcamCaptureCameraChanged);
            Ensemble.Editor.MediaCaptureMGR.ui.webcamCaptureMicSelect.removeEventListener("change", Ensemble.Editor.MediaCaptureMGR._listeners.webcamCaptureMicChanged);
        },

        startCameraPreview: function (deviceId) {
            /// <summary>Switches the camera preview to the device with the given ID. Starts the preview if it's not already active. Fails if the capture session has not been initialized.</summary>
            /// <param name="deviceId" type="String">The ID of the camera device to activate.</param>
            if (Ensemble.Editor.MediaCaptureMGR._videoCapturer.mediaCaptureSettings.videoDeviceId != null && Ensemble.Editor.MediaCaptureMGR._videoCapturer.mediaCaptureSettings.videoDeviceId != deviceId) {
                Ensemble.Editor.MediaCaptureMGR.ui.videoCaptureElement.pause();
                Ensemble.Editor.MediaCaptureMGR.ui.videoCaptureElement.src = "";
                Ensemble.Editor.MediaCaptureMGR._videoCapturer.close();

                let tempInitCaptureSettings = new Windows.Media.Capture.MediaCaptureInitializationSettings();
                tempInitCaptureSettings.audioDeviceId = Ensemble.Editor.MediaCaptureMGR._videoCaptureInitSettings.audioDeviceId;
                tempInitCaptureSettings.videoDeviceId = deviceId;
                tempInitCaptureSettings.streamingCaptureMode = Ensemble.Editor.MediaCaptureMGR._videoCaptureInitSettings.streamingCaptureMode;
                tempInitCaptureSettings.photoCaptureSource = Ensemble.Editor.MediaCaptureMGR._videoCaptureInitSettings.photoCaptureSource;
                Ensemble.Editor.MediaCaptureMGR._videoCaptureInitSettings = tempInitCaptureSettings;

                Ensemble.Editor.MediaCaptureMGR._videoCapturer = new Windows.Media.Capture.MediaCapture();
                Ensemble.Editor.MediaCaptureMGR._videoCapturer.initializeAsync(Ensemble.Editor.MediaCaptureMGR._videoCaptureInitSettings).then(Ensemble.Editor.MediaCaptureMGR._listeners.webcamMediaCapturerInitialized);
            }
        },

        ui: {
            videoCaptureElement: null,
            videoCaptureSettingsButton: null,
            videoCaptureSettingsContextMenu: null,
            videoCaptureSettingsWebcamMenu: null,
            webcamCaptureDeviceSelect: null,
            webcamCaptureMicSelect: null
        },

        _refreshUI: function () {
            this.ui.videoCaptureElement = document.getElementsByClassName("media-capture-element--webcam")[0];
            this.ui.videoCaptureSettingsButton = document.getElementsByClassName("eo1-btn--media-capture-settings")[0];
            this.ui.videoCaptureSettingsContextMenu = document.getElementsByClassName("contextmenu--webcam-popin-options")[0];
            this.ui.videoCaptureSettingsWebcamMenu = document.getElementsByClassName("contextmenu--webcam-device-quality")[0];
            this.ui.webcamCaptureDeviceSelect = document.getElementsByClassName("webcam-capture-device-select--webcam")[0];
            this.ui.webcamCaptureMicSelect = document.getElementsByClassName("webcam-capture-device-select--microphone")[0];

            this.ui.videoCaptureElement.addEventListener("playing", Ensemble.Editor.MediaCaptureMGR._listeners.mediaPreviewBegan);
            this.ui.videoCaptureSettingsButton.addEventListener("click", Ensemble.Editor.MediaCaptureMGR._listeners.videoCaptureSettingsButtonClicked);
        },

        _cleanUI: function () {
            this.ui.videoCaptureElement.removeEventListener("playing", Ensemble.Editor.MediaCaptureMGR._listeners.mediaPreviewBegan);
            this.ui.videoCaptureSettingsButton.removeEventListener("click", Ensemble.Editor.MediaCaptureMGR._listeners.videoCaptureSettingsButtonClicked);

            this.ui.videoCaptureElement = null;
            this.ui.videoCaptureSettingsButton = null;
            this.ui.videoCaptureSettingsContextMenu = null;
            this.ui.videoCaptureSettingsWebcamMenu = null;
            this.ui.webcamCaptureDeviceSelect = null;
            this.ui.webcamCaptureMicSelect = null;
        },

        _listeners: {
            webcamMediaCapturerInitialized: function (success) {
                let resolutions = Ensemble.Editor.MediaCaptureMGR._videoCapturer.videoDeviceController.getAvailableMediaStreamProperties(Windows.Media.Capture.MediaStreamType.videoRecord),
                    resCount = resolutions.length,
                    menuItems = [];
                for (let i = 0; i < resCount; i++) {
                    // add an item to the flyout
                    let resString = resolutions[i].width + "x" + resolutions[i].height + "@" + Ensemble.Utilities.TimeConverter.convertFPS(resolutions[i].frameRate.numerator, resolutions[i].frameRate.denominator) + "fps",
                        newItem = new WinJS.UI.MenuCommand(document.createElement("button"), { type: 'toggle', label:resString });
                    menuItems.push(newItem);
                }
                Ensemble.Editor.MediaCaptureMGR.ui.videoCaptureSettingsWebcamMenu.winControl.commands = menuItems;

                let captureUrl = URL.createObjectURL(Ensemble.Editor.MediaCaptureMGR._videoCapturer);
                Ensemble.Editor.MediaCaptureMGR.ui.videoCaptureElement.src = captureUrl;
                Ensemble.Editor.MediaCaptureMGR.ui.videoCaptureElement.play();
                Ensemble.Editor.MediaCaptureMGR.ui.webcamCaptureDeviceSelect.addEventListener("change", Ensemble.Editor.MediaCaptureMGR._listeners.webcamCaptureCameraChanged);
                Ensemble.Editor.MediaCaptureMGR.ui.webcamCaptureMicSelect.addEventListener("change", Ensemble.Editor.MediaCaptureMGR._listeners.webcamCaptureMicChanged);
            },

            mediaPreviewBegan: function (event) {
                Ensemble.Editor.MediaCaptureMGR._previewActive = true;
            },

            webcamCaptureCameraChanged: function (event) {
                Ensemble.Editor.MediaCaptureMGR.startCameraPreview(Ensemble.Editor.MediaCaptureMGR.ui.webcamCaptureDeviceSelect.value);
            },

            webcamCaptureMicChanged: function (event) {

            },

            videoCaptureSettingsButtonClicked: function (event) {
                Ensemble.Editor.MediaCaptureMGR.ui.videoCaptureSettingsContextMenu.winControl.show(Ensemble.Editor.MediaCaptureMGR.ui.videoCaptureSettingsButton, "auto");
            }
        }
    });
})();