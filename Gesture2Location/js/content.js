(function() {
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch (request.cmd) {
      case 'content.changeLocation':
        // Change current location to received string.
        window.location.href = request.data;
        sendResponse({message: 'OK'});
        break;
      default:
        sendResponse({message: 'Invalid arguments'});
        break;
    }
  });
})();