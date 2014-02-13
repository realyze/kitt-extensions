
var localJQuery = $.noConflict(true);
(function($) {
  /**
   * @param {Array} Images
   * @param {Array} ValidatedImages
   * @param {Number} Cursor
   * @returns {ImageCursor}
   */
  function ImageCursor(Images, ValidatedImages, Cursor) {
    this.images = Images;
    this.validatedImages = ValidatedImages;
    this.cursor = typeof(Cursor) === 'undefined' ? Images.length - 1 : Cursor;
    this.img = null;
    /**
     * @returns {String} path of current valid image or false if there isn't any.
     */
    this.getCurrentImageLocation = function() {
      return this.validatedImages[this.cursor] === true ? this.images[this.cursor] : false;
    };
    /**
     * @returns {Image} current image (it can be unload or invalid).
     */
    this.getCurrentImage = function() {
      return this.img;
    };
    /**
     * @param {Number} direction
     * @param {Function} callback
     * @returns {Boolean}
     */
    this.move = function(direction, callback) {
      // Copy current cursor
      var o = new ImageCursor(this.images, this.validatedImages, this.cursor);
  
      for (var index = 0; index < o.images.length; index++) {
        // move cursor
        o.cursor = (o.cursor + o.images.length + direction) % o.images.length;
        // Test if image was tested and is invalid
        if (o.validatedImages[o.cursor] === false) {
          continue;
        }
  
        o.img = new Image();
  
        if (o.validatedImages[o.cursor] === true) {
          o.img.src = o.images[o.cursor];
          callback(o);
          return true;
        }
  
        /*jshint loopfunc: true */
        o.img.onload = function() {
          if (this.width + this.height === 0) {
            this.onerror();
          } else {
            o.validatedImages[o.cursor] = true;
            callback(o);
          }
        };
        
        /*jshint loopfunc: true */
        o.img.onerror = function() {
          o.validatedImages[o.cursor] = false;
          o.move(direction, callback);
        };
        o.img.src = o.images[o.cursor];
        return false;
      }
      // There is not any valid image in image array
      callback(o);
      // Callback was executed
      return false;
    };
    /**
     * @description Advance cursor to next valid image.
     * @param {Function} callback
     * @returns {Boolean} if request will be asynchrous
     */
    this.moveForward = function(callback) {
      return this.move(+1, callback);
    };
    /**
     * @description Advance cursor to previous valid image.
     * @param {Function} callback
     * @returns {Boolean}
     */
    this.moveBackward = function(callback) {
      return this.move(-1, callback);
    };
  }
  
  /**
   * Builds ImageCursor for given array of images.
   * @param {Array} data
   * @param {Function} callback
   */
  function ImageCursorOpen(data, callback) {
  
    var o = new ImageCursor(data, new Array(data.length));
    o.moveForward(callback);
  }
  
  /**
   *
   * @param {ImageCursor} cursor
   * @param {Number} index
   * @param {Number} direction
   */
  function preloadImage(cursor, index, direction) {
    cursor.move(direction, function(c2) {
      // Preloads new image
      var cell = document.getElementById('image-' + ((index + 3 + direction) % 3));
      cell.innerHTML = '';
      cell.appendChild(c2.getCurrentImage());
    });
  }
  
  
  var lastIndex = 0;
  
  /**
   * Create swipe context for given gallery.
   * @param {ImageCursor} cursor is current gallery.
   * @param {Array} cursors points on valid images.
   */
  function createSwipeContent(cursor, cursors) {
  
    var swipe = document.createElement('div');
    swipe.className = 'swipe';
  
    var swipe_wrap = document.createElement('div');
    swipe_wrap.className = 'swipe-wrap';
  
    for (var index = 0; index < cursors.length; index++) {
  
      var table = document.createElement('div');
  
      var row = document.createElement('div');
  
      var cell = document.createElement('div');
      cell.appendChild(cursors[index].getCurrentImage());
      cell.id = 'image-' + index;
  
      row.appendChild(cell);
  
      table.appendChild(row);
  
      swipe_wrap.appendChild(table);
    }
  
    swipe.appendChild(swipe_wrap);
  
    document.getElementById('content').appendChild(swipe);
  
    window.contentSwipe = new Swipe(swipe, {
      startSlide: 1,
      //speed: 400,
      //auto: 3000,
      //continuous: true,
      //disableScroll: false,
      //stopPropagation: false,
      //callback: function(index, elem) {},
      transitionEnd: function(index, elem) {
        // This callback is called, when current window of swipe is changed.
        // It is required to preload neighbours images, so that movement will be smooth.
  
        if (lastIndex !== index) {
          // Movement goes forward.
          if ((3 + index - lastIndex - 1) % 3 === 0) {
            cursor.moveForward(function(c1) {
              cursor = c1;
              preloadImage(cursor, index, +1);
            });
          }
          // Movement goes backward.
          if ((3 + index - lastIndex + 1) % 3 === 0) {
            cursor.moveBackward(function(c1) {
              cursor = c1;
              preloadImage(cursor, index, -1);
            });
          }
  
          lastIndex = index;
        }
      }
    });
  }
  
  /**
   * @description Send request for image resources of current tab.
   * @param {Function} callback
   */
  function sendMessageToActiveTab(callback) {
  
    chrome.tabs.query({}, function(result) {
  
      for (var index = 0; index < result.length; ++index) {
  
        // Send message to active tab.
        if (result[index].active) {
          chrome.tabs.sendMessage(result[index].id, {cmd: 'content.requestImages'}, callback);
          break;
        }
      }
    });
  }
  
  $(document).ready(function() {
  
    sendMessageToActiveTab(function(response) {
  
      if (response.data && response.data.length) {
  
        ImageCursorOpen(response.data, function(cursor) {
  
          if (cursor.getCurrentImageLocation()) {
            // Forward cursor
            cursor.moveForward(function(cf) {
              // Backward cursor
              cursor.moveBackward(function(cb) {
  
                createSwipeContent(cursor, [cb, cursor, cf]);
              });
            });
          }
        });
      }
    });
  });
})(localJQuery);
