/*
 *
 * Author: Adam Cosenino
 * Date: March 4, 2016
 * Description: Form Javascript framework for Wayne Savings Community Bank
 *							This frame work can be used on all html based documents for saving
 *							and loading purposes. 
 *
 */

"use strict";

/*
 * Base Form initialization
 * 
 * 1) attaches change listener to update visuals to all fields
 * 2) runs the visaul cleanup
 * 3) runs the set date and time function on all labeled fields
 * 4) runs digital signature function on correct fields
 */
function initializeForm(){
	var fields = document.getElementsByClassName("Savable");
	for(var i = 0; i < fields.length; i++){
		fields[i].addEventListener("change", visualCleanup, true);
	}
	visualCleanup();
	setDateTime();
	digitalSig();
}

/*
 * Sets spcifically marked elements with current date and/or time
 * 
 * Elements with Date class tag will recieve current date
 * Elements with Time class tag will recieve current time
 * Elements with DateTime class will recieve current date and time
 *
 */
var setDateTime = function (){
	var d = new Date();
	var date = (parseInt(d.getMonth()) > 9 ? "" : "0") + (parseInt(d.getMonth()) + 1) + "/" + (d.getDate() > 10 ? "" : "0") + d.getDate() + "/" + d.getFullYear();
	var time = ((parseInt(d.getHours()) % 12) > 0 ? "" : "0") + (parseInt(d.getHours()) % 12) + ":" + (d.getMinutes() > 10 ? "" : "0") + d.getMinutes() + ":" + (d.getSeconds() > 10 ? "" : "0") + d.getSeconds() + " " + (d.getHours() > 11 ? "PM" : "AM");

	var curDate = document.getElementsByClassName("Date");
	var curTime = document.getElementsByClassName("Time");
	var all = document.getElementsByClassName("DateTime");
	for(var i = 0; i < curDate.length; i++){
		curDate[i].value = date;
	}
	for(var i = 0; i < curTime.length; i++){
		curTime[i].value = time;
	}
	for(var i = 0; i < all.length; i++){
		all[i].value = date + " " + time;
	}
}

/*
 * Checks if all required elements have values
 *
 * Elements with Required class tag will be selected and tested for empty value.
 * Will return true if all required elements are filled and false if any one is not filled.
 *
 */
var checkRequired = function (){
	var allow = true;
	var reqs = document.getElementsByClassName("Required")
	for(var i = 0; i < reqs.length; i++) {
		if(reqs[i].tagName === "INPUT" && reqs[i].type === "checkbox") {
			allow = reqs[i].checked;
		} else {
			if(reqs[i].value == "") allow = false;
		}
	}
	return allow;
}

/*
 * Collects values for all savable elements and prompts for download
 * 
 * Elements with Savable class tag will be selected.  the ID will be used as teh key and
 * value will be used for the value and saved as a JSON file with file name as provided.
 * If no file name is provided will be saved as NewData.json.
 *
 */
function save(filename, formName, formVersion, encryption){
	if(checkRequired()){
		var fields = document.getElementsByClassName("Savable");
		var text = "\"formName\"\:\"" + formName +"\",\n";
		text += "\"formVersion\"\:\"" + formVersion +"\",\n";

		for(var i = 0; i < fields.length; i++){
			if(i > 0) text += ",\n";

			if(fields[i].tagName == "INPUT" && fields[i].type == "checkbox"){
				text += "\"" + fields[i].id + "\"\:" + fields[i].checked;
			} else {
				text += "\"" + fields[i].id + "\"\:\"" + fields[i].value + "\"";
			}
		}

		// Digest message
		var digest = encryption(text + ",\n");
		if(digest != null){
			text += ",\n\"digest\"\:\"" + digest + "\"";
		}

		text = "{\n" + text + "\n}";

		var tab = new Blob([text], {type:"text/json"});
		window.navigator.msSaveBlob(tab,filename);
	} else {
		alert("SAVE ABORTED\n\nPlease be sure to fill out all Required Fields.\nRequired fields are outlined in red.");
	}
}

/*
 * Loads .json file and fills savable fields with provided values
 *
 * Loads file selected and parses information to proper element
 * Checks in place for correct file type form data matching and version matching
 *
 */
function load(file, formName, formVersion, update, encryption) {
	var reader = new FileReader();

	if(file.name.search(".json") === -1){
		alert("Incorrect File Type");
		return;
	}

	reader.onload = function() {
		var jsonData = JSON.parse(reader.result);
		
		if(!sigTest(encryption, jsonData)) {
			alert("Data Corrupted");
			return;
		}

		var allKeys = Object.keys(jsonData);

		if(jsonData["formName"] != formName) {
			alert("Incorrect Form Data");
			return;
		}
		if(jsonData["formVersion"] != formVersion){
			alert("Incorrect Form Version");
			return; 
		}

		for (var key in allKeys){
			if(allKeys[key] != "formName" && allKeys[key] != "formVersion" && allKeys[key] != "digest" && allKeys[key] != "" && allKeys[key] != "authSig"){
				var field = document.getElementById(allKeys[key]);
				if(field.tagName == "INPUT" && field.type == "checkbox") {
					field.checked = jsonData[allKeys[key]];
				} else{
					field.value = jsonData[allKeys[key]];
					if(allKeys[key].search("RowCount") != -1) updateRows();
				}
			}
		}

		update();
		visualCleanup();
	};
	reader.readAsText(file);
}

