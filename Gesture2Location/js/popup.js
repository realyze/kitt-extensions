$(document).ready(function() {
  try {
    
    function getMessiWidth() {
      return $(document).width() - 50 + 'px';
    }
    
    // Default style for message boxes.
    var MESSI_STYLE = {modal: true, width: getMessiWidth(), title: 'Choose action:'};
    var THUMBNAIL_WIDTH = 71;
    var THUMBNAIL_HEIGHT = 71;
    var THUMBNAIL_PADDING = 2;
    var BODY_PADDING = 5; // px

    var Templates = {};
    var dollarRec = new Dollar.Recognizer();
    // Delete predefined templates
    dollarRec.Templates = [];

    // Fetch stored templates from local storage
    chrome.storage.local.get('Templates', function(items) {
      if (items && items.Templates) {
        Templates = items.Templates;
        dollarRec.Templates = [];
        for (var name in Templates) {
          dollarRec.AddTemplate(name, Templates[name]);
        }
      }
    });

    /**
     * Draw given points into given canvas element.
     * @param {Canvas} canvas
     * @param {Array} points
     */
    function drawGesture(canvas, points) {
      var ctx = canvas.getContext('2d');

      var min = {X: points[0].X, Y: points[0].Y}, max = {X: points[0].X, Y: points[0].Y};

      points.forEach(function(e) {
        min.X = Math.min(min.X, e.X);
        min.Y = Math.min(min.Y, e.Y);
        max.X = Math.max(max.X, e.X);
        max.Y = Math.max(max.Y, e.Y);
      });

      var dx = 1.0 * (canvas.width - THUMBNAIL_PADDING * 2) / (max.X - min.X);
      var dy = 1.0 * (canvas.height - THUMBNAIL_PADDING * 2) / (max.Y - min.Y);

      ctx.strokeStyle = 'black';
      ctx.beginPath();
      ctx.moveTo((points[0].X - min.X) * dx + THUMBNAIL_PADDING,
              (points[0].Y - min.Y) * dy + THUMBNAIL_PADDING);

      for (var index = 1; index < points.length; index++) {
        ctx.lineTo((points[index].X - min.X) * dx + THUMBNAIL_PADDING,
                (points[index].Y - min.Y) * dy + THUMBNAIL_PADDING);
      }
      ctx.stroke();
    }

    /**
     * Calls callback with active tab.
     * @param {Callback} callback
     */
    function getActiveTab(callback) {
      chrome.tabs.query({}, function(tabs) {
        for (var index = 0; index < tabs.length; index++) {
          if (tabs[index].active) {
            tabs[index].url = new URI(tabs[index].url).protocol('http').normalize().href();
            callback(tabs[index]);
            break;
          }
        }
      });
    }

    /**
     * Add new gesture to templates storage.
     * @param {String} name
     * @param {Array} points
     */
    function addTemplate(name, points) {
      Templates[name] = points;
      dollarRec.AddTemplate(name, points);
    }

    /**
     * Remove gesture from template storage.
     * @param {String} name
     */
    function removeTemplate(name) {
      // Remove from templates
      delete Templates[name];
      // Remove from Dollar
      for (var index = 0; index < dollarRec.Templates.length; index++) {
        if (dollarRec.Templates[index].Name === name) {
          dollarRec.Templates.splice(index, 1);
          break;
        }
      }
    }

    /**
     * Process drawn gesture and displays dialog to make user choose action.
     * @param {Array} points
     * @returns {undefined}
     */
    function handleGesture(points) {
      getActiveTab(function(tab) {
        try {
          var result = {Score: 0};
          if (dollarRec.Templates.length !== 0) {
            // Try to recognize given gesture.
            result = dollarRec.Recognize(points, false);
          }


          var isEqual = result.Name === tab.url;
          // Score is divided into three levels. Level level mean that
          // gesture wasn't recognized.
          var score = result.Score < 0.50 ? 0 : result.Score < 0.85 ? 1 : 2;
          // True if there is gesture, which is bound to current tab
          var isBound = (tab.url in Templates);

          var callback = function(action) {
            // New gesture will be added to storage
            if (action === 'B') {
              // Remove template if already exists
              if (isBound) {
                removeTemplate(tab.url);
              }
              // Add new template
              addTemplate(tab.url, points);
              chrome.storage.local.set({Templates: Templates}, function() {
                // Templates was stored.
                window.close();
              });
            }
            // Change location to acording to recognized gesture
            if (action === 'G') {
              // Currently only supported in developer version
              if (chrome.tabs.update) {
                chrome.tabs.update(tab.id, {url: result.Name}, function() {
                  window.close();
                });
              } else {
                chrome.tabs.sendMessage(tab.id, {cmd: 'content.changeLocation', data: result.Name}, function() {
                  window.close();
                });
              }
            }
          };

          if (isEqual || score !== 2) {
            // Displayed message and array of buttons
            var m, b;

            if (isEqual && (score === 2 || score === 1)) {
              b = [['B', 'Yes'], ['N', 'No']];
              m = 'Gesture is bound to the current page. Do you want to update it?';
            } else if (!isEqual && isBound && score === 1) {
              b = [['G', 'Yes'], ['N', 'No'], ['B', 'Bind']];
              m = 'Do you want to go to ' + result.Name + 'or update the gesture for the current page?';
            } else if (!isEqual && !isBound && score === 1) {
              b = [['G', 'Yes'], ['N', 'No'], ['B', 'Bind']];
              m = 'Do you want to go to ' + result.Name + 'or save this gesture for the current page?';
            } else if (isBound && score === 0) {
              b = [['B', 'Yes'], ['N', 'No']];
              m = 'Your gesture cannot be recognized, but there is a gesture bound to the current page. Do you want to update it?';
            } else { /*if (!isBound && score === 0)*/
              b = [['B', 'Yes'], ['N', 'No']];
              m = 'Your gesture cannot be recognize. Do you want to bind it to page "' + tab.url + '"?';
            }

            var options = {};
            $.extend(options, MESSI_STYLE, {});
            options.buttons = new Array(b.length);

            // Add buttons
            for (var index = 0; index < b.length; index++) {
              options.buttons[index] = {};
              options.buttons[index].id = index;
              options.buttons[index].val = b[index][0];
              options.buttons[index].label = b[index][1];
              options.buttons[index].class = ['btn-success', 'btn-danger', ''][index];
            }

            options.callback = callback;

            // Display dialog
            new Messi(m, options);

          } else {
            callback('G');
          }

        } catch (e) {
          alert(e);
        }
      });
    }

    /**
     * Remove gesture from list and also from storage.
     * @param {String} id
     * @param {String} name
     */
    function removeGesture(id, name) {
      var options = {};
      $.extend(options, MESSI_STYLE, {
        buttons: [{id: 0, label: 'Yes', val: 'y', class: 'btn-success'},
          {id: 1, label: 'No', val: 'n', class: 'btn-danger'}]
      });

      var message = 'Do you want to remove the gesture bound to page "' + name + '"?';

      options.callback = function(val) {
        if (val === 'y') {
          removeTemplate(name);
          chrome.storage.local.set({Templates: Templates}, function() {
          });
          $('#' + id).remove();
        }
      };
      // Display question dialog
      new Messi(message, options);
    }

    var point, Points = [];

    $('#surface').swipe({
      allowPageScroll: 'none',
      swipeStatus: function(event, phase, direction, distance, fingers) {
        //This only fires when the user swipes left
        var canvas = document.getElementById('surface');
        var offset = $(canvas).offset();
        var P = {X: event.pageX - offset.left, Y: event.pageY - offset.top};
        var ctx = canvas.getContext('2d');
        if (phase === 'start')
        {
          // Clear canvas and store first point.
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          point = P;
          Points = [P];
          return;
        }
        else if (phase === 'end' || phase === 'cancel')
        {
          // Test if user draw gesture
          if (Points.length > 0) {
            handleGesture(Points);
          }
        }
        else
        {
          // Draw line from previous postion to current.
          ctx.strokeStyle = 'black';
          ctx.beginPath();
          ctx.moveTo(point.X, point.Y);
          ctx.lineTo(P.X, P.Y);
          ctx.stroke();
          point = P;
          // Push now position into array.
          Points.push(point);
        }
      }
    });

    // Resize main canvas
    function canvasResize() {
      var p = $('#content1').offset();
      document.getElementById('surface').width = $('body').width() - BODY_PADDING - p.left;
      document.getElementById('surface').height = $('body').height() - BODY_PADDING - p.top;
    }
    
    // Register on orientation change event
    window.addEventListener("orientationchange", function() {
      // Force to redraw the document
      $(document).hide().show();
      // Set messi style
      MESSI_STYLE.width = getMessiWidth();
      // Resize canvas
      canvasResize();
    });

    // Display content from Draw Gesture
    $('#button1').click(function() {

      $('.button').removeClass('active');
      $(this).addClass('active');
      // -----
      $('.content').hide();
      $('#content1').show();
      // -----
      canvasResize();
    });

    // Display content for List Gestures
    $('#button2').click(function() {

      $('.button').removeClass('active');
      $(this).addClass('active');
      // -----
      $('.content').hide();
      $('#content2').show();
      // -----

      var table = document.createElement('div');
      table.id = 'items';

      var templates = dollarRec.Templates;

      for (var index = 0; index < templates.length; index++)
      {
        var template = templates[index];

        var row = document.createElement('div');
        row.id = 'row-' + index;
        table.appendChild(row);

        var cell = document.createElement('div');
        row.appendChild(cell);

        var canvas = document.createElement('canvas');
        cell.appendChild(canvas);
        canvas.width = THUMBNAIL_WIDTH;
        canvas.height = THUMBNAIL_HEIGHT;
        canvas.style.border = 'solid 2px white';
        drawGesture(canvas, Templates[template.Name]);

        cell = document.createElement('div');
        row.appendChild(cell);

        var text = document.createElement('span');
        text.style.display = 'inline-block';
        text.appendChild(document.createTextNode(template.Name));
        text.className = 'text';
        cell.appendChild(text);

        cell = document.createElement('div');
        row.appendChild(cell);

        /*jshint loopfunc: true */
        row.onclick = (function(id, name) {
          return function() {
            removeGesture(id, name);
          };
        })(row.id, template.Name);
      }

      var elem = document.getElementById('content2');
      elem.innerHTML = '';
      elem.appendChild(table);
    });

    $('#button1').trigger('click');

  } catch (e) {
    alert(e);
  }
});