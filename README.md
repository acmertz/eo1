# Ensemble of One

Ensemble of One is a multi-track video editor written in HTML5/JavaScript (ES6) for Universal Windows devices (UWP). Its main differentiating feature is the Timeline editor, which allows users to mix and match audio, video, pictures, and effects together in a project. Clips can be gradded/dropped and resized on the previous Canvas and are rendered in bottom-up order based on their placement in the Timeline below.

The __[WinJS] (http://try.buildwinjs.com/)__ library is used to achieve the Windows 10 look-and-feel, as well as to provide a convention for organizing class objects and namespaces within the application. Some elements (such as the Timeline and Canvas) require custom-built UI widgets, but WinJS components are used whenever possible in order to decrease the complexity of the application.

### Code conventions
##### Classes
_[WinJS documentation on Classes &raquo;] (https://msdn.microsoft.com/en-us/library/windows/apps/br229813.aspx)_

Classes are defined via WinJS and should only be used for items that will be frequently created and destroyed during application operation. Instances of a class should never be stored as global variables. They are not to be considered permanent and are not typically accessible outside of the Namespace that created them.

##### Namespaces
_[WinJS documentation on Namespaces &raquo;] (https://msdn.microsoft.com/en-us/library/windows/apps/br229773.aspx)_

Used to organize sections of the app and divide up functionality into logical components, Namespaces are persistent and are available globally at all times. Namespace names should begin with`Ensemble.` in order to minimize pollution of the global space.

Each Namespace should typically include the following properties/functions:

`init`

  __Type:__ Function
  
  __Description:__ Contains code that needs to run in order for the Namespace to be set up for proper operation. `init` is __not__ called automatically, and must instead be invoke manually at the appropriate time in app operation. Exactly when you chose to call `init` depends on the purpose of the Namespace (a Namespace such as `Ensemble.Settings` needs to be always available during application operation, and as such has its `init` called from within `Ensemble.MainMenu` when Ensemble of One is launched).

-

`unload`

  __Type:__ Function
  
  __Description:__ Contains code that needs to be run when cleaning up the Namespace. As with `init`, you must make sure to call `unload` when appropriate for your particular Namespace. Namespaces beginning with `Ensemble.Editor.*`, for instance, have their `init` function called when a project is loaded and their `unload` function called when the user quits back to the Main Menu.

-

`ui`

  __Type:__ JSON
  
  __Description:__ Used to store DOM references that need to be accessed frequently during application operation. Better JavaScript performance can be achieved by looking up a DOM element exactly once and storing it in a variable, as opposed to looking it up in the DOM every time it is needed.

-

`_refreshUI`

  __Type:__ Function
  
  __Description:__ A place for you to perform initial DOM lookups for all items in the `ui` object. Make sure to attach any required event listeners after looking up all DOM elements.
  
  __Notes:__ Should always be called from within the Namespace's `init` function.

-

`_cleanUI`

  __Type:__ Function
  
  __Description:__ The inverse of `_refreshUI`, `_cleanUI` should contain any code needed to release DOM elements, listeners, and set any UI widgets back to their original (read: unloaded) state.
  
  __Notes:__ Should always be called from within the Namespace's `unload` function.

-

`_listeners`

  __Type:__ Object (generic; dictionary-like)
  
  __Description:__ A collection of functions to be assigned as event listeners to DOM elements retrieved in `_refreshUI`.
  
  __Notes:__ The `this` keyword is typically broken within functions in this sub-Namespace due to the way JavaScript scope works in event listeners. Always make sure to address other Namespace functions and properties by their full name (`Ensemble.*` instead of `this.*`).

-

You'll notice that certain functions and properties begin with an underscore (_) character. This is a purely artificial convention that has no actual impact on the functionality of the app; rather, it is used to denote functions and properties that are to be considered "private" within the Namespace (since support for ES6 Classes is not particularly widespread at the time of this writing). Visual Studio IntelliSense will only auto-suggest Namespaces, functions, and variable names that do not begin with underscores.

##### Comments and Type
JavaScript is a dynamically-typed language*. Ensemble of One uses Visual Studio __XML Documentation Comments for JavaScript IntelliSense__, which are based on the [JSDoc] (http://usejsdoc.org/) JavaScript code-commenting organizational system. Please see [this MSDN document] (https://msdn.microsoft.com/en-us/library/bb514138.aspx) on IntelliSense comments. Commenting your classes and functions in this manner allows VisualStudio IntelliSense to produce better autocomplete suggestions and to infer details about expected object types despite JavaScript's dynamically-typed nature.

_* Most of the time. Various typed Array objects are available for use with WebGL rendering contexts, among a few other select situations. See [this MDN article] (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays) for more information on typed arrays in JavaScript._