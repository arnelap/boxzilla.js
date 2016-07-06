var Animator = (function() {

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
        var targetCSS = {
            paddingTop: 0,
            paddingBottom: 0,
            height: 0,
            opacity: 0
        };

        // create clone and reset properties
        var clone = element.cloneNode(true);
        clone.style.display = '';
        element.setAttribute('data-animated', 1);

        // toggle element visiblity right away if we're making something visible
        if( ! visible ) {
            element.style.display = '';
        }

        // animate properties
        if( animation === 'slide' ) {
            if( ! visible ) {
                targetCSS = window.getComputedStyle(clone);
                element.style.height = 0;
                element.style.paddingTop = 0;
                element.style.paddingBottom = 0;
            }

            // don't show scrollbar during animation
            element.style.overflowY = 'hidden';
            css(element, "height",  targetCSS.height);
            css(element, "padding-top", targetCSS.paddingTop);
            css(element, "padding-bottom", targetCSS.paddingBottom);
        } else {
            if( ! visible ) {
                targetCSS.opacity = 1;
                element.style.opacity = 0;
            }

            css(element, "opacity", targetCSS.opacity);
        }

        // clean-up after animation
        window.setTimeout(function() {
            element.removeAttribute('data-animated');

            if( animation == "slide") {
                element.style.overflowY = clone.style.overflowY;
                element.style.height = clone.style.height;
                element.style.paddingTop = clone.style.paddingTop;
                element.style.paddingBottom = clone.style.paddingBottom;
            } else{
                element.style.opacity = clone.style.opacity;
            }

            if( visible ) {
                element.style.display = 'none';
            }
        }, 1000);
    }

    function camelCase(string) {
        return string.replace(/-([a-z])/gi, function(s, group1) {
            return group1.toUpperCase();
        });
    }

    function css(element, property, to) {
        var transitions = element.style.transition.split(', ').filter(function(t) {
            return t != "" && t.indexOf(property) < 0;
        });
        transitions.push(property + " 0.8s");
        element.style.transition = transitions.join(', ');

        var jsProperty = camelCase(property);

        // transition to new property
        window.setTimeout(function() {
            element.style[jsProperty] = to;
        }, 0);
    }

    return {
        'toggle': toggle,
        'animated': animated
    }
})();

module.exports = Animator;