/**
 * @file
 * The jQuery snowfall js.
 */

// RequestAnimationFrame polyfill from.
// https://github.com/darius/requestAnimationFrame
if (!Date.now) {
  Date.now = function () {
    return new Date().getTime();
  };
}

(function () {
  'use strict';

  let vendors = ['webkit', 'moz'];
  for (let i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
    let vp = vendors[i];
    window.requestAnimationFrame = window[vp + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = (window[vp + 'CancelAnimationFrame']
        || window[vp + 'CancelRequestAnimationFrame']);
  }

  // iOS6 is buggy.
  if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent)
      || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
    let lastTime = 0;
    window.requestAnimationFrame = function (callback) {
      let now = Date.now();
      let nextTime = Math.max(lastTime + 16, now);
      return setTimeout(function () {
            callback(lastTime = nextTime);
          },
          nextTime - now);
    };
    window.cancelAnimationFrame = clearTimeout;
  }
}());

(function ($) {
  $.snowfall = function (element, options) {
    let flakes = [];
    let defaults = {
      flakeCount: 35,
      flakeColor: '#ffffff',
      flakePosition: 'absolute',
      flakeIndex: 999999,
      minSize: 1,
      maxSize: 2,
      minSpeed: 1,
      maxSpeed: 5,
      round: false,
      shadow: false,
      collection: false,
      collectionHeight: 40,
      deviceorientation: false
    };
    options = $.extend(defaults, options);
    let random = function random(min, max) {
      return Math.round(min + Math.random() * (max - min));
    };
    let canvasCollection = [];

    $(element).data("snowfall", this);

    // Snow flake object.
    function Flake(_x, _y, _size, _speed) {
      // Flake properties.
      this.x = _x;
      this.y = _y;
      this.size = _size;
      this.speed = _speed;
      this.step = 0;
      this.stepSize = random(1, 10) / 100;

      if (options.collection) {
        this.target = canvasCollection[random(0, canvasCollection.length - 1)];
      }

      let flakeMarkup = null;

      if (options.image) {
        flakeMarkup = document.createElement("img");
        flakeMarkup.src = options.image;
      }
      else {
        flakeMarkup = document.createElement("div");
        $(flakeMarkup).css({'background': options.flakeColor});
      }

      $(flakeMarkup).attr({
        'class': 'snowfall-flakes',
      }).css({
        'width': this.size,
        'height': this.size,
        'position': options.flakePosition,
        'top': this.y,
        'left': this.x,
        'fontSize': 0,
        'zIndex': options.flakeIndex
      });

      if ($(element).get(0).tagName === $(document).get(0).tagName) {
        $('body').append($(flakeMarkup));
        element = $('body');
      }
      else {
        $(element).append($(flakeMarkup));
      }

      this.element = flakeMarkup;

      // Update function, used to update the snow flakes, and checks current
      // snowflake against bounds.
      this.update = function () {
        this.y += this.speed;

        if (this.y > (elHeight) - (this.size + 6)) {
          this.reset();
        }

        this.element.style.top = this.y + 'px';
        this.element.style.left = this.x + 'px';

        this.step += this.stepSize;

        if (doRatio === false) {
          this.x += Math.cos(this.step);
        }
        else {
          this.x += (doRatio + Math.cos(this.step));
        }

        // Pileup check.
        if (options.collection) {
          if (this.x > this.target.x && this.x < this.target.width + this.target.x && this.y > this.target.y && this.y < this.target.height + this.target.y) {
            let ctx = this.target.element.getContext("2d"),
                curX = this.x - this.target.x,
                curY = this.y - this.target.y,
                colData = this.target.colData;

            if (colData[parseInt(curX)][parseInt(curY + this.speed + this.size)] !== undefined || curY + this.speed + this.size > this.target.height) {
              if (curY + this.speed + this.size > this.target.height) {
                while (curY + this.speed + this.size > this.target.height && this.speed > 0) {
                  this.speed *= .5;
                }

                ctx.fillStyle = defaults.flakeColor;

                if (colData[parseInt(curX)][parseInt(curY + this.speed + this.size)] == undefined) {
                  colData[parseInt(curX)][parseInt(curY + this.speed + this.size)] = 1;
                  ctx.fillRect(curX, (curY) + this.speed + this.size, this.size, this.size);
                }
                else {
                  colData[parseInt(curX)][parseInt(curY + this.speed)] = 1;
                  ctx.fillRect(curX, curY + this.speed, this.size, this.size);
                }
                this.reset();
              }
              else {
                // Flow to the sides.
                this.speed = 1;
                this.stepSize = 0;

                if (parseInt(curX) + 1 < this.target.width && colData[parseInt(curX) + 1][parseInt(curY) + 1] == undefined) {
                  // Go left.
                  this.x++;
                }
                else if (parseInt(curX) - 1 > 0 && colData[parseInt(curX) - 1][parseInt(curY) + 1] == undefined) {
                  // Go right.
                  this.x--;
                }
                else {
                  // Stop.
                  ctx.fillStyle = defaults.flakeColor;
                  ctx.fillRect(curX, curY, this.size, this.size);
                  colData[parseInt(curX)][parseInt(curY)] = 1;
                  this.reset();
                }
              }
            }
          }
        }

        if (this.x + this.size > (elWidth) - widthOffset || this.x < widthOffset) {
          this.reset();
        }
      };

      // Resets the snowflake once it reaches one of the bounds set.
      this.reset = function () {
        this.y = 0;
        this.x = random(widthOffset, elWidth - widthOffset);
        this.stepSize = random(1, 10) / 100;
        this.size = random((options.minSize * 100), (options.maxSize * 100)) / 100;
        this.element.style.width = this.size + 'px';
        this.element.style.height = this.size + 'px';
        this.speed = random(options.minSpeed, options.maxSpeed);
      }
    }

    // Local vars.
    let i = 0,
        elHeight = $(element).height(),
        elWidth = $(element).width(),
        widthOffset = 0,
        snowTimeout = 0;

    // Collection Piece ******************************.
    if (options.collection !== false) {
      let testElem = document.createElement('canvas');
      if (!!(testElem.getContext && testElem.getContext('2d'))) {
        let elements = $(options.collection);
        let collectionHeight = options.collectionHeight;

        for (let i = 0; i < elements.length; i++) {
          let bounds = elements[i].getBoundingClientRect(),
              $canvas = $('<canvas/>',
                  {
                    'class': 'snowfall-canvas'
                  }),
              collisionData = [];

          if (bounds.top - collectionHeight > 0) {
            $('body').append($canvas);

            $canvas.css({
              'position': options.flakePosition,
              'left': bounds.left + 'px',
              'top': bounds.top - collectionHeight + 'px'
            })
                .prop({
                  width: bounds.width,
                  height: collectionHeight
                });

            for (let w = 0; w < bounds.width; w++) {
              collisionData[w] = [];
            }

            canvasCollection.push({
              element: $canvas.get(0),
              x: bounds.left,
              y: bounds.top - collectionHeight,
              width: bounds.width,
              height: collectionHeight,
              colData: collisionData
            });
          }
        }
      }
      else {
        // Canvas element isn't supported.
        options.collection = false;
      }
    }

    // ************************************************.
    // This will reduce the horizontal scroll bar from displaying, when the
    // effect is applied to the whole page.
    if ($(element).get(0).tagName === $(document).get(0).tagName) {
      widthOffset = 25;
    }

    // Bind the window resize event so we can get the innerHeight again.
    $(window).bind("resize", function () {
      elHeight = $(element)[0].clientHeight;
      elWidth = $(element)[0].offsetWidth;
    });


    // Initialize the flakes.
    for (i = 0; i < options.flakeCount; i += 1) {
      flakes.push(new Flake(random(widthOffset, elWidth - widthOffset), random(0, elHeight), random((options.minSize * 100), (options.maxSize * 100)) / 100, random(options.minSpeed, options.maxSpeed)));
    }

    // This adds the style to make the snowflakes round via border radius
    // property.
    if (options.round) {
      $('.snowfall-flakes').css({
        '-moz-border-radius': (options.maxSize * 100),
        '-webkit-border-radius': (options.maxSize * 100),
        'border-radius': (options.maxSize * 100)
      });
    }

    // This adds shadows just below the snowflake so they pop a bit on lighter
    // colored web pages.
    if (options.shadow) {
      $('.snowfall-flakes').css({
        '-moz-box-shadow': '1px 1px 1px #555',
        '-webkit-box-shadow': '1px 1px 1px #555',
        'box-shadow': '1px 1px 1px #555'
      });
    }

    // On newer Macbooks Snowflakes will fall based on deviceorientation.
    let doRatio = false;
    if (options.deviceorientation) {
      $(window).bind('deviceorientation', function (event) {
        doRatio = event.originalEvent.gamma * 0.1;
      });
    }

    // This controls flow of the updating snow.
    function snow() {
      for (i = 0; i < flakes.length; i += 1) {
        flakes[i].update();
      }

      snowTimeout = requestAnimationFrame(function () {
        snow()
      });
    }

    snow();

    // Clears the snowflakes.
    this.clear = function () {
      $('.snowfall-canvas').remove();
      $(element).children('.snowfall-flakes').remove();
      cancelAnimationFrame(snowTimeout);
    }
  };

  // Initialize the options and the plugin.
  $.fn.snowfall = function (options) {
    if (typeof (options) == "object" || options === undefined) {
      return this.each(function (i) {
        (new $.snowfall(this, options));
      });
    }
    else if (typeof (options) == "string") {
      return this.each(function (i) {
        let snow = $(this).data('snowfall');
        if (snow) {
          snow.clear();
        }
      });
    }
  };
})(jQuery);
