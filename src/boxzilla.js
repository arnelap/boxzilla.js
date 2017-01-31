'use strict';

var EventEmitter = require('wolfy87-eventemitter'),
    Boxzilla = Object.create(EventEmitter.prototype),
    Box = require('./box.js')(Boxzilla),
    Timer = require('./timer.js'),
    boxes = [],
    overlay,
    scrollElement = window,
    exitIntentDelayTimer, exitIntentTriggered,
    siteTimer, pageTimer, pageViews;

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

    // don't bother if another box is currently open
    if( isAnyBoxVisible() ) {
        return;
    }

    boxes.forEach(function(box) {
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
    // don't bother if another box is currently open
    if( isAnyBoxVisible() ) {
        return;
    }

    boxes.forEach(function(box) {
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
  var scrollY = scrollElement.hasOwnProperty('scrollY') ? scrollElement.scrollY : scrollElement.scrollTop;
  scrollY = scrollY + window.innerHeight * 0.75;

  boxes.forEach(function(box) {
      if( ! box.mayAutoShow() || box.triggerHeight <= 0 ) {
          return;
      }

      if( scrollY > box.triggerHeight ) {
          // don't bother if another box is currently open
          if( isAnyBoxVisible() ) {
              return;
          }

          // trigger box
          box.trigger();
      } else if( box.mayRehide() ) {
          box.hide();
      }
  });
}

// recalculate heights and variables based on height
function recalculateHeights() {
    boxes.forEach(function(box) {
        box.setCustomBoxStyling();
    });
}

function onOverlayClick(e) {
    var x = e.offsetX;
    var y = e.offsetY;

    // calculate if click was near a box to avoid closing it (click error margin)
    boxes.forEach(function(box) {
        var rect = box.element.getBoundingClientRect();
        var margin = 100 + ( window.innerWidth * 0.05 );

        // if click was not anywhere near box, dismiss it.
        if( x < ( rect.left - margin ) || x > ( rect.right + margin ) || y < ( rect.top - margin ) || y > ( rect.bottom + margin ) ) {
            box.dismiss();
        }
    });
}

function triggerExitIntent() {
    // do nothing if already triggered OR another box is visible.
    if(exitIntentTriggered || isAnyBoxVisible() ) {
        return;
    }

    boxes.forEach(function(box) {
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

function isAnyBoxVisible() {

    for( var i=0; i<boxes.length; i++ ) {
        var box = boxes[i];

        if( box.visible ) {
            return true;
        }
    }

    return false;
}

function onMouseEnter() {
    if( exitIntentDelayTimer ) {
        window.clearInterval(exitIntentDelayTimer);
        exitIntentDelayTimer = null;
    }
}

function onElementClick(e) {
    var el = e.target || e.srcElement;
    if( el && el.tagName === 'A' && el.getAttribute('href').indexOf('#boxzilla-') === 0 ) {
        var boxId = e.target.getAttribute('href').substring("#boxzilla-".length);
        Boxzilla.toggle(boxId);
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
    window.addEventListener('click', onElementClick, false);
    siteTimer = new Timer(sessionStorage.getItem('boxzilla_timer') || 0);
    pageTimer = new Timer(0);
    pageViews = sessionStorage.getItem('boxzilla_pageviews') || 0;

    // sniff user agent for mobile safari fix...(https://stackoverflow.com/questions/29001977/safari-in-ios8-is-scrolling-screen-when-fixed-elements-get-focus#29064810)
    var ua = navigator.userAgent.toLowerCase();
    if( ua.indexOf('safari') > -1 && ua.indexOf('mobile') > -1 ) {
      scrollElement = document.body;
      document.documentElement.className = document.documentElement.className + ' mobile-safari';
    }

    // insert styles into DOM
    var styles = require('./styles.js');
    var styleElement = document.createElement('style');
    styleElement.setAttribute("type", "text/css");
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);

    // add overlay element to dom
    overlay = document.createElement('div');
    overlay.style.display = 'none';
    overlay.id = 'boxzilla-overlay';
    document.body.appendChild(overlay);

    // event binds
    scrollElement.addEventListener('scroll', throttle(checkHeightCriteria), true );
    window.addEventListener('resize', throttle(recalculateHeights));
    window.addEventListener('load', recalculateHeights );
    overlay.addEventListener('click', onOverlayClick);
    window.setInterval(checkTimeCriteria, 1000);
    window.setTimeout(checkPageViewsCriteria, 1000 );
    document.documentElement.addEventListener('mouseleave', onMouseLeave);
    document.documentElement.addEventListener('mouseenter', onMouseEnter);
    document.addEventListener('keyup', onKeyUp);

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
    var box = new Box(id, opts);
    boxes.push(box);
    return box;
};

Boxzilla.get = function(id) {
    for( var i=0; i<boxes.length; i++) {
        var box = boxes[i];
        if( box.id == id ) {
            return box;
        }
    }

    throw new Error("No box exists with ID " + id);
}

// dismiss a single box (or all by omitting id param)
Boxzilla.dismiss = function(id) {
    // if no id given, dismiss all current open boxes
    if( typeof(id) === "undefined" ) {
        boxes.forEach(function(box) { box.dismiss(); });
    } else if( typeof( boxes[id] ) === "object" ) {
        Boxzilla.get(id).dismiss();
    }
};

Boxzilla.hide = function(id) {
    if( typeof(id) === "undefined" ) {
        boxes.forEach(function(box) { box.hide(); });
    } else {
        Boxzilla.get(id).hide();
    }
};

Boxzilla.show = function(id) {
    if( typeof(id) === "undefined" ) {
        boxes.forEach(function(box) { box.show(); });
    } else {
        Boxzilla.get(id).show();
    }
};

Boxzilla.toggle = function(id) {
    if( typeof(id) === "undefined" ) {
        boxes.forEach(function(box) { box.toggle(); });
    } else {
        Boxzilla.get(id).toggle();
    }
};

// expose each individual box.
Boxzilla.boxes = boxes;

window.Boxzilla = Boxzilla;

if ( typeof module !== 'undefined' && module.exports ) {
    module.exports = Boxzilla;
}
