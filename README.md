# Boxzilla.js

Boxzilla.js is a simple jQuery library for creating boxes which can pop-up or slide-in at predefined moments.

This is the script powering the [Boxzilla plugin for WordPress](https://boxzillaplugin.com/).


## Usage

First, include the script in your webpage. Make sure jQuery is loaded as well.

```html
<script src="/jquery.js"></script>
<script src="/boxzilla.js"></script>
```

Then, call the `init` method on `Boxzilla` and create your boxes.

```html
<script>
Boxzilla.init();
Boxzilla.create( 'my-box', {
    content: "Well hello there.",
    trigger: {
        method: 'percentage',
        value: 50
    },
    position: "center"
});
</script>
```

Alternatively, you can load Boxzilla using Browserify.

```js
var Boxzilla = require('boxzilla');
```

### Config

The following configuration values are accepted as the second argument for the `create` method.

```js
{
    'animation': 'fade',        // "fade" or "slide"
    'rehide': false,            // boolean, whether box should rehide when certain triggers are no longer met.
    'content': '',              // "Any string"
    'cookieTime': 0,            // integer, number of days a box should be hidden when dismissed
    'icon': '&times',           // string, close icon character
    'minimumScreenWidth': 0,    // integer, box won't show on screens smaller than this
    'position': 'bottom-left',  // "center", "bottom-right", "top-left", etc.
    'testMode': false,          // boolean
    'trigger': {                // false or object
        'method': 'percentage',       // "time_on_site", "time_on_page", "element" or "percentage"
        'value':   65                 // integer or string selector
    },
    'unclosable': false,        // boolean
    'css': {}                   // object
}
```

### Managing boxes

The `Boxzilla` object exposes the following methods.

```js
Boxzilla.show('my-box');
Boxzilla.hide('my-box');
Boxzilla.dismiss();             // all boxes
Boxzilla.dismiss('my-box');     // specific box
Boxzilla.on('box.show', callback);
```

### Events

Event listeners can be added or removed using `Boxzilla.on` and `Boxzilla.off`. For a full list of event methods, check the [Event Emitter API](https://github.com/Olical/EventEmitter/blob/master/docs/api.md).

```js
ready
box.show
box.hide
box.dismiss
```

_Example Usage_

```js
Boxzilla.on('box.show', function(box) {
    console.log("Showing box " + box.id);
});
```

### License

GPLv2