'use strict';

var $ = window.jQuery,
    EventEmitter = require('wolfy87-eventemitter'),
    Boxzilla = Object.create(EventEmitter.prototype),
    Box = require('./Box.js')(Boxzilla),
    boxes = {},
    windowHeight = window.innerHeight,
    overlay = document.createElement('div');

function each( obj, callback ) {
    for( var key in obj ) {
        if(! obj.hasOwnProperty(key)) continue;
        callback(obj[key]);
    }
}

function throttle(fn, threshhold, scope) {
    threshhold || (threshhold = 250);
    var last,
        deferTimer;
    return function () {
        var context = scope || this;

        var now = +new Date,
            args = arguments;
        if (last && now < last + threshhold) {
            // hold on to it
            clearTimeout(deferTimer);
            deferTimer = setTimeout(function () {
                last = now;
                fn.apply(context, args);
            }, threshhold);
        } else {
            last = now;
            fn.apply(context, args);
        }
    };
}

// "keyup" listener
function onKeyUp(e) {
    if (e.keyCode == 27) {
        Boxzilla.dismiss();
    }
}

// check triggerHeight criteria for all boxes
function checkBoxCriterias() {
    var scrollY = window.scrollY;
    var scrollHeight = scrollY + ( windowHeight * 0.9 );

    each(boxes, function(box) {
        if( ! box.mayAutoShow() || box.triggerHeight <= 0 ) {
            return;
        }

        if( scrollHeight > box.triggerHeight ) {
            box.trigger();
        } else if( box.mayRehide() ) {
            box.hide();
        }
    });
}

// recalculate heights and variables based on height
function recalculateHeights() {
    windowHeight = window.innerHeight;

    each(boxes, function(box) {
        box.setCustomBoxStyling();
    });
}

function onOverlayClick(e) {
    var x = e.offsetX;
    var y = e.offsetY;

    // calculate if click was near a box to avoid closing it (click error margin)
    each(boxes, function(box) {
        var rect = box.element.getBoundingClientRect();
        var margin = 100 + ( window.innerWidth * 0.05 );

        // if click was not anywhere near box, dismiss it.
        if( x < ( rect.left - margin ) || x > ( rect.right + margin ) || y < ( rect.top - margin ) || y > ( rect.bottom + margin ) ) {
            box.dismiss();
        }
    });
}

// initialise & add event listeners
Boxzilla.init = function() {
    // add overlay element to dom
    overlay.id = 'boxzilla-overlay';
    document.body.appendChild(overlay);

    // event binds
    $(window).bind('scroll', throttle(checkBoxCriterias));
    $(window).bind('resize', throttle(recalculateHeights));
    $(window).bind('load', recalculateHeights );
    $(document).keyup(onKeyUp);
    $(overlay).click(onOverlayClick);

    Boxzilla.trigger('ready');
};

/**
 * Create a new Box
 *
 * @param string id
 * @param object opts
 *
 * @returns Box
 */
Boxzilla.create = function(id, opts) {
    boxes[id] = new Box(id, opts);
    return boxes[id];
};

// dismiss a single box (or all by omitting id param)
Boxzilla.dismiss = function(id) {
    // if no id given, dismiss all current open boxes
    if( typeof(id) === "undefined" ) {
        each(boxes, function(box) { box.dismiss(); });
    } else if( typeof( boxes[id] ) === "object" ) {
        boxes[id].dismiss();
    }
};

Boxzilla.hide = function(id) {
    if( typeof(id) === "undefined" ) {
        each(boxes, function(box) { box.hide(); });
    } else if( typeof( boxes[id] ) === "object" ) {
        boxes[id].hide();
    }
};

Boxzilla.show = function(id) {
    if( typeof(id) === "undefined" ) {
        each(boxes, function(box) { box.show(); });
    } else if( typeof( boxes[id] ) === "object" ) {
        boxes[id].show();
    }
};

Boxzilla.toggle = function(id) {
    if( typeof(id) === "undefined" ) {
        each(boxes, function(box) { box.toggle(); });
    } else if( typeof( boxes[id] ) === "object" ) {
        boxes[id].toggle();
    }
};

if ( typeof module !== 'undefined' && module.exports ) {
    module.exports = Boxzilla;
} else {
    this.Boxzilla = Boxzilla;
}