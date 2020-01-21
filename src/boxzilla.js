'use strict';

const Box = require('./box.js');
const util = require('./util.js');
const styles = require('./styles.js');
const ExitIntent = require('./triggers/exit-intent.js');
const Scroll = require('./triggers/scroll.js');
const Pageviews = require('./triggers/pageviews.js');
const Time = require('./triggers/time.js');

let initialised = false;
let boxes = [];
let listeners = {};

// "keyup" listener
function onKeyUp(evt) {
    if (evt.keyCode === 27) {
        Boxzilla.dismiss();
    }
}

// recalculate heights and variables based on height
function recalculateHeights() {
    boxes.forEach(box => box.onResize());
}

function onElementClick(evt) {
  let el = evt.target;
  let depth = 3

  for (let i=0; i<=depth; i++) {
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

function trigger(event, args) {
    listeners[event] = listeners[event] || [];
    listeners[event].forEach(f => f.apply(null, args));
}

function on(event, func) {
    listeners[event] = listeners[event] || [];
    listeners[event].push(func);
}

function off(event, func) {
    listeners[event] = listeners[event] || [];
    listeners[event] = listeners[event].filter(f => f !== func)
}

// initialise & add event listeners
function init() {
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
}

function create(id, opts) {
    // preserve backwards compat for minimumScreenWidth option
    if (typeof(opts.minimumScreenWidth) !== "undefined") {
      opts.screenWidthCondition = {
        condition: "larger",
        value: opts.minimumScreenWidth,
      }
    }

    const box = new Box(id, opts, trigger);
    boxes.push(box);
    return box;
}

function get(id) {
    for (let i=0; i<boxes.length; i++) {
        if (String(boxes[i].id) === String(id)) {
            return boxes[i];
        }
    }

    throw new Error("No box exists with ID " + id);
}


// dismiss a single box (or all by omitting id param)
function dismiss(id, animate) {
    // if no id given, dismiss all current open boxes
    if (id) {
        Boxzilla.get(id).dismiss(animate);
    } else {
        boxes.forEach(box => box.dismiss(animate))
    }
}

function hide(id, animate) {
    if (id) {
        Boxzilla.get(id).hide(animate);
    } else {
        boxes.forEach(box => box.hide(animate))
    }
}

function show(id, animate) {
    if (id) {
        Boxzilla.get(id).show(animate);
    } else {
        boxes.forEach(box => box.show(animate))
    }
}

function toggle(id, animate) {
    if (id) {
        Boxzilla.get(id).toggle(animate);
    } else {
        boxes.forEach(box => box.toggle(animate))
    }
}

// expose boxzilla object
const Boxzilla = {off, on, get, init, create, trigger, show, hide, dismiss, toggle, boxes};
window.Boxzilla = Boxzilla;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Boxzilla;
}
