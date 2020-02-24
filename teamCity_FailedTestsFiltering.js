// ==UserScript==
// @name         TeamCity Extensions - Failed tests filtering
// @namespace    http://ipreo.com/
// @version      0.2.7
// @description  Extension for Team City, adding ability to filter failed tests by error message
// @author       Equity Team
// @include      *tc41ny1us02*/viewLog.html?buildId=*
// @include      *build.code.ipreo.com/viewLog.html?buildId=*
// @grant        none
// @downloadURL  https://github.com/tetrissstar/teamCityExtensions/raw/master/teamCity_FailedTestsFiltering.js
// @updateURL  https://github.com/tetrissstar/teamCityExtensions/raw/master/teamCity_FailedTestsFiltering.js
// ==/UserScript==

(function () {
    'use strict';

    var tests;

    var onDemandBuildIds = {
		"QX" : "Equity_TestAutomation_OnDemandTests_Qx",
		"Demo" : "Equity_TestAutomation_OnDemandTests_Demo",
		"Missouri" : "Equity_TestAutomation_OnDemandTests_Missouri",
		"Production" : "Equity_TestAutomation_OnDemandTests_Production",
		"QXAll": "Equity_TestAutomation_AllTestsByPriorGroupOfFunctionalAreas_OnDemanForNightlyRun"
	};

    var querySelectorForFailedTests = {
        "all": ".testList a.testWithDetails",
        //"manually_checked": '.testList tr.testRowSelected:not([style*="display: none"]) a.testWithDetails',
        "manually_checked": '#tst_group_build_fail .testList tr:not([style*="display: none"]) .testNameWrapper',
        "filtered": '.testList tr:not([style*="display: none"]) a.testWithDetails',
        "filtered_failed_only_section": '#tst_group_build_fail .testList tr:not([style*="display: none"]) a.testWithDetails',
        "failed_only_section": '#tst_group_build_fail .testList a.testWithDetails',
        "ignored_only_section": '#tst_group_build_ignore .testList a.testWithDetails',
        "muted_only_section": '#tst_group_build_mute .testList a.testWithDetails',
    };

    function getFilterOptions() {
        return Object.keys(querySelectorForFailedTests).map(function (key) {
			return '<option value="'+key+'">'+key+'</option>';
		}).join("");
    }

function getFailedTests(option) {
	var testNames = [];
	var testElements = document.querySelectorAll(querySelectorForFailedTests[option]);
	for (var i = 0; i < testElements.length; i++) {
            var tooltipElement = null;
            var testElement = testElements[i];
            if(option==="manually_checked"){
                var testElementCheckBox = testElements[i].querySelector("span.checkbox.custom-checkbox_checked");
                if(testElementCheckBox === null)
                    continue;
                testElement = testElements[i].querySelector("a.testWithDetails");
                if(testElement === null)
                    continue;
            }
            tooltipElement = testElement.querySelector("span[onmouseover]");
            var testName;
            if (tooltipElement) {
		var tooltipMouseover = tooltipElement.getAttribute('onmouseover');
		testName = tooltipMouseover.substring(tooltipMouseover.indexOf("'") + 1, tooltipMouseover.lastIndexOf("'") - 1).trim();
            } else {
		testName = testElement.innerText.trim();
            }

            if (testName !== "" && testName !== null)
                testNames[i] = testName;
            }
            return testNames;
	}

	function getFailedTestsFilter(option) {
		return getFailedTests(option).filter(function(el) {
            if (el === null || el === "") {
                return false; // skip
            }
            return true;
        }).map(function (testName) {
			return "FullyQualifiedName~" + testName;
		}).join("|");
	}

    function getFailedTestsNumber(option) {
		return getFailedTests(option).filter(function(el) {
            if (el === null || el === "") {
                return false; // skip
            }
            return true;
        }).length;
	}

	function getCurrentBuildEnvironment() {
		var buildType = document.querySelector("li.buildType").innerText;
		if (buildType.indexOf("Functional Areas") >= 0)
		{
			return "QXAll";
		} else {
			return buildType;
		}
	}

	function getOnDemandBuildId() {
		var envn = getCurrentBuildEnvironment();
		return onDemandBuildIds[envn];
	}

	function triggerRerunBuild(option) {
        var failedTestsFilter = getFailedTestsFilter(option);
        if(failedTestsFilter===""){
            alert("There is no any test for rerun for such option!");
            return;
        }
        //alert(getFailedTestsFilter(option));

		var body = '<build><buildType id="' + getOnDemandBuildId() + '" />' + '<properties>' + '<property name="filter.base" value="' + getFailedTestsFilter(option) + '" /></properties></build>';
		var xhr = new XMLHttpRequest();
		xhr.open("POST", "/httpAuth/app/rest/buildQueue", true);
		xhr.setRequestHeader('Content-Type', 'application/xml');
		xhr.send(body);
		xhr.onreadystatechange = function () {
			if (xhr.readyState == 4) {
				if (xhr.status == 200) {
					alert("Done: " + xhr.responseText);
				} else {
					alert(xhr.status + ': ' + xhr.statusText);
				}
			}
		};
	}

    function showTCFilterForUnhiddenTests () {
        showTCFilterWindow("Filter For Unhidden Tests", getFailedTestsFilter("filtered"));
    }

    function showTCFilterForManuallyCheckedTests () {
        showTCFilterWindow("Filter For Manually Checked Tests",getFailedTestsFilter("checked"));
    }

    function showTCFilterWindow(windowTitle, failedTestsFilter)
    {
        var myWidth= 600;
        var myHeight= 280;
        var left = (screen.width - myWidth) / 2;
        var top = (screen.height - myHeight) / 4;

        var myWindow = window.open("", "", 'directories=no,toolbar=no,location=no,status=no,menubar=no,width='+myWidth+',height='+myHeight+',top='+top+',left='+left);
	myWindow.document.write('<div style="width: 100%;height: 100%"><textarea cols="80" rows="15" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;width:100%;height:100%">' + failedTestsFilter + '</textarea></div>');
        myWindow.onload = function() { this.document.title = windowTitle; }
        myWindow.document.close();
    }

    function triggerRerunBuildAll(){
        return triggerRerunBuild("all");
    }

    function triggerRerunBuildChecked(){
        return triggerRerunBuild("checked");
    }

    function triggerRerunBuildFiltered(){
        return triggerRerunBuild("filtered");
    }

    function getTests() {
        return new Promise(function (resolve, reject) {
            var testsElements = document.querySelectorAll('span[id*=testNameId]');

            if (tests && Object.keys(tests).length === testsElements.length) {
                resolve(tests);
            }
            else {
                tests = {};

                var buildId = getBuildId();
                for (var i = 0; i < testsElements.length; i++) {
                    (function (index) {
                        var testNameIdSpan = testsElements[index];
                        var testNameId = testNameIdSpan.id;
                        tests[testNameId] = {};
                        var testData = tests[testNameId];

                        var testActionsPopupId = testsElements[index].querySelector("span[id*=testActionsPopup]").id;
                        var testActionsPopup = document.getElementById(testActionsPopupId + 'Content');
                        var buildLogIcon = testActionsPopup.querySelector("a.tc-icon_build-log");
                        var buildLogHref = buildLogIcon.href;
                        var testId = buildLogHref.substring(buildLogHref.lastIndexOf('=') + 1);
                        testData.testId = testId;

                        var xhr = new XMLHttpRequest();
                        xhr.open("GET", "/failedTestText.html?buildId=" + buildId + "&testId=" + testId, true);
                        xhr.send();
                        testData.xhr = xhr;

                        xhr.onreadystatechange = function () {
                            if (xhr.readyState == 4) {
                                if (xhr.status == 200) {
                                    testData.errorText = decodeHtmlText(xhr.responseText);

                                    if (Object.keys(tests).all(function (itemKey) { return tests[itemKey].xhr && tests[itemKey].xhr.status == 200 && tests[itemKey].errorText !== undefined; })) {
                                        resolve(tests);
                                    }
                                }
                                else {
                                    reject();
                                }

                            }
                        };

                        tests[testNameId] = testData;
                    })(i);
                }
            }
        });
    }

    function decodeHtmlText(htmlText) {
        var txt = document.createElement("textarea");
        txt.innerHTML = htmlText;
        return txt.value;
    }

    function getBuildId() {
        var locationSearch = window.location.search;
        var startIndex = locationSearch.indexOf('buildId=') + 8;
        var endIndex = locationSearch.indexOf('&', startIndex);

        var buildId = endIndex === -1 ? locationSearch.substring(startIndex) : locationSearch.substring(startIndex, endIndex);
        return buildId;
    }

    function resetFilter() {
        var testRows = document.querySelectorAll('#idfailedDl table.testList > tbody > tr[filtered=true]');
        for (var i = 0; i < testRows.length; i++) {
            testRows[i].removeAttribute('filtered');
            testRows[i].style.display = '';
        }
    }

    function filterTests(containingString, positiveSearch) {
        return new Promise(function (resolve, reject) {
            var onFulfilled = function (testsData) {
                console.log('Filter by: ' + containingString + ', contains: ' + positiveSearch);

                var filteredCounter = 0;

                var testRows = document.querySelectorAll('#idfailedDl table.testList > tbody > tr:not(.testDetailsRow)');
                for (var i = 0; i < testRows.length; i++) {
                    var testRow = testRows[i];
                    var testNameId = testRow.querySelector("span[id*=testNameId]").id;
                    var testData = testsData[testNameId];

                    if ((testData.errorText.indexOf(containingString) !== -1) != positiveSearch) {
                        filteredCounter++;

                        testRow.setAttribute('filtered', 'true');
                        testRow.style.display = 'none';
                        if (testRow.className == 'testDetailsShown') {
                            var testDetails = testRow.nextSibling;
                            testDetails.setAttribute('filtered', 'true');
                            testDetails.style.display = 'none';
                        }
                    }
                }
                console.log('Filtered rows: ' + filteredCounter);
                resolve();
            };

            getTests().then(onFulfilled, reject);
        });
    }

    function showLoadingIcon(show) {
        var displayValue = show ? "" : "none";
        document.getElementById('filter-tests-loading').style.display = displayValue;
    }

    function addControls() {
        var toolbar = document.querySelector('#tst_group_build_failRefreshInner table.bulk-toolbar td.testNamePart');
        if (toolbar && !toolbar.hasAttribute('filterBlockAdded')) {
            var filterSpan = document.createElement('SPAN');
            toolbar.appendChild(filterSpan);
            filterSpan.outerHTML = `
<span style="float:right" id="filter-tests">
	<i id="filter-tests-loading" class="icon-refresh icon-spin" style="display:none"></i>
	Filter By failure message:
	<select id="filter-tests-positive">
		<option value="true">contains</option>
		<option value="false">not contains</option>
	</select>
	<input class="textField" id="filter-tests-by" type="text">
	<input class="btn" id="filter-tests-filter" type="button" value="Filter">
	<input class="btn" id="filter-tests-reset" type="button" value="Reset">
    <span style="float:right;padding-left:10px;" id="getfiltertc">
         <span>Filter for TC: </span>
           <select id="get-filter-tests-options">
	       </select>
         <input class="btn" id="show-tc-filter-for-tests" type="button" value="Show">
<!--
         <input class="btn" id="show-filter-for-rerun-unfiltered-tests" type="button" value="Unhidden">
         <input class="btn" id="show-filter-for-rerun-manuallychecked-tests" type="button" value="Man. Checked">
-->
    </span>
</span>
<!--
<span style="float:right;padding-right:50px;" id="rerunsection">
    Rerun:
    <input class="btn" id="rerun-all-failed" type="button" value="All">
	<input class="btn" id="rerun-checked" type="button" value="Manually Checked">
    <input class="btn" id="rerun-filtered" type="button" value="Unhidden">
</span>
-->`;

            var getFilterTestsOptions = document.getElementById('get-filter-tests-options');
            getFilterTestsOptions.innerHTML = getFilterOptions();
            var showTCFilterButton = document.getElementById('show-tc-filter-for-tests');

            showTCFilterButton.onclick = function () {
                var tcFilterBy = getFilterTestsOptions.options[getFilterTestsOptions.selectedIndex].value;
                showTCFilterWindow(tcFilterBy+' ['+getFailedTestsNumber(tcFilterBy)+']',getFailedTestsFilter(tcFilterBy));
            };
/*
            var rerunAllButton = document.getElementById('rerun-all-failed');
            var rerunCheckedButton = document.getElementById('rerun-checked');
            var rerunFiltered = document.getElementById('rerun-filtered');

            rerunAllButton.onclick = triggerRerunBuildAll;
            rerunCheckedButton.onclick = triggerRerunBuildChecked;
            rerunFiltered.onclick = triggerRerunBuildFiltered;
*/
            var filterButton = document.getElementById('filter-tests-filter');
            var resetFilterButton = document.getElementById('filter-tests-reset');
            var positiveSearchSelect = document.getElementById('filter-tests-positive');
            var searchByTextField = document.getElementById('filter-tests-by');
/*
            var getFilterTCButton = document.getElementById('show-filter-for-rerun-unfiltered-tests');
            var getFilterManuallyCheckedTCButton = document.getElementById('show-filter-for-rerun-manuallychecked-tests');

            getFilterTCButton.onclick = showTCFilterForUnhiddenTests;
            getFilterManuallyCheckedTCButton.onclick = showTCFilterForManuallyCheckedTests;
*/
            filterButton.onclick = function () {
                showLoadingIcon(true);
                var filterBy = searchByTextField.value;
                var positiveSearch = positiveSearchSelect.options[positiveSearchSelect.selectedIndex].value == 'true';
                filterTests(filterBy, positiveSearch)
                    .then(function () { showLoadingIcon(false); });
            };

            resetFilterButton.onclick = resetFilter;

            toolbar.setAttribute('filterBlockAdded', 'true');
        }
    }

    function loop() {
        setTimeout(function () {
            addControls();
            loop();
        }, 500);
    }
    loop();
})();
