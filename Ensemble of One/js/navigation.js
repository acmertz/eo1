(function () {
    WinJS.Namespace.define("Ensemble.Navigation", {
        /// <summary>Used to manage navigation states and system "Back" events.</summary>

        _backStack: [],

        init: function () {
            Windows.UI.Core.SystemNavigationManager.getForCurrentView().addEventListener("backrequested", Ensemble.Navigation.navigateBack);
            Ensemble.Navigation.refreshSystemBackButton();
            let clickeaters = document.getElementsByClassName("ensemble-clickeater--backnav"),
                clickeaterCount = clickeaters.length;
            for (let i = 0; i < clickeaterCount; i++) {
                clickeaters[i].addEventListener("pointerdown", Ensemble.Navigation.navigateBack);
            }
            let backbuttons = document.getElementsByClassName("app-trigger--backnav"),
                backbuttonCount = backbuttons.length;
            for (let i = 0; i < backbuttonCount; i++) {
                backbuttons[i].addEventListener("click", Ensemble.Navigation.navigateBack);
            }
        },

        reset: function () {
            /// <summary>Resets the "Back" navigation to its default state (clears all entries in the back stack).
            Ensemble.Navigation._backStack = [];
            Ensemble.Navigation.refreshSystemBackButton();
        },

        pushBackState: function (handler) {
            /// <summary>Pushes a handler to the list of back navigation states.</summary>
            /// <param name="handler" type="Function">A function to call when a system "Back" event is detected.</param>
            Ensemble.Navigation._backStack.push(handler);
            Ensemble.Navigation.refreshSystemBackButton();
        },

        navigateBack: function (event) {
            /// <summary>Forces Ensemble to navigate back to previous state.</summary>
            if (Ensemble.Navigation._backStack.length > 0) {
                Ensemble.Navigation._backStack.pop()();
                event.handled = true;
            }
            Ensemble.Navigation.refreshSystemBackButton();
        },

        refreshSystemBackButton: function () {
            if (Ensemble.Navigation._backStack.length > 0) {
                Windows.UI.Core.SystemNavigationManager.getForCurrentView().appViewBackButtonVisibility = Windows.UI.Core.AppViewBackButtonVisibility.visible;
            }
            else {
                Windows.UI.Core.SystemNavigationManager.getForCurrentView().appViewBackButtonVisibility = Windows.UI.Core.AppViewBackButtonVisibility.collapsed;
            }
        }
    });
})();