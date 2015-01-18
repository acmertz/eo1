(function () {
    WinJS.Namespace.define("Ensemble.Utilities.Screen", {
        /// <summary>Provides tools for accessing screen specifications, such as refresh rate.</summary>
        refreshRate: 0,
        _timeArr: [],
        _startTime: 0,
        _lastTime: 0,
        _frameCount: 0,
        _cb: null,

        calculateRefreshRate: function (callback) {
            /// <summary>Calculates the screen's refresh rate and saves the value in Ensemble.Session.refreshRate.</summary>
            /// <param name="callback" type="Function">Optional. The callback to execute after finishing the check.</param>
            this._timeArr = [];
            this._frameCount = 0;
            this._cb = callback;
            this._startTime = performance.now();
            requestAnimationFrame(this._animFrame);
        },

        _animFrame: function (event) {
            Ensemble.Utilities.Screen._frameCount++;
            let currentTime = performance.now();
            Ensemble.Utilities.Screen._timeArr.push(currentTime - Ensemble.Utilities.Screen._lastTime);
            Ensemble.Utilities.Screen._lastTime = currentTime;
            if (2000 > performance.now() - Ensemble.Utilities.Screen._startTime) requestAnimationFrame(Ensemble.Utilities.Screen._animFrame);
            else {
                if (Ensemble.Utilities.Screen._timeArr.length) {
                    let sum = 0;
                    for (let i = 0; i < Ensemble.Utilities.Screen._timeArr.length; i++) {
                        sum = sum + Ensemble.Utilities.Screen._timeArr[i];
                    }
                    Ensemble.Utilities.Screen.refreshRate = parseInt((1000 / (sum / Ensemble.Utilities.Screen._timeArr.length)), 10);
                    console.info("Screen refresh rate is " + Ensemble.Utilities.Screen.refreshRate + "Hz.");
                    console.log("Length of array: " + Ensemble.Utilities.Screen._timeArr.length);
                    console.log("Total sum of times: " + sum);
                }
                try { 
                    Ensemble.Utilities.Screen._cb();
                }
                catch (exception) {
                    console.log("Finished calculating the refresh rate, but could not fire the callback.");
                }
            }
        }
    });
})();