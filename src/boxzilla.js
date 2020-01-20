'use strict';

const Boxzilla = require('./events.js');
const Box = require('./box.js');
const util = require('./util.js');
const styles = require('./styles.js');
const ExitIntent = require('./triggers/exit-intent.js');
const Scroll = require('./triggers/scroll.js');
const Pageviews = require('./triggers/pageviews.js');
const Time = require('./triggers/time.js');

let initialised = false;
let boxes = [];

// "keyup" listener
function onKeyUp(e) {
    if (e.keyCode === 27) {
        Boxzilla.dismiss();
    }
}

// recalculate heights and variables based on height
function recalculateHeights() {
    boxes.forEach(box => box.onResize());
}

function onElementClick(evt) {
  // find <a> element in up to 3 parent elements
  var el = evt.target || evt.srcElement;
  var depth = 3
  for(var i=0; i<=depth; i++) {
    if(!el || el.tagName === 'A') {
      break;
    }

    el = el.parentElement;
  }

  if( ! el || el.tagName !== 'A' || ! el.href ) {
    return;
  }

  const href = el.href.toLowerCase();
  const match = href.match(/[#&]boxzilla-(\d+)/);

  if( match && match.length > 1) {
      const boxId = match[1];
      Boxzilla.toggle(boxId);
  }
}

// initialise & add event listeners
Boxzilla.init = function() {
    if (initialised) {
        return;
    }

    // insert styles into DOM
    const styleElement = document.createElement('style');
    styleElement.setAttribute("type", "text/css");
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);

    // init exit intent triggershow
    new ExitIntent(boxes);
    new Pageviews(boxes);
    new Scroll(boxes);
    new Time(boxes);

    document.body.addEventListener('click', onElementClick, true);
    window.addEventListener('resize', util.throttle(recalculateHeights));
    window.addEventListener('load', recalculateHeights );
    document.addEventListener('keyup', onKeyUp);
   
    Boxzilla.trigger('ready');
    initialised = true; // ensure this function doesn't run again
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
    // preserve backwards compat for minimumScreenWidth option
    if (typeof(opts.minimumScreenWidth) !== "undefined") {
      opts.screenWidthCondition = {
        condition: "larger",
        value: opts.minimumScreenWidth,
      }
    }

    const box = new Box(id, opts);
    boxes.push(box);
    return box;
};

Boxzilla.get = function(id) {
    for (var i=0; i<boxes.length; i++) {
        if (boxes[i].id == id) {
            return boxes[i];
        }
    }

    throw new Error("No box exists with ID " + id);
}


// dismiss a single box (or all by omitting id param)
Boxzilla.dismiss = function(id, animate) {
    // if no id given, dismiss all current open boxes
    if (id) {
        Boxzilla.get(id).dismiss(animate);
    } else {
        boxes.forEach(box => box.dismiss(animate))
    }
};

Boxzilla.hide = function(id, animate) {
    if (id) {
        Boxzilla.get(id).hide(animate);
    } else {
        boxes.forEach(box => box.hide(animate))
    }
};

Boxzilla.show = function(id, animate) {
    if (id) {
        Boxzilla.get(id).show(animate);
    } else {
        boxes.forEach(box => box.show(animate))
    }
};

Boxzilla.toggle = function(id, animate) {
    if (id) {
        Boxzilla.get(id).toggle(animate);
    } else {
        boxes.forEach(box => box.toggle(animate))
    }
};

// expose each individual box.
Boxzilla.boxes = boxes;

// expose boxzilla object
window.Boxzilla = Boxzilla;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Boxzilla;
}
