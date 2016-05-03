'use strict';

var $ = window.jQuery,
    Box = require('./Box.js'),
    EventEmitter = require('wolfy87-eventemitter'),
    boxes = {},
    inited = false,
    windowHeight = window.innerHeight,
    overlay = document.createElement('div'),
    events = new EventEmitter;

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

// initialise & add event listeners
function init() {
    // make sure we only init once
    if( inited ) return;

    // add overlay element to dom
    overlay.id = 'boxzilla-overlay';
    document.body.appendChild(overlay);

    // event binds
    $(window).bind('scroll', throttle(checkBoxCriterias));
    $(window).bind('resize', throttle(recalculateHeights));
    $(window).bind('load', recalculateHeights );
    $(document).keyup(onKeyUp);
    $(overlay).click(onOverlayClick);

    inited = true;
    events.trigger('ready');
}

// create a Box object from the DOM
function create(id, opts) {
    boxes[id] = new Box(id, opts, events);
}

// "keyup" listener
function onKeyUp(e) {
    if (e.keyCode == 27) {
        dismissAllBoxes();
    }
}

// check criteria for all registered boxes
// todo: refactor part of this into box object?
function checkBoxCriterias() {

    var scrollY = window.scrollY;
    var scrollHeight = scrollY + ( windowHeight * 0.9 );

    for( var boxId in boxes ) {
        var box = boxes[boxId];

        if( ! box.mayAutoShow() ) {
            continue;
        }

        if( box.triggerHeight <= 0 ) {
            continue;
        }

        if( scrollHeight > box.triggerHeight ) {
            if( ! box.visible ) {
                box.show();
                box.triggered = true;
            }
        } else if( box.mayAutoHide() ) {
            if( box.visible ) {
                box.hide();
            }
        }
    }
}

// recalculate heights and variables based on height
function recalculateHeights() {
    windowHeight = window.innerHeight;

    for( var boxId in boxes ) {
        var box = boxes[boxId];
        box.setCustomBoxStyling();
    }
}

// dismiss a single box (or all by omitting id param)
function dismiss(id) {
    // if no id given, dismiss all current open boxes
    if( typeof(id) === "undefined" ) {
        boxes.forEach(function(box) { box.dismiss(); });
    } else if( typeof( boxes[id] ) === "object" ) {
        boxes[id].dismiss();
    }
}

function hide(id) {
    if( typeof(id) === "undefined" ) {
        boxes.forEach(function(box) { box.hide() });
    } else if( typeof( boxes[id] ) === "object" ) {
        boxes[id].hide();
    }
}

function show(id) {
    if( typeof(id) === "undefined" ) {
        boxes.forEach(function(box) { box.show() });
    } else if( typeof( boxes[id] ) === "object" ) {
        boxes[id].show();
    }
}

function toggleBox(id) {
    if( typeof( boxes[id] ) === "object" ) {
        boxes[id].toggle();
    }
}

function onOverlayClick(e) {
    var x = e.offsetX;
    var y = e.offsetY;

    // calculate if click was near a box to avoid closing it (click error margin)
    for(var boxId in boxes ) {
        var box = boxes[boxId];
        var rect = box.element.getBoundingClientRect();
        var margin = 100 + ( window.innerWidth * 0.05 );

        // if click was not anywhere near box, dismiss it.
        if( x < ( rect.left - margin ) || x > ( rect.right + margin ) || y < ( rect.top - margin ) || y > ( rect.bottom + margin ) ) {
            box.dismiss();
        }
    }
}

// expose a simple API to control all registered boxes
var api = {
    'init': init,
    'create': create,
    'boxes': boxes,
    'showBox': show,
    'hideBox': hide,
    'toggleBox': toggleBox,
    'dismiss': dismiss
};

api.prototype = Object.create(events);

if ( typeof module !== 'undefined' && module.exports ) {
    module.exports = api;
} else {
    this.Boxzilla = api;
}