'use strict';

module.exports = function(callback) {
    let timeout;
    let touchStart = {};
    const delay = 400;

    function triggerCallback() {
        document.documentElement.removeEventListener('mouseleave', onMouseLeave);
        document.documentElement.removeEventListener('mouseenter', onMouseEnter);
        window.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchend', onTouchEnd);
        callback();
    }

    function onMouseLeave(evt) {
        // did mouse leave at top of window?
        if( evt.clientY <= 0 && evt.clientX < ( 0.9 * window.innerWidth)) {
            timeout = window.setTimeout(triggerCallback, delay);
        }
    }

    function onMouseEnter(evt) {
        if (timeout) {
            window.clearTimeout(timeout);
            timeout = null;
        }
    }

    function onTouchStart(evt) {
        if (timeout) {
            window.clearTimeout(timeout);
            timeout = null;
        }

        touchStart = {
            timestamp: performance.now(),
            scrollY: window.scrollY,
        };
    }

    function onTouchEnd(evt) {
        // allow a tiny tiny margin for error, to not fire on clicks
        if ((window.scrollY + 20) >= touchStart.scrollY) {
            return;
        }

        if (performance.now() - touchStart.timestamp > 150) {
            return;
        }

        timeout = window.setTimeout(triggerCallback, delay);
    }

    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchend', onTouchEnd);
    document.documentElement.addEventListener('mouseleave', onMouseLeave);
    document.documentElement.addEventListener('mouseenter', onMouseEnter);
};