const throttle = require('../util.js').throttle;

module.exports = function(boxes) {
    // check triggerHeight criteria for all boxes
    function checkHeightCriteria() {
      var scrollY = window.hasOwnProperty('pageYOffset') ? window.pageYOffset : window.scrollTop;
      scrollY = scrollY + window.innerHeight * 0.9;

      boxes.forEach(function(box) {
          if( ! box.mayAutoShow() || box.triggerHeight <= 0 ) {
              return;
          }

          if( scrollY > box.triggerHeight ) {
              box.trigger();
          } 
        
          // if box may auto-hide and scrollY is less than triggerHeight (with small margin of error), hide box
          if( box.mayRehide() && scrollY < ( box.triggerHeight - 5 ) ) {
              box.hide();
          }
      });
    }

    window.addEventListener('touchstart', throttle(checkHeightCriteria), true );
    window.addEventListener('scroll', throttle(checkHeightCriteria), true );
};