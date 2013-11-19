Gesture to Location
===================

Description
-------------------

Gesture to Location is demo extension for Kitt. The purpose of this extension is to allow user to bind gestures to certain action. User can bind gesture to actual page, so that he can get back only by drawing specific gesture.

Only one stroke gestures are supported. Used library for gesture recognition has several specific, so please read limitations section before use.

Learned gestures are stored in chrome storage, so that they should be remembered even if Kitt process has been killed.

Usage
-------------------

Learn new action:

<ol>
<li>Visit your favorite page.</li>
<li>Open browser action page by clicking on extension icon.</li>
<li>Draw one stroke gesture on displayed white surface.</li>
<li>Bind your gesture to your favorite page.</li>
</ol>

Recall learned action:

<ol>
<li>Open browser action page by clicking on extension icon.</li>
<li>Draw learned gesture on displayed white surface.</li>
<li>If gesture was recognized, then you will be redirected to new page.</li>
<li>If gesture was not recognized, then you can bind gesture to current page.</li>
</ol>

Remove learned action:

<ol>
<li>Open browser action page by clicking on extension icon.</li>
<li>Click on List gestures button.</li>
<li>Select gesture, which you want to remove and click on it.</li>
</ol>

Limitations
----------------------

* Only one stroke gestures are supported
* Sometimes, used algorithm is not able distinguish gestures, which may looks different.
* Similar gestures, only differently scaled or rotated, are considered same.
* Page (about:blank is not page) has to be open to get extension working.
* Pages www.example.com and www.example.com/test are considered different.