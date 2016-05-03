# Boxzilla.js

Boxzilla.js is a simple jQuery library for creating boxes which can pop-up or slide-in at predefined moments.

This is the script powering the [Boxzilla plugin for WordPress](https://boxzillaplugin.com/).


## Usage

First, include the script in your webpage. Make sure jQuery is loaded as well.

```html
<script src="jquery.js"></script>
<script src="boxzilla.js"></script>
```

Then, call the `init` method on `Boxzilla` and create your boxes.

```html
<script>
Boxzilla.init();
Boxzilla.createBox( 'my-box', {
    content: "Well hello there.",
    trigger: "percentage",
    triggerPercentage: 50,
    position: "center"
});
</script>
```

### Config

The following configuration values are accepted.

```js
{
    'animation': 'fade',        // "fade" or "slide"
    'autoHide': false,          // boolean
    'autoShow': true,           // boolean
    'content': '',              // "Any string"
    'cookieTime': 0,            // integer, number of days a box should be hidden when dismissed
    'icon': '&times',           // string, close icon character
    'minimumScreenWidth': 0,    // integer, box won't show on screens smaller than this
    'position': 'bottom-left',  // "center", "bottom-right", "top-left", etc.
    'testMode': false,          // boolean
    'trigger': 'element',       // "element" or "percentage"
    'unclosable': false,        // boolean
    'css': {}                   // object
}
```

### Managing boxes

The `Boxzilla` object exposes the following methods.

```js
Boxzilla.showBox( 'my-box' );
Boxzilla.hideBox( 'my-box' );
Boxzilla.dismiss();
Boxzilla.events.on('box.show', callback);
```

### License

GPLv2