# Ensemble of One

Ensemble of One is a multi-track video editor written in HTML5/ES2015 for Windows 10. Its main differentiating feature is the Timeline editor, which allows users to mix and match audio, video, pictures, and effects together in a project. Clips can be dragged, dropped, and resized on the playback Canvas and are rendered in bottom-up order based on their placement in the Timeline below.

The [WinJS](http://try.buildwinjs.com/) library is used to achieve the Windows 10 look-and-feel, as well as to provide a convention for organizing class objects and namespaces within the application. Some elements (such as the Timeline and Canvas) require custom-built UI widgets, but WinJS components are used whenever possible in order to decrease the complexity of the application.

## Screenshots
### Splash screen
<img alt="Splash screen screenshot" width="320" src="https://user-images.githubusercontent.com/4888172/59166289-bc260000-8aed-11e9-871f-dc105234e7b0.png">

### Main menu
<img alt="Main menu screenshot" width="320" src="https://user-images.githubusercontent.com/4888172/59166321-0c04c700-8aee-11e9-9d0c-5c92b06f0034.png">

### Editor
<img alt="Editor screenshot" width="320" src="https://user-images.githubusercontent.com/4888172/59166375-a402b080-8aee-11e9-9efc-266dbadd552b.png">

### Play-along media capture
<img alt="Media capture screenshot" width="320" src="https://user-images.githubusercontent.com/4888172/59166407-e75d1f00-8aee-11e9-9796-7c9b460e09ce.png">

## Installation
Ensemble of One is a UWP app for Windows 10. Visual Studio 2017 is required to build and install this application (Microsoft dropped support for WinJS apps in Visual Studio 2019). There are no JavaScript dependencies to install, since most of the code was written in vanilla JavaScript and the few libraries that were needed were included in source control. After cloning the repository, you can open `Ensemble of One.sln` in Visual Studio and build the project.

## Code conventions
### Classes
[WinJS documentation on Classes](https://msdn.microsoft.com/en-us/library/windows/apps/br229813.aspx)

Classes are defined via WinJS and should only be used for items that will be frequently created and destroyed during application operation. Instances of a class should never be stored as global variables. They are not to be considered permanent and are not typically accessible outside of the Namespace that created them.

### Namespaces
[WinJS documentation on Namespaces](https://msdn.microsoft.com/en-us/library/windows/apps/br229773.aspx)

Used to organize sections of the app and divide up functionality into logical components, Namespaces are persistent and are available globally at all times. Namespace names should begin with`Ensemble.` in order to minimize pollution of the global space.

Each Namespace should typically include the following properties/functions:

---

```
init
```

  __Type:__ Function
  
  __Description:__ Contains code that needs to run in order for the Namespace to be set up for proper operation. `init` is __not__ called automatically, and must instead be invoked manually at the appropriate time in app operation. Exactly when you chose to call `init` depends on the purpose of the Namespace (a Namespace such as `Ensemble.Settings` needs to be always available during application operation, and as such has its `init` called from within `Ensemble.MainMenu` when Ensemble of One is launched).

---

```
unload
```

  __Type:__ Function
  
  __Description:__ Contains code that needs to be run when cleaning up the Namespace. As with `init`, you must make sure to call `unload` when appropriate for your particular Namespace. Namespaces beginning with `Ensemble.Editor.*`, for instance, have their `init` function called when a project is loaded and their `unload` function called when the user quits back to the Main Menu.

---

```
ui
```

  __Type:__ JSON
  
  __Description:__ Used to store DOM references that need to be accessed frequently during application operation. Better JavaScript performance can be achieved by looking up a DOM element exactly once and storing it in a variable, as opposed to looking it up in the DOM every time it is needed.

---

```
_refreshUI
```

  __Type:__ Function
  
  __Description:__ A place for you to perform initial DOM lookups for all items in the `ui` object. Make sure to attach any required event listeners after looking up all DOM elements.
  
  __Notes:__ `_refreshUI` should be called at least once during any Namespace's initialization.

---

```
_cleanUI
```

  __Type:__ Function
  
  __Description:__ The inverse of `_refreshUI`, `_cleanUI` should contain any code needed to release DOM elements, listeners, and set any UI widgets back to their original (read: unloaded) state.
  
  __Notes:__ `_refreshUI` should be called at least once within Namespaces while unloading.

---

```
_listeners
```

  __Type:__ Object (generic; dictionary-like)
  
  __Description:__ A collection of functions to be assigned as event listeners to DOM elements retrieved in `_refreshUI`.