/*
 * Tests to see if data is corrupt
 */
function sigTest(encryption, jsonData){
	var text = "";
	var digest = "";

	var allKeys = Object.keys(jsonData);
	for (var key in allKeys){

		if(allKeys[key] != "digest") {
			if(typeof jsonData[allKeys[key]] != "string") {
				text += "\"" + allKeys[key] + "\"\:" + jsonData[allKeys[key]] +",\n";
			} else {
				text += "\"" + allKeys[key] + "\"\:\"" + jsonData[allKeys[key]] +"\",\n";
			}
		} else {
			digest = jsonData[allKeys[key]];
		}
	}

	var test = encryption(text);

	if(test != null && test != digest) {
		return false;
	}

	return true;
}

/*
 * Signs a for with the PRS of the person saving the document.
 *
 * To include this add an input text element with a Signature and Savable class tag
 * This element should always be used for authenticity and may be visible or hidden.
 */
function digitalSig() {
	var user = "";
	var objFSO = new ActiveXObject("Scripting.FileSystemObject");
	for(var e = new Enumerator(objFSO.Drives); !e.atEnd(); e.moveNext()) {
		var objDrive = e.item();
		if(objDrive.DriveLetter == "U"){
			user = (objDrive.ShareName).slice((objDrive.ShareName).lastIndexOf("\\") + 1);
		}
	}

	var sigs = document.getElementsByClassName("Signature");
	for(var i = 0; i < sigs.length; i++){
		sigs[i].readOnly = true;
		sigs[i].value = user;
	}
}

/*
 * Used to Visually clean up the elements
 */
function visualCleanup(){
	var reqs = document.getElementsByClassName("Required");
	for(var i = 0; i < reqs.length; i++) {
		if(reqs[i].tagName == "INPUT" && reqs[i].type == "checkbox") {
			if(!reqs[i].checked) reqs[i].parentNode.style.backgroundColor = "pink";
			else reqs[i].parentNode.style.backgroundColor = "white";
		} else {
			if(reqs[i].value == "") reqs[i].style.border = "2px solid red";
			else reqs[i].style.border = "1px solid DimGray";
		}
	}

	var selects = document.getElementsByTagName("select");
	for (var i = 0; i < selects.length; i++){
		if(selects[i].value == "") {
			selects[i].style.color = "gray";
		} else {
			selects[i].style.color = "black";
		}
	}
}

/*
 * Following functions are for dynamic adding and removing of savable fields.
 *
 * Please note that the following lines should be added for functionality of these forms
 * In the following lines <NAME> should be replaced with a colection name and basic
 * structure should be provided with in the html
 * 
 * Below is a hidden field to keep count of dynamic rows for saving and loading
 * <input type="hidden" id="<NAME>RowCount" max="0" min="1" value="1">
 * set max to max number of rows (default of infinite)
 * set min to min number of rows (default of 1)
 *
 * <table id="<NAME>"> This will house the dynamic rows
 * <tr id="<NAME>Row"> This is the row itself
 * 
 * Below are dynamic row controls
 * <button onclick="addRow('<NAME>');">Add Event</button>
 * <button onclick="removeRow('<NAME>');">Remove Event</button>
 */

/*
 * Will increase the number of dynamic row elements by a value.
 * value defaults to 1
 */
function addRow(element, val){
	var count = typeof val == "undefined" ? 1 : val;

	var rowCount = document.getElementById(element+"RowCount");
	if(rowCount.max != "") {
		var max = parseInt(rowCount.max);
		if(parseInt(rowCount.value) == max) alert("Cannot add row");
		else rowCount.value = (parseInt(rowCount.value) + count > max ? max : parseInt(rowCount.value) + count); 
	} else {
		rowCount.value = parseInt(rowCount.value) + count;
	}

	updateRows();
}

/*
 * Will decrease the number of dynamic row elements by a value.
 * value defaults to 1
 */
function removeRow(element, val){
	var count = typeof val == "undefined" ? 1 : val;

	var rowCount = document.getElementById(element+"RowCount");
	var min = (rowCount.min == "" ? 1 : parseInt(rowCount.min));
	if(parseInt(rowCount.value) == min) alert("Cannot remove row");
	else {
		rowCount.value = (parseInt(rowCount.value) - count < min ? min : parseInt(rowCount.value) - count);
		updateRows();
	}
}

/*
 * Basic dynamic row update ()
 */
function updateRows(){
	var counts = document.getElementsByClassName("Count");
	for(var i = 0 ; i < counts.length; i++){
		var tab = document.getElementById(counts[i].id.replace("RowCount", ""));
		var curCount = tab.getElementsByTagName("tr").length - 2;
		
		var diff = parseInt(counts[i].value) - curCount;

		if(diff > 1) {
			var row = document.getElementById(counts[i].id.replace("Count", ""));
			for(var j = 1; j < diff; j++){
				var clone = row.cloneNode(true);
				clone.id = clone.id + (curCount + j);
				
				var clonedChild = clone.getElementsByClassName("Savable");
				for(var k = 0; k < clonedChild.length; k++){
					clonedChild[k].id = clonedChild[k].id + (curCount + j);
					clonedChild[k].value = "";
				}
				tab.tBodies[0].appendChild(clone);
			}
		} else if(diff < 1) {
			while(diff != 1) {
				var last = tab.getElementsByTagName("tr");
				tab.tBodies[0].removeChild(last[last.length-1]);
				diff++;
			}
		}
	}
}