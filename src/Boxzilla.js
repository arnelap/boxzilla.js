'use strict';

var $ = window.jQuery,
    EventEmitter = require('wolfy87-eventemitter'),
    Boxzilla = Object.create(EventEmitter.prototype),
    Box = require('./Box.js')(Boxzilla),
    boxes = {},
    windowHeight = window.innerHeight,
    overlay = document.createElement('div'),
    exitIntentDelayTimer,
    exitIntentTriggered;

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

function checkTimeCriteria() {
    var start = sessionStorage.getItem('boxzilla_start_time');
    var now = Date.now();
    var timeOnSite = ( now - start ) / 1000;

    each(boxes, function(box) {
        if( ! box.mayAutoShow() || box.config.trigger.method !== 'time_on_site' ) {
            return;
        }

        if( timeOnSite > box.config.trigger.value ) {
            box.trigger();
        }
    });
}

// check triggerHeight criteria for all boxes
function checkHeightCriteria() {
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

function triggerExitIntent() {
    if(exitIntentTriggered) return;

    each(boxes, function(box) {
        if(box.mayAutoShow() && box.config.trigger.method === 'exit_intent' ) {
            box.trigger();
        }
    });

    exitIntentTriggered = true;
}

function onMouseLeave(e) {
    // did mouse leave at top of window?
    if( e.clientY < 0 ) {
        exitIntentDelayTimer = window.setTimeout(triggerExitIntent, 1000);
    }
}

function onMouseEnter() {
    if( exitIntentDelayTimer ) {
        window.clearInterval(exitIntentDelayTimer);
        exitIntentDelayTimer = null;
    }
}

// initialise & add event listeners
Boxzilla.init = function() {
    // add overlay element to dom
    overlay.id = 'boxzilla-overlay';
    document.body.appendChild(overlay);

    // event binds
    $(window).on('scroll', throttle(checkHeightCriteria));
    $(window).on('resize', throttle(recalculateHeights));
    $(window).on('load', recalculateHeights );
    $(document).on('mouseleave', onMouseLeave);
    $(document).on('mouseenter', onMouseEnter);
    $(document).keyup(onKeyUp);
    $(overlay).click(onOverlayClick);
    window.setInterval(checkTimeCriteria, 1000);

    if(! sessionStorage.getItem('boxzilla_start_time')) {
        sessionStorage.setItem('boxzilla_start_time', Date.now());
    }

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