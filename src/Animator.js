var duration = 320;

function css(element, styles) {
    for(var property in styles) {
        element.style[property] = styles[property];
    }
}

function initObjectProperties(properties, value) {
    var newObject = {};
    for(var i=0; i<properties.length; i++) {
        newObject[properties[i]] = value;
    }
    return newObject;
}

function copyObjectProperties(properties, object) {
    var newObject = {}
    for(var i=0; i<properties.length; i++) {
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
    return element.getAttribute('data-animated') == 1;
}

/**
 * Toggles the element using the given animation.
 *
 * @param element
 * @param animation Either "fade" or "slide"
 */
function toggle(element, animation) {
    var visible = element.style.display != 'none' || element.offsetLeft > 0;

    // create clone for reference
    var clone = element.cloneNode(true);
    element.setAttribute('data-animated', 1);

    // toggle element visiblity right away if we're making something visible
    if( ! visible ) {
        element.style.display = '';
    }

    // animate properties
    if( animation === 'slide' ) {
        var hiddenStyles = initObjectProperties(["height", "borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom"], 0);
        var visibleStyles = {};

        if( ! visible ) {
            ccss = window.getComputedStyle(element);
            visibleStyles = copyObjectProperties(["height", "borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom"], ccss);
            css(element, hiddenStyles);
        }

        // don't show scrollbar during animation
        element.style.overflowY = 'hidden';
        animate(element, visible ? hiddenStyles : visibleStyles);
    } else {
        var hiddenStyles = { opacity: 0 }
        var visibleStyles = { opacity: 1 }
        if( ! visible ) {
            css(element, hiddenStyles);
        }

        animate(element, visible ? hiddenStyles : visibleStyles);
    }

    // clean-up after animation
    window.setTimeout(function() {
        element.removeAttribute('data-animated');
        element.setAttribute('style', clone.getAttribute('style'));
        element.style.display = visible ? 'none' : '';
    }, duration * 1.2);
}

function animate(element, targetStyles) {
    var start = +new Date();
    var last = +new Date();
    var initalStyles = window.getComputedStyle(element);
    var currentStyles = {};
    var propSteps = {};

    for(var property in targetStyles) {
        // make sure we have an object filled with floats
        targetStyles[property] = parseFloat(targetStyles[property]);

        // calculate step size & current value
        var to = targetStyles[property];
        var current = parseFloat(initalStyles[property]);
        propSteps[property] = ( to - current ) / duration; // points per second
        currentStyles[property] = current;
    }

    var tick = function() {
        var now = +new Date();
        var timeSinceLastTick = now - last;
        var done = true;

        for(var property in targetStyles ) {
            var step = propSteps[property];
            var to = targetStyles[property];
            var current = currentStyles[property];
            var increment =  step * timeSinceLastTick;
            var newValue = current + increment;

            if( step > 0 && newValue >= to || step < 0 && newValue <= to ) {
                newValue = to;
            } else {
                done = false;
            }

            currentStyles[property] = newValue;

            var suffix = property !== "opacity" ? "px" : "";
            element.style[property] = newValue + suffix;
        }

        last = +new Date();

        // keep going until we're done for all props
        if(!done) {
            (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 32);
        }
    };

    tick();
}


module.exports = {
    'toggle': toggle,
    'animated': animated
}