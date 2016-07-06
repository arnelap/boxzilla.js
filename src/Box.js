'use strict';

var defaults = {
        'animation': 'fade',
        'rehide': false,
        'content': '',
        'cookieTime': 0,
        'icon': '&times',
        'minimumScreenWidth': 0,
        'position': 'center',
        'testMode': false,
        'trigger': false,
        'closable': true
    },
    Boxzilla,
    Animator = require('./Animator.js');


/**
 * Merge 2 objects, values of the latter overwriting the former.
 *
 * @param obj1
 * @param obj2
 * @returns {*}
 */
function merge( obj1, obj2 ) {
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}

// Box Object
var Box = function( id, config ) {
    this.id 		= id;

    // store config values
    this.config = merge(defaults, config);

    // store ref to overlay
    this.overlay = document.getElementById('boxzilla-overlay');

    // state
    this.visible 	= false;
    this.closed 	= false;
    this.triggered 	= false;
    this.triggerHeight = 0;
    this.cookieSet = false;

    // if a trigger was given, calculate values once and store
    if( this.config.trigger ) {
        if( this.config.trigger.method === 'percentage' || this.config.trigger.method === 'element' ) {
            this.triggerHeight = this.calculateTriggerHeight();
        }

        this.cookieSet = this.isCookieSet();
    }

    // create dom element for this box
    this.element = this.dom();

    // further initialise the box
    this.events();
};

// initialise the box
Box.prototype.events = function() {
    var box = this;

    // attach event to "close" icon inside box
    this.element.querySelector('.boxzilla-close-icon').addEventListener('click', box.dismiss.bind(this));

    this.element.addEventListener('click', function(e) {
        if( e.target.tagName === 'A' ) {
            Boxzilla.trigger('box.interactions.link', [ box, e.target ] );
        }
    }, false);

    this.element.addEventListener('submit', function(e) {
        box.setCookie();
        Boxzilla.trigger('box.interactions.form', [ box, e.target ]);
    }, false);

    // attach event to all links referring #boxzilla-{box_id}
    document.body.addEventListener('click', function(e) {
        var href = "#boxzilla-" + box.id;
        if(e.target.tagName === 'A' && e.target.getAttribute("href").substring(-(href.length)) === href) {
            box.toggle();
            e.preventDefault();
        }
    }, false);

    // maybe show box right away
    if( this.fits() && this.locationHashRefersBox() ) {
        window.addEventListener('load', this.show.bind(this));
    }

};

// generate dom elements for this box
Box.prototype.dom = function() {
    var wrapper = document.createElement('div');
    wrapper.className = 'boxzilla-container boxzilla-' + this.config.position + '-container';

    var box = document.createElement('div');
    box.setAttribute('id', 'boxzilla-' + this.id);
    box.className = 'boxzilla boxzilla-' + this.id + ' boxzilla-' + this.config.position;
    box.style.display = 'none';
    wrapper.appendChild(box);

    var content = document.createElement('div');
    content.className = 'boxzilla-content';
    content.innerHTML = this.config.content;
    box.appendChild(content);

    // remove <script> from box content and append them to the document body
    var scripts = content.querySelectorAll('script');
    if(scripts.length) {
        var script = document.createElement('script');
        for( var i=0; i<scripts.length; i++ ) {
            script.appendChild(document.createTextNode(scripts[i].text));
            scripts[i].parentNode.removeChild(scripts[i]);
        }
        document.body.appendChild(script);
    }
    
    if( this.config.closable && this.config.icon ) {
        var icon = document.createElement('span');
        icon.className = "boxzilla-close-icon";
        icon.innerHTML = this.config.icon;
        box.appendChild(icon);
    }

    document.body.appendChild(wrapper);

    return box;
};

// set (calculate) custom box styling depending on box options
Box.prototype.setCustomBoxStyling = function() {

    // reset element to its initial state
    this.element.style.overflowY = 'auto';
    this.element.style.maxHeight = 'none';

    // get new dimensions
    var windowHeight = window.innerHeight;
    var boxHeight = this.element.clientHeight;

    // add scrollbar to box and limit height
    if( boxHeight > windowHeight ) {
        this.element.style.maxHeight = windowHeight + "px";
        this.element.style.overflowY = 'scroll';
    }

    // set new top margin for boxes which are centered
    if( this.config.position === 'center' ) {
        var newTopMargin = ( ( windowHeight - boxHeight ) / 2 );
        newTopMargin = newTopMargin >= 0 ? newTopMargin : 0;
        this.element.style.marginTop = newTopMargin + "px";
    }

};

