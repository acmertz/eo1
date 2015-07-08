// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509
(function () {
	"use strict";
	WinJS.Application.addEventListener("activated", Ensemble.Platform._listeners.appActivated, false);
	WinJS.Application.addEventListener("checkpoint", Ensemble.Platform._listeners.appCheckpoint, false);
	WinJS.Application.start();
})();
