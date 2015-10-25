(function () {
    WinJS.Namespace.define("Ensemble.Editor.EffectMGR", {
        /// <summary>Manages the effects panel for creating and editing lens effects.</summary>

        currentClipId: -1,

        initNewEffect: function (effectType) {
            /// <summary>Creates a new effect Lens with the specified type.</summary>
            let newTrackId = Ensemble.Editor.TimelineMGR.generateNewTrackId(),
                trackCreateAction = new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.createTrack, {
                    trackId: newTrackId
                }),
                createLensAction = new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.createLens, {
                    lensId: null,
                    lensType: effectType,
                    destinationTrack: newTrackId,
                    destinationTime: Ensemble.Editor.PlaybackMGR.lastTime
                });
            Ensemble.HistoryMGR.performBatch([trackCreateAction, createLensAction], Ensemble.Editor.EffectMGR._listeners.createdNewEffect);
        },

        switchedTo: function (options) {
            /// <summary>Notifies the VideoCaptureMGR that the user switched to its panel.</summary>
            if (options !== undefined) {
                Ensemble.Editor.EffectMGR.currentClipId = options;

                let clip = Ensemble.Editor.TimelineMGR.getClipById(options),
                effectDetails = clip.effectDetails;

                switch (effectDetails.effectType) {
                    case Ensemble.Editor.EffectMGR.EffectType.solidColor:
                        Ensemble.Editor.EffectMGR.ui.solidColorRed.value = clip.effectDetails.effectProperties.r;
                        Ensemble.Editor.EffectMGR.ui.solidColorGreen.value = clip.effectDetails.effectProperties.g;
                        Ensemble.Editor.EffectMGR.ui.solidColorBlue.value = clip.effectDetails.effectProperties.b;
                        Ensemble.Editor.EffectMGR.ui.solidColorOpacity.value = clip.effectDetails.effectProperties.a * 100;
                        break;
                }
            }
        },

        generateDefaultValues: function (effectType) {
            /// <summary>Generates default values for the given lens Clip.</summary>
            /// <param name="clip" type="String">The type of effect.</param>
            /// <returns type="Object">The effect object with default values.</returns>
            let returnVal = {
                effectType: effectType,
                effectProperties: {}
            }

            switch (effectType) {
                case Ensemble.Editor.EffectMGR.EffectType.solidColor:
                    returnVal.effectProperties["r"] = 255;
                    returnVal.effectProperties["g"] = 255;
                    returnVal.effectProperties["b"] = 255;
                    returnVal.effectProperties["a"] = 1.0;
                    break;
            }

            return returnVal;
        },

        init: function () {
            this._refreshUI();
            this.currentClipId = -1;
        },

        unload: function () {
            this._cleanUI();
            this.currentClipId = -1;
        },

        ui: {
            newEffectConfirmationButton: null,
            newEffectDropdown: null,
            newEffectFlyout: null,
            solidColorRed: null,
            solidColorGreen: null,
            solidColorBlue: null,
            solidColorOpacity: null
        },

        _refreshUI: function () {
            this.ui.newEffectConfirmationButton = document.getElementsByClassName("eo1-btn--create-effect")[0];
            this.ui.newEffectDropdown = document.getElementsByClassName("editor-new-effect-dropdown")[0];
            this.ui.newEffectFlyout = document.getElementsByClassName("flyout--editor-new-effect")[0];
            this.ui.solidColorRed = document.getElementsByClassName("effect-param--solid-color-red")[0];
            this.ui.solidColorGreen = document.getElementsByClassName("effect-param--solid-color-green")[0];
            this.ui.solidColorBlue = document.getElementsByClassName("effect-param--solid-color-blue")[0];
            this.ui.solidColorOpacity = document.getElementsByClassName("effect-param--solid-color-opacity")[0];

            this.ui.newEffectConfirmationButton.addEventListener("click", this._listeners.newEffectButtonClicked);

            let effectParams = document.getElementsByClassName("effect-param"),
                paramCount = effectParams.length;
            for (let i = 0; i < paramCount; i++) {
                effectParams[i].addEventListener("change", this._listeners.effectParamChanged);
            }
        },

        _cleanUI: function () {
            this.ui.newEffectConfirmationButton.removeEventListener("click", this._listeners.newEffectButtonClicked);

            this.ui.newEffectConfirmationButton = null;
            this.ui.newEffectDropdown = null;
            this.ui.newEffectFlyout = null;
            this.ui.solidColorRed = null;
            this.ui.solidColorGreen = null;
            this.ui.solidColorBlue = null;
            this.ui.solidColorOpacity = null;
        },

        _listeners: {
            newEffectButtonClicked: function (event) {
                let type = Ensemble.Editor.EffectMGR.ui.newEffectDropdown.value;
                Ensemble.Editor.EffectMGR.initNewEffect(type);
                Ensemble.Editor.EffectMGR.ui.newEffectFlyout.winControl.hide();
            },

            createdNewEffect: function (event) {
                console.log("Created the new effect!");
            },

            effectParamChanged: function (event) {
                console.log("Effect \"" + event.currentTarget.dataset.effectParam + "\" changed.");
                let clip = Ensemble.Editor.TimelineMGR.getClipById(Ensemble.Editor.EffectMGR.currentClipId),
                    oldEffectDetails = clip.effectDetails,
                    newEffectDetails = JSON.parse(JSON.stringify(oldEffectDetails)),
                    changeEffectAction = null,
                    newValue = parseInt(event.currentTarget.value, 10);

                switch (event.currentTarget.dataset.effectParam) {
                    case "solid-color-red":
                        newEffectDetails.effectProperties.r = newValue;
                        break;
                    case "solid-color-green":
                        newEffectDetails.effectProperties.g = newValue;
                        break;
                    case "solid-color-blue":
                        newEffectDetails.effectProperties.b = newValue;
                        break;
                    case "solid-color-opacity":
                        newEffectDetails.effectProperties.a = newValue / 100;
                        break;
                }

                changeEffectAction = new Ensemble.Events.Action(Ensemble.Events.Action.ActionType.editLens, {
                    lensId: clip.id,
                    oldEffectDetails: clip.effectDetails,
                    newEffectDetails: newEffectDetails
                });

                Ensemble.HistoryMGR.performAction(changeEffectAction);
            }
        },

        EffectType: {
            solidColor: "solid-color"
        }
    });
})();