// toggle visibility of the box
Box.prototype.toggle = function(show) {

    // revert visibility if no explicit argument is given
    if( typeof( show ) === "undefined" ) {
        show = ! this.visible;
    }

    // is box already at desired visibility?
    if( show === this.visible ) {
        return false;
    }

    // is box being animated?
    if( Animator.animated(this.element) ) {
        return false;
    }

    // if box should be hidden but is not closable, bail.
    if( ! show && ! this.config.closable ) {
        return false;
    }

    // set new visibility status
    this.visible = show;

    // trigger event
    Boxzilla.trigger('box.' + ( show ? 'show' : 'hide' ), [ this ] );

    // show or hide box using selected animation
    if( this.config.position === 'center' ) {
        Animator.toggle(this.overlay, "fade");
    }

    Animator.toggle(this.element, this.config.animation);

    // focus on first input field in box
    var firstInput = this.element.querySelector('input, textarea');
    if(firstInput) {
        firstInput.focus();
    }

    return true;
};

// show the box
Box.prototype.show = function() {
    return this.toggle(true);
};

// hide the box
Box.prototype.hide = function() {
    return this.toggle(false);
};

// calculate trigger height
Box.prototype.calculateTriggerHeight = function() {
    var triggerHeight = 0;

    if( this.config.trigger.method === 'element' ) {
        var triggerElement = document.body.querySelector(this.config.trigger.value);
        if( triggerElement ) {
            var offset = triggerElement.getBoundingClientRect();
            triggerHeight = offset.top;
        }
    } else if( this.config.trigger.method === 'percentage' ) {
        triggerHeight = ( this.config.trigger.value / 100 * document.body.clientHeight );
    }

    return triggerHeight;
};

// set cookie that disables automatically showing the box
Box.prototype.setCookie = function() {
    // do nothing if cookieTime evaluates to false
    if(! this.config.cookieTime) {
        return;
    }

    var expiryDate = new Date();
    expiryDate.setDate( expiryDate.getDate() + this.config.cookieTime );
    document.cookie = 'boxzilla_box_'+ this.id + '=true; expires='+ expiryDate.toUTCString() +'; path=/';
};

// checks whether window.location.hash equals the box element ID or that of any element inside the box
Box.prototype.locationHashRefersBox = function() {

    if( ! window.location.hash || 0 === window.location.hash.length ) {
        return false;
    }

    var elementId = window.location.hash.substring(1);
    if( elementId === this.element.id ) {
        return true;
    } else if( this.element.querySelector('#' + elementId) ) {
        return true;
    }

    return false;
};

Box.prototype.fits = function() {
    if( this.config.minimumScreenWidth <= 0 ) {
        return true;
    }

    return window.innerWidth > this.config.minimumScreenWidth
};

// is this box enabled?
Box.prototype.mayAutoShow = function() {

    // don't show if box was closed (dismissed) before
    if( this.closed ) {
        return false;
    }

    // check if box fits on given minimum screen width
    if( ! this.fits() ) {
        return false;
    }

    // if trigger empty or error in calculating triggerHeight, return false
    if( ! this.config.trigger ) {
        return false;
    }

    // rely on cookie value (show if not set, don't show if set)
    return ! this.cookieSet;
};

Box.prototype.mayRehide = function() {
    return this.config.rehide && this.triggered;
};

Box.prototype.isCookieSet = function() {
    // always show on test mode
    if( this.config.testMode ) {
        return false;
    }

    // check for cookie
    if( ! this.config.cookieTime ) {
        return false;
    }

    var cookieSet = document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + 'boxzilla_box_' + this.id + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1") === "true";
    return cookieSet;

};

Box.prototype.trigger = function() {
    var shown = this.show();
    if( shown ) {
        this.triggered = true;
    }
};

Box.prototype.dismiss = function() {
    this.hide();
    this.setCookie();
    this.closed = true;
    Boxzilla.trigger('box.dismiss', [ this ]);
};

module.exports = function(_Boxzilla) {
    Boxzilla = _Boxzilla;
    return Box;
};