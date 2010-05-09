/* 
 This file was generated by Dashcode and is covered by the 
 license.txt included in the project.  You may edit this file, 
 however it is recommended to first turn off the Dashcode 
 code generator otherwise the changes will be lost.
 */
var dashcodePartSpecs = {
    "done": { "creationFunction": "CreateGlassButton", "onclick": "showFront", "text": "Done" },
    "info": { "backgroundStyle": "black", "creationFunction": "CreateInfoButton", "foregroundStyle": "white", "frontID": "front", "onclick": "showBack" },
    "progressIndicator": { "criticalValue": 15, "onValue": 1, "view": "DC.Indicator", "warningValue": 10 },
    "progressText": { "view": "DC.Text" },
    "projectsPopup": { "creationFunction": "CreatePopupButton", "leftImageWidth": 10, "onchange": "projectsPopupChanged", "rightImageWidth": 16 },
    "startStopButton": { "creationFunction": "CreateButton", "leftImageWidth": 5, "onclick": "startStopTimer", "rightImageWidth": 5, "text": "Start" },
    "submitButton": { "creationFunction": "CreateButton", "disabled": true, "leftImageWidth": 5, "onclick": "submitButtonClicked", "rightImageWidth": 5, "text": "Submit" },
    "text": { "text": "Basecamp URL:", "view": "DC.Text" },
    "text1": { "text": "Basecamp API Token:", "view": "DC.Text" }
};




