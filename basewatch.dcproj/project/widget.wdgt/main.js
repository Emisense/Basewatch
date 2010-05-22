/* 
 This file was generated by Dashcode.  
 You may edit this file to customize your widget or web page 
 according to the license.txt file included in the project.
 */
 


var finishedSecondsPrefKey = dashcode.createInstancePreferenceKey("finished-seconds");
var timerStartPrefKey = dashcode.createInstancePreferenceKey("timer-start");
var apiURLPrefKey = dashcode.createInstancePreferenceKey("api-url");
var apiTokenPrefKey = dashcode.createInstancePreferenceKey("api-token");
var projectIdPrefKey = dashcode.createInstancePreferenceKey("project-id");

var progressLevelOff = 0;
var progressLevelOn = 1;
var progressLevelWarn = 2;
var progressLevelCrit = 3;

//
// Function: load()
// Called by HTML body element's onload event when the widget is ready to start
//
function load()
{
    dashcode.setupParts();
    finishedSeconds = parseInt( widget.preferenceForKey(finishedSecondsPrefKey) );
    if ( isNaN(finishedSeconds) )
        finishedSeconds = 0;
    timerStart = widget.preferenceForKey(timerStartPrefKey);
    if ( timerStart != null )
    {
        timerStart = new Date(timerStart);
        timerTimeout = setTimeout( "updateTimerCallback()", 1000 );
        startStopButton.object.textElement.innerHTML = 'Stop';
    }
    updateTimer();
    var apiUrl = widget.preferenceForKey(apiURLPrefKey);
    if ( apiUrl == undefined && local.apiUrl != undefined )
        apiUrl = local.apiUrl;
    if ( apiUrl != undefined )
        document.getElementById('apiURLTextField').value = apiUrl;
    var apiToken = widget.preferenceForKey(apiTokenPrefKey);
    if ( apiToken == undefined && local.apiToken != undefined )
        apiToken = local.apiToken;
    if ( apiToken != undefined )
        document.getElementById('apiTokenTextField').value = apiToken;
    var progressIndicatorObject = document.getElementById('progressIndicator').object;
    progressIndicatorObject.setOnValue( progressLevelOn );
    progressIndicatorObject.setWarningValue( progressLevelWarn );
    progressIndicatorObject.setCriticalValue( progressLevelCrit );
    updateSubmitButton();
    populateProjects();
}

//
// Function: remove()
// Called when the widget has been removed from the Dashboard
//
function remove()
{
    // Stop any timers to prevent CPU usage
    // Remove any preferences as needed
    // widget.setPreferenceForKey(null, dashcode.createInstancePreferenceKey("your-key"));
}

//
// Function: hide()
// Called when the widget has been hidden
//
function hide()
{
    if ( timerStart )
        clearTimeout(timerTimeout);
}

//
// Function: show()
// Called when the widget has been shown
//
function show()
{
    updateTimer();
    if ( timerStart )
        timerTimeout = setTimeout( "updateTimerCallback()", 1000 );
}

//
// Function: sync()
// Called when the widget has been synchronized with .Mac
//
function sync()
{
    // Retrieve any preference values that you need to be synchronized here
    // Use this for an instance key's value:
    // instancePreferenceValue = widget.preferenceForKey(null, dashcode.createInstancePreferenceKey("your-key"));
    //
    // Or this for global key's value:
    // globalPreferenceValue = widget.preferenceForKey(null, "your-key");
}

//
// Function: showBack(event)
// Called when the info button is clicked to show the back of the widget
//
// event: onClick event from the info button
//
function showBack(event)
{
    var front = document.getElementById("front");
    var back = document.getElementById("back");

    if (window.widget) {
        widget.prepareForTransition("ToBack");
    }

    front.style.display = "none";
    back.style.display = "block";

    if (window.widget) {
        setTimeout('widget.performTransition();', 0);
    }
}

function setProgress( level, text )
{
    var progressIndicatorObject = document.getElementById('progressIndicator').object;
    progressIndicatorObject.setValue(level);
    var progressText = document.getElementById('progressText');
    progressText.innerHTML = text;
}

var submittingTime = false;
function updateSubmitButton()
{
    var projectsPopup = document.getElementById('projectsPopup').object;
    var submitButton = document.getElementById('submitButton').object;
    var commentTextarea = document.getElementById('commentTextarea');
    var enabled = BasecampAPI.ready() && !submittingTime && commentTextarea.value.length > 0 && projectsPopup.getSelectedIndex() > 0 && totalSeconds() > 0;
    submitButton.setEnabled(enabled);
    submitButton.textElement.style.setProperty( 'color', enabled? 'black': 'gray' );
}

