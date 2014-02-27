var localJQuery = $.noConflict(true);
(function($) {

  /**
   * Tries to gather images from page.
   * @returns {Array} images sources.
   */
  function gatherImages() {

    /**
     * Compare second-level domain of image source and page source.
     * @param {String} s1 Image or page url.
     * @param {String} s2 Image or page url.
     * @returns {Boolean} if first-order domain is equal.
     */
    function isDomainEqual(s1, s2) {
      var h1 = new URI(s1), h2 = new URI(s2);
      return h1.domain() === h2.domain();
    }

    var hrefs = [];

    // Tries to gather images from colorbox.
    // Colorbox: http://www.jacklmoore.com/colorbox/
    if (hrefs.length === 0) {
      $('.cboxElement').each(function() {
        hrefs.push(this.href);
      });
    }

    // Tries to gather images from lightbox.
    // Lightbox: http://lokeshdhakar.com/projects/lightbox2/
    if (hrefs.length === 0) {
      $('a').each(function() {
        var attr = this.getAttribute("data-lightbox");
        if (attr) {
          hrefs.push(this.href);
        }
      });
    }


    // Tries to gather images from regular site;
    if (hrefs.length === 0) {
      $('a>img:only-child').parent().each(function() {
        // Second-level domain has to be same to avoid advertisements.
        if (isDomainEqual(window.location.host, this.host)) {
          hrefs.push(this.href);
        }
      });
    }

    return hrefs;
  }

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch (request.cmd) {
      case 'content.requestImages':
        // Returns image sources
        sendResponse({message: 'OK', data: gatherImages(), location: window.location.href});
        break;
      default:
        sendResponse({message: 'Invalid arguments'});
        break;
    }
  });

})(localJQuery);
