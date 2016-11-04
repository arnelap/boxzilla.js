"use strict";

(function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = typeof require == "function" && require;if (!u && a) return a(o, !0);if (i) return i(o, !0);var f = new Error("Cannot find module '" + o + "'");throw f.code = "MODULE_NOT_FOUND", f;
            }var l = n[o] = { exports: {} };t[o][0].call(l.exports, function (e) {
                var n = t[o][1][e];return s(n ? n : e);
            }, l, l.exports, e, t, n, r);
        }return n[o].exports;
    }var i = typeof require == "function" && require;for (var o = 0; o < r.length; o++) {
        s(r[o]);
    }return s;
})({ 1: [function (require, module, exports) {
        var duration = 320;

        function css(element, styles) {
            for (var property in styles) {
                element.style[property] = styles[property];
            }
        }

        function initObjectProperties(properties, value) {
            var newObject = {};
            for (var i = 0; i < properties.length; i++) {
                newObject[properties[i]] = value;
            }
            return newObject;
        }

        function copyObjectProperties(properties, object) {
            var newObject = {};
            for (var i = 0; i < properties.length; i++) {
                newObject[properties[i]] = object[properties[i]];
            }
            return newObject;
        }

        /**
         * Checks if the given element is currently being animated.
         *
         * @param element
         * @returns {boolean}
         */
        function animated(element) {
            return !!element.getAttribute('data-animated');
        }

        /**
         * Toggles the element using the given animation.
         *
         * @param element
         * @param animation Either "fade" or "slide"
         */
        function toggle(element, animation) {
            var nowVisible = element.style.display != 'none' || element.offsetLeft > 0;

            // create clone for reference
            var clone = element.cloneNode(true);
            var cleanup = function cleanup() {
                element.removeAttribute('data-animated');
                element.setAttribute('style', clone.getAttribute('style'));
                element.style.display = nowVisible ? 'none' : '';
            };

            // store attribute so everyone knows we're animating this element
            element.setAttribute('data-animated', "true");

            // toggle element visiblity right away if we're making something visible
            if (!nowVisible) {
                element.style.display = '';
            }

            var hiddenStyles, visibleStyles;

            // animate properties
            if (animation === 'slide') {
                hiddenStyles = initObjectProperties(["height", "borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom"], 0);
                visibleStyles = {};

                if (!nowVisible) {
                    var computedStyles = window.getComputedStyle(element);
                    visibleStyles = copyObjectProperties(["height", "borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom"], computedStyles);
                    css(element, hiddenStyles);
                }

                // don't show a scrollbar during animation
                element.style.overflowY = 'hidden';
                animate(element, nowVisible ? hiddenStyles : visibleStyles, cleanup);
            } else {
                hiddenStyles = { opacity: 0 };
                visibleStyles = { opacity: 1 };
                if (!nowVisible) {
                    css(element, hiddenStyles);
                }

                animate(element, nowVisible ? hiddenStyles : visibleStyles, cleanup);
            }
        }

        function animate(element, targetStyles, fn) {
            var last = +new Date();
            var initialStyles = window.getComputedStyle(element);
            var currentStyles = {};
            var propSteps = {};

            for (var property in targetStyles) {
                // make sure we have an object filled with floats
                targetStyles[property] = parseFloat(targetStyles[property]);

                // calculate step size & current value
                var to = targetStyles[property];
                var current = parseFloat(initialStyles[property]);

                // is there something to do?
                if (current == to) {
                    delete targetStyles[property];
                    continue;
                }

                propSteps[property] = (to - current) / duration; // points per second
                currentStyles[property] = current;
            }

            var tick = function tick() {
                var now = +new Date();
                var timeSinceLastTick = now - last;
                var done = true;

                var step, to, increment, newValue;
                for (var property in targetStyles) {
                    step = propSteps[property];
                    to = targetStyles[property];
                    increment = step * timeSinceLastTick;
                    newValue = currentStyles[property] + increment;

                    if (step > 0 && newValue >= to || step < 0 && newValue <= to) {
                        newValue = to;
                    } else {
                        done = false;
                    }

                    // store new value
                    currentStyles[property] = newValue;

                    var suffix = property !== "opacity" ? "px" : "";
                    element.style[property] = newValue + suffix;
                }

                last = +new Date();

                // keep going until we're done for all props
                if (!done) {
                    window.requestAnimationFrame && requestAnimationFrame(tick) || setTimeout(tick, 32);
                } else {
                    // call callback
                    fn && fn();
                }
            };

            tick();
        }

        module.exports = {
            'toggle': toggle,
            'animate': animate,
            'animated': animated
        };
    }, {}], 2: [function (require, module, exports) {
        'use strict';

        var defaults = {
            'animation': 'fade',
            'rehide': false,
            'content': '',
            'cookie': null,
            'icon': '&times',
            'minimumScreenWidth': 0,
            'position': 'center',
            'testMode': false,
            'trigger': false,
            'closable': true
        },
            Boxzilla,
            Animator = require('./animator.js');

        /**
         * Merge 2 objects, values of the latter overwriting the former.
         *
         * @param obj1
         * @param obj2
         * @returns {*}
         */
        function merge(obj1, obj2) {
            var obj3 = {};
            for (var attrname in obj1) {
                obj3[attrname] = obj1[attrname];
            }
            for (var attrname in obj2) {
                obj3[attrname] = obj2[attrname];
            }
            return obj3;
        }

        /**
         * Get the real height of entire document.
         * @returns {number}
         */
        function getDocumentHeight() {
            var body = document.body,
                html = document.documentElement;

            var height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);

            return height;
        }

        // Box Object
        var Box = function Box(id, config) {
            this.id = id;

            // store config values
            this.config = merge(defaults, config);

            // store ref to overlay
            this.overlay = document.getElementById('boxzilla-overlay');

            // state
            this.visible = false;
            this.dismissed = false;
            this.triggered = false;
            this.triggerHeight = 0;
            this.cookieSet = false;
            this.element = null;
            this.closeIcon = null;

            // if a trigger was given, calculate values once and store
            if (this.config.trigger) {
                if (this.config.trigger.method === 'percentage' || this.config.trigger.method === 'element') {
                    this.triggerHeight = this.calculateTriggerHeight();
                }

                this.cookieSet = this.isCookieSet();
            }

            // create dom elements for this box
            this.dom();

            // further initialise the box
            this.events();
        };

        // initialise the box
        Box.prototype.events = function () {
            var box = this;

            // attach event to "close" icon inside box
            this.closeIcon && this.closeIcon.addEventListener('click', box.dismiss.bind(this));

            this.element.addEventListener('click', function (e) {
                if (e.target.tagName === 'A') {
                    Boxzilla.trigger('box.interactions.link', [box, e.target]);
                }
            }, false);

            this.element.addEventListener('submit', function (e) {
                box.setCookie();
                Boxzilla.trigger('box.interactions.form', [box, e.target]);
            }, false);

            window.addEventListener("hashchange", function () {
                var needle = "#boxzilla-" + box.id;
                if (location.hash === needle) {
                    box.toggle();
                }
            });

            // maybe show box right away
            if (this.fits() && this.locationHashRefersBox()) {
                window.addEventListener('load', this.show.bind(this));
            }
        };

        // generate dom elements for this box
        Box.prototype.dom = function () {
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
            if (scripts.length) {
                var script = document.createElement('script');
                for (var i = 0; i < scripts.length; i++) {
                    script.appendChild(document.createTextNode(scripts[i].text));
                    scripts[i].parentNode.removeChild(scripts[i]);
                }
                document.body.appendChild(script);
            }

            if (this.config.closable && this.config.icon) {
                var closeIcon = document.createElement('span');
                closeIcon.className = "boxzilla-close-icon";
                closeIcon.innerHTML = this.config.icon;
                box.appendChild(closeIcon);
                this.closeIcon = closeIcon;
            }

            document.body.appendChild(wrapper);
            this.element = box;
        };

        // set (calculate) custom box styling depending on box options
        Box.prototype.setCustomBoxStyling = function () {

            // reset element to its initial state
            var origDisplay = this.element.style.display;
            this.element.style.display = '';
            this.element.style.overflowY = 'auto';
            this.element.style.maxHeight = 'none';

            // get new dimensions
            var windowHeight = window.innerHeight;
            var boxHeight = this.element.clientHeight;

            // add scrollbar to box and limit height
            if (boxHeight > windowHeight) {
                this.element.style.maxHeight = windowHeight + "px";
                this.element.style.overflowY = 'scroll';
            }

            // set new top margin for boxes which are centered
            if (this.config.position === 'center') {
                var newTopMargin = (windowHeight - boxHeight) / 2;
                newTopMargin = newTopMargin >= 0 ? newTopMargin : 0;
                this.element.style.marginTop = newTopMargin + "px";
            }

            this.element.style.display = origDisplay;
        };

        // toggle visibility of the box
        Box.prototype.toggle = function (show) {

            // revert visibility if no explicit argument is given
            if (typeof show === "undefined") {
                show = !this.visible;
            }

            // is box already at desired visibility?
            if (show === this.visible) {
                return false;
            }

            // is box being animated?
            if (Animator.animated(this.element)) {
                return false;
            }

            // if box should be hidden but is not closable, bail.
            if (!show && !this.config.closable) {
                return false;
            }

            // set new visibility status
            this.visible = show;

            // calculate new styling rules
            this.setCustomBoxStyling();

            // trigger event
            Boxzilla.trigger('box.' + (show ? 'show' : 'hide'), [this]);

            // show or hide box using selected animation
            if (this.config.position === 'center') {
                this.overlay.classList.toggle('boxzilla-' + this.id + '-overlay');
                Animator.toggle(this.overlay, "fade");
            }

            Animator.toggle(this.element, this.config.animation);

            // focus on first input field in box
            var firstInput = this.element.querySelector('input, textarea');
            if (firstInput) {
                firstInput.focus();
            }

            return true;
        };

        // show the box
        Box.prototype.show = function () {
            return this.toggle(true);
        };

        // hide the box
        Box.prototype.hide = function () {
            return this.toggle(false);
        };

        // calculate trigger height
        Box.prototype.calculateTriggerHeight = function () {
            var triggerHeight = 0;

            if (this.config.trigger.method === 'element') {
                var triggerElement = document.body.querySelector(this.config.trigger.value);
                if (triggerElement) {
                    var offset = triggerElement.getBoundingClientRect();
                    triggerHeight = offset.top;
                }
            } else if (this.config.trigger.method === 'percentage') {
                triggerHeight = this.config.trigger.value / 100 * getDocumentHeight();
            }

            return triggerHeight;
        };

        // checks whether window.location.hash equals the box element ID or that of any element inside the box
        Box.prototype.locationHashRefersBox = function () {

            if (!window.location.hash || 0 === window.location.hash.length) {
                return false;
            }

            var elementId = window.location.hash.substring(1);
            if (elementId === this.element.id) {
                return true;
            } else if (this.element.querySelector('#' + elementId)) {
                return true;
            }

            return false;
        };

        Box.prototype.fits = function () {
            if (this.config.minimumScreenWidth <= 0) {
                return true;
            }

            return window.innerWidth > this.config.minimumScreenWidth;
        };

        // is this box enabled?
        Box.prototype.mayAutoShow = function () {

            if (this.dismissed) {
                return false;
            }

            // check if box fits on given minimum screen width
            if (!this.fits()) {
                return false;
            }

            // if trigger empty or error in calculating triggerHeight, return false
            if (!this.config.trigger) {
                return false;
            }

            // rely on cookie value (show if not set, don't show if set)
            return !this.cookieSet;
        };

        Box.prototype.mayRehide = function () {
            return this.config.rehide && this.triggered;
        };

        Box.prototype.isCookieSet = function () {
            // always show on test mode
            if (this.config.testMode) {
                return false;
            }

            // if either cookie is null or trigger & dismiss are both falsey, don't bother checking.
            if (!this.config.cookie || !this.config.cookie.triggered && !this.config.cookie.dismissed) {
                return false;
            }

            var cookieSet = document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + 'boxzilla_box_' + this.id + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1") === "true";
            return cookieSet;
        };

        // set cookie that disables automatically showing the box
        Box.prototype.setCookie = function (hours) {
            var expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + hours);
            document.cookie = 'boxzilla_box_' + this.id + '=true; expires=' + expiryDate.toUTCString() + '; path=/';
        };

        Box.prototype.trigger = function () {
            var shown = this.show();
            if (!shown) {
                return;
            }

            this.triggered = true;
            if (this.config.cookie && this.config.cookie.triggered) {
                this.setCookie(this.config.cookie.triggered);
            }
        };

        /**
         * Dismisses the box and optionally sets a cookie.
         *
         * @param e The event that triggered this dismissal.
         * @returns {boolean}
         */
        Box.prototype.dismiss = function (e) {
            // prevent default action
            e && e.preventDefault();

            // only dismiss box if it's currently open.
            if (!this.visible) {
                return false;
            }

            // hide box element
            this.hide();

            // set cookie
            if (this.config.cookie && this.config.cookie.dismissed) {
                this.setCookie(this.config.cookie.dismissed);
            }

            this.dismissed = true;
            Boxzilla.trigger('box.dismiss', [this]);
            return true;
        };

        module.exports = function (_Boxzilla) {
            Boxzilla = _Boxzilla;
            return Box;
        };
    }, { "./animator.js": 1 }] }, {}, [2]);