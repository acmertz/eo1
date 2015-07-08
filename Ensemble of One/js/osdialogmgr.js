(function () {
    WinJS.Namespace.define("Ensemble.OSDialogMGR", {
        /// <summary>Used to call up standard OS dialogs for important actions that require user attention.</summary>

        //Any number of callbacks for the current OS dialog.
        _callbacks: [],

        showDialog: function (title, message, commands, defaultIndex, cancelIndex) {
            /// <summary>Shows an OS dialog with the specified title, message, and commands.</summary>
            /// <param name="title" type="String">The title of the dialog.</param>
            /// <param name="message" type="String">The meessage to display to the user.</param>
            /// <param name="commands" type="Array">An array of command objects in the following format: {label, handler}</param>
            /// <param name="defaultIndex" type="Number">The index of the command to be used as the default operation.</param>
            /// <param name="cancelIndex" type="Number">The index of the command to be used as the cancel operation.</param>

            let msg = new Windows.UI.Popups.MessageDialog(message, title);
            for (let i = 0; i < commands.length; i++) {
                msg.commands.append(new Windows.UI.Popups.UICommand(commands[i].label, commands[i].handler));
            }
            msg.defaultCommandIndex = defaultIndex;
            msg.cancelCommandIndex = cancelIndex;
            msg.showAsync();
        }
    });
})();