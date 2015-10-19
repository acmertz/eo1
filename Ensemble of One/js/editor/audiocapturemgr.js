(function () {
    WinJS.Namespace.define("Ensemble.Editor.AudioCaptureMGR", {
        /// <summary>Manages audio capture devices and recording sessions.</summary>

        session: {
            captureInitSettings: new Windows.Media.Capture.MediaCaptureInitializationSettings(),
            captureMGR: new Windows.Media.Capture.MediaCapture(),
            captureReady: false,
            captureActive: false,
            recordingActive: false,
            encodingProfile: Windows.Media.MediaProperties.MediaEncodingProfile.createMp4(Windows.Media.MediaProperties.VideoEncodingQuality.hd720p),
            audioDevices: {
                deviceList: [],
                properties: []
            },
            targetFiles: {
                currentTarget: null,
                captureStartTime: 0,
                recordingStartTime: 0,
                recordingStopTime: 0,
                projectTimeAtStart: 0
            }
        },

        init: function () {
            this._refreshUI();

            this.session.captureInitSettings = null;
            this.session.captureMGR = null;
            this.session.captureReady = false;
            this.session.captureActive = false;
            this.session.recordingActive = false;
            this.session.encodingProfile = null;

            this.session.audioDevices.deviceList = [];
            this.session.audioDevices.properties = [];

            this.session.targetFiles.currentTarget = null;
            this.session.targetFiles.captureStartTime = null;
            this.session.targetFiles.recordingStartTime = null;
            this.session.targetFiles.recordingStopTime = null;
            this.session.targetFiles.projectTimeAtStart = null;
        },

        unload: function () {
            this.cleanupCaptureSession();
            this._cleanUI();
        },

        refreshPreviewMessage: function () {
            if (Ensemble.Editor.AudioCaptureMGR.session.recordingActive) {
                WinJS.Utilities.removeClass(Ensemble.Editor.AudioCaptureMGR.ui.messageReady, "media-capture-preview__mic-message--visible");
                WinJS.Utilities.addClass(Ensemble.Editor.AudioCaptureMGR.ui.messageRecording, "media-capture-preview__mic-message--visible");
                WinJS.Utilities.addClass(Ensemble.Editor.AudioCaptureMGR.ui.micAnimation, "media-capture-preview__mic-animation--visible");
            }
            else {
                WinJS.Utilities.addClass(Ensemble.Editor.AudioCaptureMGR.ui.messageReady, "media-capture-preview__mic-message--visible");
                WinJS.Utilities.removeClass(Ensemble.Editor.AudioCaptureMGR.ui.messageRecording, "media-capture-preview__mic-message--visible");
                WinJS.Utilities.removeClass(Ensemble.Editor.AudioCaptureMGR.ui.micAnimation, "media-capture-preview__mic-animation--visible");
            }
        },

        initCaptureSession: function () {
            /// <summary>Enumerates media capture devices, sets up the audio recording Panel, and initializes a video capture session.</summary>
            Ensemble.Editor.AudioCaptureMGR.session.captureInitSettings = new Windows.Media.Capture.MediaCaptureInitializationSettings();
            Ensemble.Editor.AudioCaptureMGR.session.captureInitSettings.audioDeviceId = "";
            Ensemble.Editor.AudioCaptureMGR.session.captureInitSettings.streamingCaptureMode = Windows.Media.Capture.StreamingCaptureMode.audio;
            Ensemble.Editor.AudioCaptureMGR.refreshPreviewMessage();

            Windows.Devices.Enumeration.DeviceInformation.findAllAsync(Windows.Devices.Enumeration.DeviceClass.audioCapture).then(function (audioDevices) {
                if (audioDevices.length > 0) {
                    Ensemble.Editor.AudioCaptureMGR.createAudioFile(null, Ensemble.Editor.AudioCaptureMGR._listeners.audioFileCreated);
                    Ensemble.Editor.AudioCaptureMGR.session.audioDevices.deviceList = audioDevices;

                    let numOfAudioDevices = audioDevices.length,
                        micMenuCommands = [];
                    for (let i = 0; i < numOfAudioDevices; i++) {
                        let newItem = new WinJS.UI.MenuCommand(document.createElement("button"), { type: 'toggle', label: audioDevices[i].name, onclick: Ensemble.Editor.AudioCaptureMGR._listeners.micDeviceSelected });
                        newItem.element.dataset.micDeviceIndex = i;
                        micMenuCommands.push(newItem);
                    }
                    micMenuCommands[0].selected = true;
                    Ensemble.Editor.AudioCaptureMGR.ui.micDeviceSelectContextMenu.winControl.commands = micMenuCommands;

                    Ensemble.Editor.AudioCaptureMGR.session.captureInitSettings.audioDeviceId = audioDevices[0].id;

                    Ensemble.Editor.AudioCaptureMGR.session.captureMGR = new Windows.Media.Capture.MediaCapture();
                    Ensemble.Editor.AudioCaptureMGR.session.captureMGR.addEventListener("recordlimitationexceeded", Ensemble.Editor.AudioCaptureMGR._listeners.captureRecordLimitationExceeded);
                    Ensemble.Editor.AudioCaptureMGR.session.captureMGR.addEventListener("failed", Ensemble.Editor.AudioCaptureMGR._listeners.captureFailed);
                    Ensemble.Editor.AudioCaptureMGR.session.captureMGR.initializeAsync(Ensemble.Editor.AudioCaptureMGR.session.captureInitSettings).then(Ensemble.Editor.AudioCaptureMGR._listeners.mediaCapturerInitialized);
                }
                else {
                    console.error("No audio devices detected.");
                }
            });
                

        },

        cleanupCaptureSession: function () {
            /// <summary>Cleans up the current recording session.</summary>
            if (this.session.captureMGR != null) this.session.captureMGR.close();

            this.session.captureInitSettings = null;
            this.session.captureMGR = null;
            this.session.captureReady = false;
            this.session.captureActive = false;
            this.session.recordingActive = false;
            this.session.encodingProfile = null;

            this.session.audioDevices.deviceList = [];
            this.session.audioDevices.properties = [];

            if (this.session.targetFiles.currentTarget != null) this.session.targetFiles.currentTarget.deleteAsync();
            this.session.targetFiles.currentTarget = null;
            this.session.targetFiles.captureStartTime = null;
            this.session.targetFiles.recordingStartTime = null;
            this.session.targetFiles.recordingStopTime = null;
            this.session.targetFiles.projectTimeAtStart = null;
        },

        changeCaptureDevice: function (audioDevice, force) {
            /// <summary>Switches the camera preview to the device with the given ID. Starts the preview if it's not already active. Fails if the capture session has not been initialized.</summary>
            /// <param name="audioDeviceId" type="String">The ID of the microphone device to activate.</param>
            /// <param name="force" type="Boolean">If true, forces the video device to be started even if it's already the active device.</param>
            let audioDeviceId = audioDevice ? audioDevice.id : null;
            if (force || Ensemble.Editor.AudioCaptureMGR.session.captureMGR.mediaCaptureSettings.audioDeviceId != audioDeviceId) {
                Ensemble.Editor.AudioCaptureMGR.session.captureReady = false;
                
                Ensemble.Editor.AudioCaptureMGR.session.captureMGR.stopRecordAsync().then(function () {
                    Ensemble.Editor.AudioCaptureMGR.session.captureActive = false;

                    let oldTarget = Ensemble.Editor.AudioCaptureMGR.session.targetFiles.currentTarget;
                    Ensemble.Editor.AudioCaptureMGR.session.targetFiles.currentTarget = null;
                    Ensemble.Editor.AudioCaptureMGR.replaceAudioFile(oldTarget, Ensemble.Editor.AudioCaptureMGR._listeners.audioFileCreated);

                    let tempInitCaptureSettings = new Windows.Media.Capture.MediaCaptureInitializationSettings();
                    tempInitCaptureSettings.audioDeviceId = (audioDeviceId && Ensemble.Editor.AudioCaptureMGR.session.captureMGR.mediaCaptureSettings.audioDeviceId != audioDeviceId) ? audioDeviceId : Ensemble.Editor.AudioCaptureMGR.session.captureInitSettings.audioDeviceId;                  
                    tempInitCaptureSettings.streamingCaptureMode = Ensemble.Editor.AudioCaptureMGR.session.captureInitSettings.streamingCaptureMode;
                    Ensemble.Editor.AudioCaptureMGR.session.captureInitSettings = tempInitCaptureSettings;

                    // Ensemble.Settings.saveSetting("last-used-camera-device", tempInitCaptureSettings.videoDeviceId);

                    Ensemble.Editor.AudioCaptureMGR.session.captureMGR.close();
                    Ensemble.Editor.AudioCaptureMGR.session.captureMGR = new Windows.Media.Capture.MediaCapture();
                    Ensemble.Editor.AudioCaptureMGR.session.captureMGR.addEventListener("recordlimitationexceeded", Ensemble.Editor.AudioCaptureMGR._listeners.captureRecordLimitationExceeded);
                    Ensemble.Editor.AudioCaptureMGR.session.captureMGR.addEventListener("failed", Ensemble.Editor.AudioCaptureMGR._listeners.captureFailed);
                    Ensemble.Editor.AudioCaptureMGR.session.captureMGR.initializeAsync(Ensemble.Editor.AudioCaptureMGR.session.captureInitSettings).then(Ensemble.Editor.AudioCaptureMGR._listeners.mediaCapturerInitialized);
                });
            }
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

        createAudioFile: function (name, cb) {
            /// <summary>Creates a new video file for webcam capture.</summary>
            /// <param name="name" type="String">The name for the file, omitting the extension. Defaults to "Recording" if null.</param>
            /// <param name="cb" type="Function">The callback to execute when the file has been created.</param>
            Windows.Storage.KnownFolders.videosLibrary.createFolderAsync("Ensemble of One Recordings", Windows.Storage.CreationCollisionOption.openIfExists).then(function (createdFolder) {
                let fileType = ".wav",
                    fileName = name || "Recording";
                createdFolder.createFileAsync(fileName + fileType, Windows.Storage.CreationCollisionOption.generateUniqueName).done(cb);
            });
        },

        replaceAudioFile: function (file, cb) {
            /// <summary>Deletes the given StorageFile and creates a new file with the same name. Calls the provided callback upon copmletion.</summary>
            /// <param name="file" type="Windows.Storage.StorageFile">The file to replace.</param>
            /// <param name="cb" type="Function">The callback to execute when the file has been replaced.</param>
            let fileName = file.displayName;
            file.deleteAsync().then(function () {
                Ensemble.Editor.AudioCaptureMGR.createAudioFile(fileName, cb);
            });
        },

        sessionInProgress: function () {
            /// <summary>Returns whether or not a webcam capture session is currently in progress.</summary>
            /// <returns type="Boolean"></returns>
            return Ensemble.Editor.AudioCaptureMGR.session.recordingActive;
        },

        cancelCurrentSession: function () {
            /// <summary>Cancels the current recording session.</summary>
            Ensemble.Editor.AudioCaptureMGR.session.recordingActive = false;
        },

        ui: {
            micDeviceSelectContextMenu: null,
            captureSettingsContextMenu: null,
            karaokeToggle: null,
            captureStartStopButton: null,
            captureSettingsButton: null,
            messageReady: null,
            messageRecording: null,
            micAnimation: null
        },

        _refreshUI: function () {
            this.ui.micDeviceSelectContextMenu = document.getElementsByClassName("contextmenu--mic-device-select")[0];
            this.ui.captureSettingsContextMenu = document.getElementsByClassName("contextmenu--mic-panel-options")[0];
            this.ui.karaokeToggle = document.getElementsByClassName("contextmenu--mic-panel-options__karaoke-toggle")[0];
            this.ui.captureStartStopButton = document.getElementsByClassName("eo1-btn--mic-capture-startstop")[0];
            this.ui.captureSettingsButton = document.getElementsByClassName("eo1-btn--mic-capture-settings")[0];
            this.ui.messageReady = document.getElementsByClassName("media-capture-preview__mic-message--ready")[0];
            this.ui.messageRecording = document.getElementsByClassName("media-capture-preview__mic-message--recording")[0];
            this.ui.micAnimation = document.getElementsByClassName("media-capture-preview__mic-animation")[0];

            this.ui.captureStartStopButton.addEventListener("click", this._listeners.startStopButtonClicked);
            this.ui.captureSettingsButton.addEventListener("click", this._listeners.settingsButtonClicked);
        },

        _cleanUI: function () {
            this.ui.captureStartStopButton.removeEventListener("click", this._listeners.startStopButtonClicked);
            this.ui.captureSettingsButton.removeEventListener("click", this._listeners.settingsButtonClicked);

            this.ui.micDeviceSelectContextMenu = null;
            this.ui.captureSettingsContextMenu = null;
            this.ui.karaokeToggle = null;
            this.ui.captureStartStopButton = null;
            this.ui.captureSettingsButton = null;
            this.ui.messageReady = null;
            this.ui.messageRecording = null;
            this.ui.micAnimation = null;
        },

        _listeners: {
            mediaCapturerInitialized: function (success) {
                Ensemble.Editor.AudioCaptureMGR.session.encodingProfile = Windows.Media.MediaProperties.MediaEncodingProfile.createWav(Windows.Media.MediaProperties.AudioEncodingQuality.auto);
                Ensemble.Editor.AudioCaptureMGR.session.captureReady = true;
                Ensemble.Editor.AudioCaptureMGR._listeners.captureInitializationCheck();
            },

            audioFileCreated: function (file) {
                console.log("Created file for recording session.");
                Ensemble.Editor.AudioCaptureMGR.session.targetFiles.currentTarget = file;
                Ensemble.Editor.AudioCaptureMGR._listeners.captureInitializationCheck();
            },

            captureInitializationCheck: function () {
                /// <summary>Checks if both the media capture manager and the target file have been initialized and starts the camera preview if they have.</summary>
                if (Ensemble.Editor.AudioCaptureMGR.session.targetFiles.currentTarget != null && Ensemble.Editor.AudioCaptureMGR.session.captureReady) {
                    Ensemble.Editor.AudioCaptureMGR.session.captureMGR.startRecordToStorageFileAsync(Ensemble.Editor.AudioCaptureMGR.session.encodingProfile, Ensemble.Editor.AudioCaptureMGR.session.targetFiles.currentTarget).then(Ensemble.Editor.AudioCaptureMGR._listeners.audioCaptureBegan);
                }
            },

            audioCaptureBegan: function (status) {
                Ensemble.Editor.AudioCaptureMGR.session.targetFiles.captureStartTime = performance.now();
                Ensemble.Editor.AudioCaptureMGR.session.captureActive = true;
                Ensemble.Editor.AudioCaptureMGR.refreshPreviewMessage();
                console.log("Started audio capture.");
            },

            micDeviceSelected: function (event) {
                let allButtons = $(Ensemble.Editor.AudioCaptureMGR.ui.micDeviceSelectContextMenu).find("button"),
                    buttonCount = allButtons.length;
                for (let i = 0; i < buttonCount; i++) {
                    allButtons[i].winControl.selected = false;
                }
                event.currentTarget.winControl.selected = true;
                Ensemble.Editor.AudioCaptureMGR.changeCaptureDevice(Ensemble.Editor.AudioCaptureMGR.session.audioDevices.deviceList[event.currentTarget.dataset.micDeviceIndex]);
            },

            startStopButtonClicked: function (event) {
                if (Ensemble.Editor.AudioCaptureMGR.session.recordingActive) {
                    // currently recording. stop recording and move temp file into the import list.
                    Ensemble.Editor.AudioCaptureMGR.session.recordingActive = false;
                    Ensemble.Editor.AudioCaptureMGR.ui.captureStartStopButton.innerHTML = "&#9210;";
                    Ensemble.Editor.AudioCaptureMGR.ui.captureSettingsButton.removeAttribute("disabled");
                    Ensemble.Editor.AudioCaptureMGR.session.captureMGR.stopRecordAsync().then(function () {
                        Ensemble.Editor.AudioCaptureMGR.session.targetFiles.recordingStopTime = performance.now();

                        let rawFile = Ensemble.Editor.AudioCaptureMGR.session.targetFiles.currentTarget,
                            ensembleFile = Ensemble.FileIO._createFileFromSrc(rawFile),
                            newClip = new Ensemble.Editor.Clip(null),
                            importTime = Ensemble.Editor.AudioCaptureMGR.session.targetFiles.projectTimeAtStart,
                            importTrim = Math.floor(Ensemble.Editor.AudioCaptureMGR.session.targetFiles.recordingStartTime - Ensemble.Editor.AudioCaptureMGR.session.targetFiles.captureStartTime),
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

                        Ensemble.Editor.AudioCaptureMGR.session.targetFiles.currentTarget = null;
                        Ensemble.Editor.AudioCaptureMGR.session.targetFiles.projectTimeAtStart = null;
                        Ensemble.Editor.AudioCaptureMGR.session.targetFiles.captureStartTime = null;

                        Ensemble.HistoryMGR.performBatch([trackCreateAction, clipImportAction], Ensemble.Editor.AudioCaptureMGR._listeners.importAllFinished);
                    });
                }
                else {
                    // not recording. start the recording stream and disable all buttons.
                    Ensemble.Editor.AudioCaptureMGR.ui.captureStartStopButton.disabled = "disabled";
                    Ensemble.Editor.AudioCaptureMGR.ui.captureSettingsButton.disabled = "disabled";
                    if (Ensemble.Editor.AudioCaptureMGR.ui.karaokeToggle.winControl.selected) Ensemble.Editor.PlaybackMGR.play(Ensemble.Editor.AudioCaptureMGR._listeners.karaokeStartCallback);
                    else Ensemble.Editor.AudioCaptureMGR._listeners.karaokeStartCallback();
                }
            },

            settingsButtonClicked: function (event) {
                Ensemble.Editor.AudioCaptureMGR.ui.captureSettingsContextMenu.winControl.show(event.currentTarget);
            },

            captureRecordLimitationExceeded: function (event) {
                console.error("Audio recording limitation exceeded: " + event);
            },

            captureFailed: function (event) {
                console.error("Audio capture failed: " + event);
            },

            importAllFinished: function (event) {
                console.info("Finished importing the captured clip.");
                Ensemble.Editor.AudioCaptureMGR.createAudioFile(null, Ensemble.Editor.AudioCaptureMGR._listeners.audioFileCreated);
            },

            karaokeStartCallback: function () {
                Ensemble.Editor.AudioCaptureMGR.session.targetFiles.recordingStartTime = performance.now();
                Ensemble.Editor.AudioCaptureMGR.session.targetFiles.projectTimeAtStart = Ensemble.Editor.PlaybackMGR.lastTime;
                Ensemble.Editor.AudioCaptureMGR.session.recordingActive = true;
                Ensemble.Editor.AudioCaptureMGR.ui.captureStartStopButton.innerHTML = "&#57691;";
                Ensemble.Editor.AudioCaptureMGR.ui.captureStartStopButton.removeAttribute("disabled");
                Ensemble.Editor.AudioCaptureMGR.refreshPreviewMessage();
            }
        }
    });
})();