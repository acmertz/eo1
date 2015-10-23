(function () {
    WinJS.Namespace.define("Ensemble.Editor.EffectMGR", {
        /// <summary>Manages the effects panel for creating and editing lens effects.</summary>

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

        initEffectPanel: function (panelId) {
            /// <summary>Initializes the effect panel to display the appropriate settings for the effect.</summary>
            /// <param name="panelId" type="Number">The ID of the effect.</param>
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
        },

        unload: function () {
            this._cleanUI();
        },

        ui: {
            newEffectConfirmationButton: null,
            newEffectDropdown: null,
            newEffectFlyout: null
        },

        _refreshUI: function () {
            this.ui.newEffectConfirmationButton = document.getElementsByClassName("eo1-btn--create-effect")[0];
            this.ui.newEffectDropdown = document.getElementsByClassName("editor-new-effect-dropdown")[0];
            this.ui.newEffectFlyout = document.getElementsByClassName("flyout--editor-new-effect")[0];

            this.ui.newEffectConfirmationButton.addEventListener("click", this._listeners.newEffectButtonClicked);
        },

        _cleanUI: function () {
            this.ui.newEffectConfirmationButton.removeEventListener("click", this._listeners.newEffectButtonClicked);

            this.ui.newEffectConfirmationButton = null;
            this.ui.newEffectDropdown = null;
            this.ui.newEffectFlyout = null;
        },

        _listeners: {
            newEffectButtonClicked: function (event) {
                let type = Ensemble.Editor.EffectMGR.ui.newEffectDropdown.value;
                Ensemble.Editor.EffectMGR.initNewEffect(type);
                Ensemble.Editor.EffectMGR.ui.newEffectFlyout.winControl.hide();
            },

            createdNewEffect: function (event) {
                console.log("Created the new effect!");
            }
        },

        EffectType: {
            solidColor: "solid-color"
        }
    });
})();