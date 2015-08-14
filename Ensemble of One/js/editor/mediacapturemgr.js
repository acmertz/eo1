(function () {
    WinJS.Namespace.define("Ensemble.Editor.MediaCaptureMGR", {
        /// <summary>Manages media capture devices and recording sessions.</summary>
        _videoCaptureInitSettings: null,
        _videoCaptureDevices: null,
        _videoCapturer: null,
        _previewActive: false,

        init: function () {
            this._refreshUI();
            this._videoCaptureDevices = [];
            this._previewActive = false;
        },

        unload: function () {
            this._cleanUI();

            this._videoCaptureInitSettings = null;
            this._videoCaptureDevices = null;
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
            Windows.Devices.Enumeration.DeviceInformation.findAllAsync(Windows.Devices.Enumeration.DeviceClass.videoCapture).then(function (devices) {
                Ensemble.Editor.MediaCaptureMGR._videoCaptureDevices = devices;
                Ensemble.Editor.MediaCaptureMGR._videoCaptureInitSettings.videoDeviceId = devices.length > 0 ? devices[0].id : "";
                Ensemble.Editor.MediaCaptureMGR._videoCapturer = new Windows.Media.Capture.MediaCapture();
                Ensemble.Editor.MediaCaptureMGR._videoCapturer.initializeAsync(Ensemble.Editor.MediaCaptureMGR._videoCaptureInitSettings).then(function () {
                    let captureUrl = URL.createObjectURL(Ensemble.Editor.MediaCaptureMGR._videoCapturer);
                    Ensemble.Editor.MediaCaptureMGR.ui.videoCaptureElement.src = captureUrl;
                    Ensemble.Editor.MediaCaptureMGR.ui.videoCaptureElement.play();
                });
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
        },

        ui: {
            videoCaptureElement: null
        },

        _refreshUI: function () {
            this.ui.videoCaptureElement = document.getElementsByClassName("media-capture-element--webcam")[0];

            this.ui.videoCaptureElement.addEventListener("playing", Ensemble.Editor.MediaCaptureMGR._listeners.mediaPreviewBegan);
        },

        _cleanUI: function () {
            this.ui.videoCaptureElement.removeEventListener("playing", Ensemble.Editor.MediaCaptureMGR._listeners.mediaPreviewBegan);

            this.ui.videoCaptureElement = null;
        },

        _listeners: {
            mediaPreviewBegan: function (event) {
                Ensemble.Editor.MediaCaptureMGR._previewActive = true;
            }
        }
    });
})();