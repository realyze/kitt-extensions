chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.query({active: true}, function(tabs) {
        if (tabs.length === 1) {
            // Notify active page about onClick event
            chrome.tabs.sendMessage(tabs[0].id, {cmd: 'content.onClick'}, function(response) {
            });
        }
    });
});

// Current implementation of XmlHttpRequest
var xhr = new XMLHttpRequest();

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch (request.cmd) {
        // Received on click event
        case 'background.xhr':
            xhr.open('GET', request.data);
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4 && xhr.status < 300) {
                    sendResponse({message: 'OK', data: xhr.responseText});
                }
            };
            xhr.send();
            return true;
        default:
            sendResponse({message: 'Invalid arguments'});
            break;
    }
});