function projectsPopupChanged()
{
    var projectsPopup = document.getElementById('projectsPopup').object;
    widget.setPreferenceForKey( projectsPopup.getValue(), projectIdPrefKey );
    updateSubmitButton();
}

function commentTextareaChanged()
{
    updateSubmitButton();
}

function populateProjects()
{
    var projectsPopup = document.getElementById('projectsPopup').object;
    var projectsSelect = document.getElementById('projectsPopup').lastElementChild;
    if ( projectsSelect.hasChildNodes() )
    {
        while ( projectsSelect.childNodes.length >= 1 )
            projectsSelect.removeChild( projectsPopup.firstChild );       
    }
    var apiURL = document.getElementById('apiURLTextField').value;
    var apiToken = document.getElementById('apiTokenTextField').value;
    if ( apiURL != '' && apiToken != '' )
    {
        setProgress( progressLevelWarn, "Logging in..." );
        BasecampAPI.login( apiURL, apiToken, function( api, result ) {
            if ( result )
            {
                var option = document.createElement("option");
                option.text = '(select a project)';
                option.value = null;
                option.disabled = true;
                projectsSelect.appendChild(option);
                var index = 1;
                var selectedIndex = 0;
                var persistedProjectId = widget.preferenceForKey(projectIdPrefKey);
                for ( var companyId in api.companies )
                {
                    var company = api.companies[companyId];
                    var haveCompanyOption = false;
                    for ( var projectId in company.projects )
                    {  
                        /*
                        if ( !haveCompanyOption )
                        {
                            var comapnyOption = document.createElement("option");
                            comapnyOption.text = company.name;
                            comapnyOption.value = null;
                            comapnyOption.disabled = true;
                            projectsSelect.appendChild(comapnyOption);
                            haveCompanyOption = true;
                        }
                        */
                        var project = company.projects[projectId];
                        var option = document.createElement("option");
                        option.text = company.name+" - "+project.name;
                        option.value = project.id;
                        projectsSelect.appendChild(option);
                        if ( project.id == persistedProjectId )
                            selectedIndex = index;
                        ++index;
                    }
                }
                projectsPopup.setSelectedIndex(selectedIndex);
                setProgress( progressLevelOn, "Logged in." );
            }
            else
                setProgress( progressLevelCrit, "Failed to log in!" );
            updateSubmitButton();
        } );
    }
    else
        setProgress( progressLevelCrit, "No login credentials!" );
}

//
// Function: showFront(event)
// Called when the done button is clicked from the back of the widget
//
// event: onClick event from the done button
//
function showFront(event)
{
    var apiURL = document.getElementById('apiURLTextField').value;
    widget.setPreferenceForKey( apiURL, apiURLPrefKey );
    var apiToken = document.getElementById('apiTokenTextField').value;
    widget.setPreferenceForKey( apiToken, apiTokenPrefKey );
    populateProjects();
    
    var front = document.getElementById("front");
    var back = document.getElementById("back");

    if (window.widget) {
        widget.prepareForTransition("ToFront");
    }

    front.style.display="block";
    back.style.display="none";

    if (window.widget) {
        setTimeout('widget.performTransition();', 0);
    }
}

if (window.widget) {
    widget.onremove = remove;
    widget.onhide = hide;
    widget.onshow = show;
    widget.onsync = sync;
}
var finishedSeconds;
var timerStart;

function totalSeconds()
{
    var totalSeconds = finishedSeconds;
    if ( timerStart )
    {
        var timerEnd = new Date;
        totalSeconds += (timerEnd.getTime() - timerStart.getTime()) / 1000;
    }
    return totalSeconds;
}

function formatHMS( value )
{
    if ( value < 10 )
        return "0"+value;
    else
        return value;
}

function formatSeconds( totalSeconds )
{
    var hours = Math.floor( totalSeconds / 3600 );
    var minutes = Math.floor( (totalSeconds - 3600*hours) / 60);
    var seconds = Math.floor( totalSeconds - 3600*hours - 60*minutes );
    return formatHMS(hours)+'h'+formatHMS(minutes)+'m'+formatHMS(seconds)+'s';
}
var timerTimeout;

function updateTimer()
{
    var timer = document.getElementById('timerTextField');
    timer.value = formatSeconds( totalSeconds() );
}

