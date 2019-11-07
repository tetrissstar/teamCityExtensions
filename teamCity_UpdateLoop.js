// ==UserScript==
// @name         TeamCity Extensions - main loop
// @namespace    http://ipreo.com/
// @version      1.0.1
// @description  Base extension for TeamCity, containing main update loop
// @author       Equity team
// @include      *tc41ny1us02*
// @include      *build.code.ipreo.com/viewLog.html?buildId=*
// @grant        none
// @downloadURL https://github.com/tetrissstar/teamCityExtensions/teamCity_UpdateLoop.js
// @updateURL https://github.com/tetrissstar/teamCityExtensions/teamCity_UpdateLoop.js
// ==/UserScript==

(function() {
	'use strict';

	if (!window.extFunctions) {
		window.extFunctions = [];
	}

	var updatePageLoop = function() {
		for (var i = 0; i < window.extFunctions.length; i++)
		{
			window.extFunctions[i]();
		}

		setTimeout(updatePageLoop, 500);
	};
	updatePageLoop();
})();
