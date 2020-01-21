function throttle(fn, threshold, scope) {
    threshold || (threshold = 800);
    let last;
    let deferTimer;

    return function() {
        let context = scope || this;
        let now = +new Date;
        let args = arguments;
        if (last && now < last + threshold) {
            // hold on to it
            clearTimeout(deferTimer);
            deferTimer = setTimeout(function () {
                last = now;
                fn.apply(context, args);
            }, threshold);
        } else {
            last = now;
            fn.apply(context, args);
        }
    };
}

module.exports = {throttle};