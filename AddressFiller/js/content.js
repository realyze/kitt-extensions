/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
var localJQuery = $.noConflict(true);
(function($) {

// Supported pages:
// www.alza.cz
// www.mironet.cz
// www.bontonland.cz
// www.gameexpres.cz
// www.jrc.cz

    /**
     * Tries to retrieve address from current location.
     * Works only in Kitt.
     * @param {Number} lat
     * @param {Number} lnt
     * @param {Callback} callback
     */
    function sendRequest(lat, lnt, callback) {
        var url = sprintf('http://maps.googleapis.com/maps/api/geocode/json?latlng=%f,%f&sensor=true', lat, lnt);
        chrome.runtime.sendMessage({cmd: 'background.xhr', data: url}, function(response) {
            callback(response.data);
        });
    }

    /**
     * Retrieve current location.
     * @param {Callback} callback
     */
    function getLocation(callback) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(p) {
                sendRequest(p.coords.latitude, p.coords.longitude, callback);
            });
        }
    }

    /**
     * Extract element from object containing full address.
     * @param {JSON} data
     * @param {String} name
     * @returns {String}
     */
    function extractFromAddress(data, name) {
        for (var index = 0; index < data.results.length; index++) {
            if (data.results[index].types.indexOf('street_address') >= 0) {
                var result = data.results[index];
                for (var ix = 0; ix < result.address_components.length; ix++) {
                    if (result.address_components[ix].types.indexOf(name) >= 0) {
                        return result.address_components[ix].long_name;
                    }
                }
            }
        }
    }

    var rules = [
        {
            // Name of rule
            name: 'Zip',
            // Pattern for id and name
            pattern: /(zip)|(postcode)|(psc)/i,
            // Gather data from object containing full address.
            gather: function(data) {
                return extractFromAddress(data, 'postal_code');
            }
        },
        {
            name: 'Street',
            pattern: /^(((?!mail).)*address.*)|(.*(street|avenue|alley|ulice).*)$/i,
            gather: function(data) {
                var route = extractFromAddress(data, 'route');
                var number = extractFromAddress(data, 'street_number');
                return typeof(route) !== 'undefined' && typeof(number) !== 'undefined' ? number + ' ' + route : false;
            }
        },
        {
            name: 'City',
            pattern: /(city)|(town)|(mesto)/i,
            gather: function(data) {
                var city = extractFromAddress(data, 'sublocality');
                return city || extractFromAddress(data, 'locality');
            }
        }
    ];
    /**
     * Fills matching inputs with parts of address.
     * @param {Object} data
     * @param {Array} inputs
     */
    function fillForm(data, inputs) {
        for (var index = 0; index < rules.length; index++) {
            var string = rules[index].gather(data);
            // Was gathering successful?
            if (string) {
                $(inputs[index]).val(string);
            }
        }
    }

    /**
     * Test if input match given rule
     * @param {HTMLElement} input
     * @param {Object} rule
     * @returns {Boolean}
     */
    function isInputMatchRule(input, rule) {
        return input.id && input.id.match(rule.pattern) || input.name && input.name.match(rule.pattern);
    }
    /**
     * Method is called when user click on the browser action button.
     */
    function browserActionOnClick() {
        var inputs = new Array(rules.length), isEmpty = true, index;

        // Extracts all imputs from page
        $('input').each(function() {
            for (var index = 0; index < rules.length; index++) {
                // Test rule pattern on id and name attribute of all inputs
                if (!inputs[index] && isInputMatchRule(this, rules[index])) {
                    inputs[index] = this;
                    return;
                }
            }
        });

        // Extracts all label from page
        $('label').each(function() {
            for (var index = 0; index < rules.length; index++) {
                // Test rule pattern on id and name attribute of all inputs
                if (!inputs[index] && this.innerHTML.match(rules[index].pattern)) {
                    var input = document.getElementById(this.htmlFor);
                    if (input && input.tagName === 'INPUT' && !isInputMatchRule(input, rules[index])) {
                        inputs[index] = input;
                        return;
                    }
                }
            }
        });

        for (index = 0; index < rules.length; index++) {
            if (inputs[index]) {
                isEmpty = false;
                break;
            }
        }

        // Are imput array non empty
        if (!isEmpty) {
            // Request for location
            getLocation(function(response) {
                // Is response ok?
                if (response) {
                    var data = JSON.parse(response);
                    if (data) {
                        if (data.status && data.status === 'OK') {
                            // Fill inputs
                            fillForm(data, inputs);
                        }
                    }
                }
            });
        } else {
            alert('Any suitable input element wasn\'t detected!');
        }
    }

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        switch (request.cmd) {
            // Received on click event
            case 'content.onClick':
                browserActionOnClick();
                sendResponse({message: 'OK'});
                break;
            default:
                sendResponse({message: 'Invalid arguments'});
                break;
        }
    });
})(localJQuery);
