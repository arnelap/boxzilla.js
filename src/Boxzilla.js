'use strict';

var EventEmitter = require('wolfy87-eventemitter'),
    Boxzilla = Object.create(EventEmitter.prototype),
    Box = require('./Box.js')(Boxzilla),
    Timer = require('./Timer.js'),
    boxes = {},
    windowHeight = window.innerHeight,
    overlay,
    exitIntentDelayTimer,
    exitIntentTriggered,
    siteTimer = new Timer(sessionStorage.getItem('boxzilla_timer') || 0),
    pageTimer = new Timer(0),
    pageViews = sessionStorage.getItem('boxzilla_pageviews') || 0;

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

// check "pageviews" criteria for each box
function checkPageViewsCriteria() {
    each(boxes, function(box) {
        if( ! box.mayAutoShow() ) {
            return;
        }

        if( box.config.trigger.method === 'pageviews' && pageViews >= box.config.trigger.value ) {
            box.trigger();
        }
    });
}

// check time trigger criteria for each box
function checkTimeCriteria() {
    each(boxes, function(box) {
        if( ! box.mayAutoShow() ) {
            return;
        }

        // check "time on site" trigger
        if (box.config.trigger.method === 'time_on_site' && siteTimer.time >= box.config.trigger.value) {
            box.trigger();
        }

        // check "time on page" trigger
        if (box.config.trigger.method === 'time_on_page' && pageTimer.time >= box.config.trigger.value) {
            box.trigger();
        }
    });
}

// check triggerHeight criteria for all boxes
function checkHeightCriteria() {
    var scrollY = window.scrollY;
    var scrollHeight = scrollY + ( windowHeight * 0.667 );

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
    var delay = 400;

    // did mouse leave at top of window?
    if( e.clientY <= 0 ) {
        exitIntentDelayTimer = window.setTimeout(triggerExitIntent, delay);
    }
}

function onMouseEnter() {
    if( exitIntentDelayTimer ) {
        window.clearInterval(exitIntentDelayTimer);
        exitIntentDelayTimer = null;
    }
}

var timers = {
    start: function() {
        var sessionTime = sessionStorage.getItem('boxzilla_timer');
        if( sessionTime ) siteTimer.time = sessionTime;
        siteTimer.start();
        pageTimer.start();
    },
    stop: function() {
        sessionStorage.setItem('boxzilla_timer', siteTimer.time);
        siteTimer.stop();
        pageTimer.stop();
    }
};

// initialise & add event listeners
Boxzilla.init = function() {
    // add overlay element to dom
    overlay = document.createElement('div');
    overlay.style.display = 'none';
    overlay.id = 'boxzilla-overlay';
    document.body.appendChild(overlay);

    // event binds
    window.addEventListener('scroll', throttle(checkHeightCriteria));
    window.addEventListener('resize', throttle(recalculateHeights));
    window.addEventListener('load', recalculateHeights );
    window.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('mouseenter', onMouseEnter);
    window.addEventListener('keyup', onKeyUp);
    overlay.addEventListener('click', onOverlayClick);
    window.setInterval(checkTimeCriteria, 1000);
    window.setTimeout(checkPageViewsCriteria, 1000 );

    timers.start();
    window.addEventListener('focus', timers.start);
    window.addEventListener('beforeunload', function() {
        timers.stop();
        sessionStorage.setItem('boxzilla_pageviews', ++pageViews);
    });
    window.addEventListener('blur', timers.stop);

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

window.Boxzilla = Boxzilla;

if ( typeof module !== 'undefined' && module.exports ) {
    module.exports = Boxzilla;
}