function updateTimerCallback()
{
    if ( timerStart )
    {
        updateTimer();
        timerTimeout = setTimeout( "updateTimerCallback()", 1000 );
        updateSubmitButton();
    }
}

function isTimerRunning()
{
    return !!timerStart;
}

function setFinishedSeconds( value )
{
    finishedSeconds = value;
    widget.setPreferenceForKey( value+'', finishedSecondsPrefKey );
}

function setTimerStart( value )
{
    timerStart = value;
    if ( value == null )
        widget.setPreferenceForKey( null, timerStartPrefKey );
    else
        widget.setPreferenceForKey( value.toString(), timerStartPrefKey );
}

function startTimer()
{
    var timerTextField = document.getElementById('timerTextField');
    timerTextField.blur();
    setFinishedSeconds( parseTimerTextField( timerTextField.value ) );
    setTimerStart( new Date );
    timerTimeout = setTimeout( "updateTimerCallback()", 1000 );
    startStopButton.object.textElement.innerHTML = 'Stop';
}

function stopTimer()
{
    if ( timerTimeout )
    {
        clearTimeout(timerTimeout);
        timerTimeout = null;
    }
    setFinishedSeconds( totalSeconds() );
    setTimerStart( null );
    startStopButton.object.textElement.innerHTML = 'Start';
}

function resetTimer()
{
    stopTimer();
    setFinishedSeconds( 0 );
    updateTimer();
}    
    
function convexFloatToHex( f )
{
    var intVal = Math.floor(256*f);
    if ( intVal == 256 )
        intVal = 255;
    return "0123456789abcdef".charAt( Math.floor(intVal/16) ) + "0123456789abcdef".charAt( intVal%16 );
}

function rgbToHexColor( r, g, b )
{
    return "#" + convexFloatToHex(r) + convexFloatToHex(g) + convexFloatToHex(b);
}

function flashTimerTextField( red )
{
    var timerTextField = document.getElementById('timerTextField');
    var handler = function( animation, current, start, finish )
    {
        if ( red )
            timerTextField.style.backgroundColor = rgbToHexColor( 1, current, current );
        else
            timerTextField.style.backgroundColor = rgbToHexColor( current, 1, current );
    };
    new AppleAnimator( 500, 50, 0.66, 1, handler ).start();
}

function startStopTimer(event)
{
    var startStopButton = document.getElementById('startStopButton');
    if ( isTimerRunning() )
    {
        stopTimer();
        flashTimerTextField(true);
    }
    else
    {
        startTimer();
        flashTimerTextField(false);
    }
}


function clickTimerTextField(event)
{
    if ( isTimerRunning() )
        stopTimer();
}

function parseTimerTextField( value )
{
    var seconds = 0;
    var reg = 0;
    var exp = -1;
    for ( var i=0; i<value.length; ++i )
    {
        var char = value.charAt(i);
        var index = "0123456789".indexOf(char);
        if ( index >= 0 )
        {
            reg = 10*reg + index;
            if ( exp != -1 )
                ++exp;
        }
        else if ( char == '.' )
        {
            exp = 0;
        }
        else if ( "hms".indexOf(char) != -1 )
        {
            var mult = { 'h':3600, 'm':60, 's':1 }[char];
            if ( exp == -1 )
                exp = 0;
            seconds += Math.round(mult*reg*Math.pow(10,-exp));
            reg = 0;
            exp = -1;
        }
    }
    return seconds;
}


function changeTimerTextField(event)
{
    setFinishedSeconds( parseTimerTextField( timerTextField.value ) );
    updateTimer();
    if ( !isTimerRunning() )
    {
        startTimer();
        flashTimerTextField(false);
    }
}

function submitButtonClicked(event)
{
    var seconds = totalSeconds();
    var comment = document.getElementById('commentTextarea').value;
    var projectId = document.getElementById('projectsPopup').object.getValue();
    if ( seconds > 0 && comment.length > 0 && projectId )
    {
        stopTimer();
        submittingTime = true;
        updateSubmitButton();
        setProgress( progressLevelWarn, "Submitting time..." );        
        BasecampAPI.submitTime( projectId, seconds, comment, function( api, result ) {
            if ( result )
            {
                setProgress( progressLevelOn, "Time submitted." );
                resetTimer();
                document.getElementById('commentTextarea').value = "";
            }
            else
                setProgress( progressLevelCrit, "Failed to submit time." );
            submittingTime = false;
            updateSubmitButton();
        } );
    }
}
