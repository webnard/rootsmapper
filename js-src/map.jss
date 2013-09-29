﻿var map;
var oms;
var polyarray = [];
var markarray = [];
var infoarray = [];
var accesstoken;
var infowindow = new google.maps.InfoWindow();
var genquery;
var nSearches;
var delay = 1;
var baseurl;
var userID;


google.maps.event.addDomListener(window, 'load', initialize);


    function initialize() {

        var lat = 30.0;
        var lng = -30.0;
        var place = new google.maps.LatLng(lat, lng);
        var mapOptions = {
            zoom: 3,
            center: place,
            streetViewControl: false,
            panControl: false,
            zoomControl: true,
            zoomControlOptions: {
                style: google.maps.ZoomControlStyle.DEFAULT,
                position: google.maps.ControlPosition.LEFT_BOTTOM
            }
        }
        map = new google.maps.Map(document.getElementById('mapdisplay'), mapOptions);
        oms = new OverlappingMarkerSpiderfier(map, { keepSpiderfied: true, nearbyDistance: 35 });
        mc = new MarkerClusterer(map, [], {
            maxZoom: 4,
            gridSize: 20,
            zoomOnClick: true,
            styles: [{ url: 'images/band2.png', height: 46, width: 46, anchor: [8, 0], textSize: 12, textColor: '#000000' }]
        });
        populateUser();

    }

    function ancestorgens() {

        clearOverlays();
        startEvents();
        var select = document.getElementById('genSelect');
        genquery = parseFloat(select.value);
        getPedigree(genquery, undefined, undefined);

    }

    function ancestorExpand(id, rootGen, paternal) {

        startEvents();
        genquery = 1;
        getPedigree(1, id, rootGen, paternal);

    }

    function getPedigree(gen, root, rootGen, paternal) {
        var generations = gen;


        if (root) {
            personId = root;
            // if empty, use user default
        } else {
            var querythis = document.getElementById('personid');
            var personId = querythis.value;
        }

        var url = baseurl + "pedigree/" + personId + "?ancestors=" + generations + "&properties=all&sessionId=" + accesstoken;

        var xhttp;
        xhttp = new XMLHttpRequest();
        xhttp.open("GET", url);

        xhttp.onload = function (e) {
            if (xhttp.readyState === 4) {
                if (xhttp.status === 200) {

                    var xmlDocument = xhttp.responseXML.documentElement;

                    // Loop through first half of pedigree list and get IDs of their parents
                    var persons = xmlDocument.getElementsByTagName("person");
                    var IDs = new Array();
                    IDs[0] = persons[0].getAttribute("id");
                    for (var i = 0; i < Math.pow(2, generations) - 1; i++) {
                        if (persons[i]) {
                            var parents = persons[i].getElementsByTagName("parent");
                            if (parents.length > 1) {
                                IDs[(i + 1) * 2 - 1] = parents[0].getAttribute("id");
                                IDs[(i + 1) * 2] = parents[1].getAttribute("id");
                            } else {
                                IDs[(i + 1) * 2 - 1] = undefined;
                                IDs[(i + 1) * 2] = undefined;
                            }
                        } else {
                            IDs[(i + 1) * 2 - 1] = undefined;
                            IDs[(i + 1) * 2] = undefined;
                        }
                    }

                    readPedigreeLoop(IDs,rootGen,paternal);
                } else {
                    completionEvents();
                    alert("Error: " + xhttp.statusText);
                }
            }
        };

        xhttp.send();
        
    }

    function readPedigreeLoop(IDs, rootGen, paternal) {

        var tryagain = true;
        var placequery;
        delay = 1;
        var num = IDs.length;
        var progenitors = new Array();
        if (!rootGen) { rootGen = 0; }

        asyncLoop(num, function (loop) {

            var idx = loop.iteration();
            var ID = IDs[idx];
            if (ID) {
                personRead(ID, function (result) {
                    if (result) {
                        if (result == 503) {
                            loop.prev();
                            loop.next();
                        } else {
                            progenitors[idx] = result;
                            progenitors[idx].generation = Math.ceil(log2(idx + 2)) - 1 + rootGen;
                            if (idx == 0) {
                                progenitors[idx].isPaternal = paternal;
                            } else if (idx == 1 && progenitors[idx].generation == 1) {
                                progenitors[idx].isPaternal = true;
                            } else if (idx == 2 && progenitors[idx].generation == 1) {
                                progenitors[idx].isPaternal = false;
                            } else {
                                if (progenitors[idx].gender == "Male") {
                                    if (progenitors[(idx + 1) / 2 - 1]) {
                                        progenitors[idx].isPaternal = progenitors[(idx + 1) / 2 - 1].isPaternal;
                                    }
                                } else {
                                    if (progenitors[idx / 2 - 1]) {
                                        progenitors[idx].isPaternal = progenitors[idx / 2 - 1].isPaternal;
                                    }
                                }
                            }

                            if (placequery) {
                                var place = placequery;
                            } else {
                                var place = progenitors[idx].birth.place;
                            }

                            setTimeout(function () {
                                getLatLng(place, function (res) {

                                    progenitors[idx].birth.latlng = res;
                                    if (res == "empty") {
                                        delay++
                                        loop.prev();
                                        loop.next();
                                    } else if (res == "other") {
                                        var loc = place.split(",");

                                        if (tryagain == true) { // Try one more query with City,Country as search text
                                            placequery = loc[0] + "," + loc[loc.length - 1];
                                            tryagain = false;
                                            loop.prev();
                                            loop.next();
                                        } else {
                                            console.log("Unable to find location \"" + progenitors[idx].birth.place + "\" for " + progenitors[idx].name + " (" + progenitors[idx].id + ")");
                                            progenitors[idx].birth.latlng = getChildBirthPlace(progenitors, idx);
                                            tryagain = true;
                                            placequery = undefined;
                                            callLoopNext(loop, progenitors);
                                        }
                                    } else if (!res) {
                                        console.log("Undefined birthplace for " + progenitors[idx].name + " (" + progenitors[idx].id + ")");
                                        progenitors[idx].birth.latlng = getChildBirthPlace(progenitors, idx);
                                        tryagain = true;
                                        placequery = undefined;
                                        callLoopNext(loop, progenitors);
                                    } else {
                                        //console.log("Google Maps search for birthplace \"" + progenitors[idx].birth.place + "\" for " + progenitors[idx].name + " returned successful.");
                                        tryagain = true;
                                        placequery = undefined;
                                        callLoopNext(loop, progenitors);
                                    }
                                })
                            }, delay);
                        }

                    } else {
                        progenitors[idx] = undefined;
                        callLoopNext(loop, progenitors);
                    }
                    
                });
            } else {
                progenitors[idx] = undefined;
                callLoopNext(loop, progenitors);
            }

        }, function () {});
    }

    function personRead(id, callback) {

        var url = baseurl + "person/" + id + "?&events=standard&sessionId=" + accesstoken;

        var xhttp;
        xhttp = new XMLHttpRequest();
        xhttp.open("GET", url);

        xhttp.onload = function (e) {
            if (xhttp.readyState === 4) {
                if (xhttp.status === 200) {

                    var xmlDocument = xhttp.responseXML.documentElement;

                    // Get full name of individual
                    var fullText = xmlDocument.getElementsByTagName("fullText");
                    if (fullText[0]) {
                        var name = fullText[0].textContent;
                    }

                    // Get user id if none was supplied
                    if (id == "") {
                        var person = xmlDocument.getElementsByTagName("person");
                        if (person[0]) {
                            id = person[0].getAttribute("id");
                        }
                    }

                    var genders = xmlDocument.getElementsByTagName("gender");
                    if (genders[0]) {
                        var gender = genders[0].textContent;
                    }

                    // Get birth date and location
                    var events = xmlDocument.getElementsByTagName("events");
                    if (events[0]) {
                        var value = events[0].getElementsByTagName("value");

                        if (value[0].getAttribute("type") == "Birth") {

                            var dates = value[0].getElementsByTagName("date");
                            var places = value[0].getElementsByTagName("place");

                            if (places[0]) {
                                if (places[0].childNodes[1]) {
                                    var birthPlace = places[0].childNodes[1].textContent;
                                } else {
                                    var birthPlace = places[0].childNodes[0].textContent;
                                }
                            }
                            if (dates[0]) {
                                if (dates[0].childNodes[1]) {
                                    var birthDate = dates[0].childNodes[1].textContent;
                                } else {
                                    var birthDate = dates[0].childNodes[0].textContent;
                                }
                            }
                        }
                    }

                    // Package birth information
                    var birth = {
                        date: birthDate,
                        place: birthPlace
                    }

                    // Package individual summary
                    var personObject = {
                        name: name,
                        id: id,
                        birth: birth,
                        gender: gender
                    }

                    // Send reply
                    callback(personObject);

                } else {
                    if (xhttp.status != 503) {
                        completionEvents();
                        alert("Error: " + xhttp.statusText);
                    } else {
                        callback(xhttp.status);
                    }
                }
            }
        };

        xhttp.send();
        
    }

    function getLatLng(place, callback) {

        if (place) {
            var geocoder = new google.maps.Geocoder();
            var georequest = {
                address: place
            };

            //setTimeout( function () {

            geocoder.geocode(georequest, function (result, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    var latlng = result[0].geometry.location;
                    callback(latlng);
                } else {
                    if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                        callback("empty");
                    } else {
                        callback("other");
                    }
                }
            })
        } else {
            callback(place);
        }
    }

    function callLoopNext(loop,progenitors) {

        var idx = loop.iteration();
        if ( log2(idx+2) == Math.round(log2(idx + 2)) ) { // Finished a complete generation
            if (idx !== 0) {
                checkBounds(progenitors,loop);
            } else {
                loop.next();
            }
        } else {
            loop.next();
        }
        
    }

    function checkBounds(progenitors,loop) {

        var bounds = new google.maps.LatLngBounds;
        var currentBounds = map.getBounds();

        if (firstTime == true) {
            makeInfoWindow(progenitors[0]);
            firstTime = false;
        }

        for (var i = 0; i < progenitors.length; i++) {
            if (progenitors[i]) {
                if (progenitors[i].birth.latlng) {
                    if (currentBounds.contains(progenitors[i].birth.latlng) == false) {
                        currentBounds.extend(progenitors[i].birth.latlng);
                        map.fitBounds(currentBounds);
                    }
                }
            }
        }
       
        plotNextGeneration(progenitors,loop);
    }

    function plotNextGeneration(progenitors, loop) {

        var idx = loop.iteration();
        var gen = log2(idx + 2) - 1; // Number of generations completed so far

        loadingAnimationEnd();
        var paths = Math.pow(2, gen);

        for (var j = paths - 1; j < 2 * paths - 1; j++) {
            var patharray = new Array();
            if (progenitors[j]) {
                patharray[1] = progenitors[j].birth.latlng;
            }
            var cdx = j;

            if (isEven(j + 1)) {
                // male
                cdx = (j + 1) / 2 - 1; // child of male
                if (progenitors[cdx]) {
                    patharray[0] = progenitors[cdx].birth.latlng;
                }
            } else {
                // female ancestor
                cdx = (cdx) / 2 - 1; // child of female
                if (progenitors[cdx]) {
                    patharray[0] = progenitors[cdx].birth.latlng;
                }
            }

            if (progenitors[j]) {
                if (progenitors[j].isPaternal == true) { // (j < 3 * paths / 2 - 1)
                    polymap(patharray, rgbToHex(74, 96, 255),"", j, function (result) { //rgbToHex(74,96,255) rgbToHex(0, 176, 240)
                        makeInfoWindow(progenitors[result]);
                        if (result == 2 * paths - 2) {
                            if (gen !== genquery) {
                                loadingAnimationStart();
                            } else {
                                completionEvents();
                            }
                            loop.next();
                        }
                    });
                } else {
                    polymap(patharray, rgbToHex(255, 96, 182),"", j, function (result) { // rgbToHex(255,96,182) rgbToHex(245, 139, 237)
                        makeInfoWindow(progenitors[result]);
                        if (result == 2 * paths - 2) {
                            if (gen !== genquery) {
                                loadingAnimationStart();
                            } else {
                                completionEvents();
                            }
                            loop.next();
                        }
                    });
                }
            } else if (j == 2 * paths - 2) {
                if (gen !== genquery) {
                    loadingAnimationStart();
                } else {
                    completionEvents();
                }
                loop.next();
            }
        }

    }

    function polymap(coords, color, thick, idx, callback) {

        var c1 = coords[0];
        var c2 = coords[1];

        if (c1 && c2) {

            var geodesicOptions = {
                strokeColor: color,
                strokeOpacity: 1.0,
                strokeWeight: 3,
                geodesic: true,
                path: [c1, c1],
                map: map
            };

            var geodesicPoly = new google.maps.Polyline(geodesicOptions);
            polyarray.push(geodesicPoly);

            var step = 0;
            var numSteps = 250; //Change this to set animation resolution
            var timePerStep = 1; //Change this to alter animation speed
            var interval = setInterval(function () {
                step += 1;
                if (step > numSteps) {
                    clearInterval(interval);
                    callback(idx);
                } else {
                    var are_we_there_yet = google.maps.geometry.spherical.interpolate(c1, c2, step / numSteps);
                    geodesicPoly.setPath([c1, are_we_there_yet]);
                }
            }, timePerStep);
        } else {
            callback(idx);
        }

    }

    function makeInfoWindow(p) {
        if (p) {
            if (p.birth.latlng) {

                if (p.gender == "Male") {
                    var bgcolor = 'lightblue'; //rgbToHex(0, 176, 240);
                    var icon = 'images/male' + p.generation + '.png';
                } else {
                    var bgcolor = 'pink'; // rgbToHex(245, 139, 237);
                    var icon = 'images/female' + p.generation + '.png';
                }

                var opts = {
                    map: map,
                    position: p.birth.latlng,
                    icon: {
                        url: icon,
                        origin: new google.maps.Point(0,0),
                        anchor: new google.maps.Point(11.5, 14)
                    }
                }

                var mark = new google.maps.Marker(opts);
                mark.idx = markarray.length;
                if (p.generation > genquery - 1) {
                    var expandButton = "<button class='greenbutton' onclick='this.style.display=\"none\"; " +
                        "markarray[" + mark.idx + "].isExpanded=true; ancestorExpand(\"" + p.id +
                        "\"," + p.generation + "," + p.isPaternal +
                        "); infowindow.close();'>" + 'EXPAND</button>';
                    mark.expand = expandButton;
                    mark.isExpanded = false;
                } else {
                    mark.isExpanded = true;
                    mark.expand = "";
                }

                var contents1 = "<div id='infow' style='background-color:" + bgcolor + "'>" +
                    p.name + '<br/>' +
                    p.birth.place + '<br/>' +
                    p.birth.date + '<br/>';
                var contents2 = "<button class='bluebutton' style=\"width:100px\" onclick='populateIdField(\"" +
                    p.id + "\")'>" + p.id + '</button>' +
                    '</div>';

                mark.content1 = contents1;
                mark.content2 = contents2;

                oms.addListener('click', function (mark, event) {
                    if (mark.isExpanded) {
                        infowindow.setContent(mark.content1 + mark.content2);
                    } else {
                        infowindow.setContent(mark.content1 + mark.expand + mark.content2);
                    }

                    infowindow.open(map, mark);
                });

                mc.addMarker(mark);

                oms.addListener('spiderfy', function (mark) {
                    infowindow.close();
                });

                oms.addMarker(mark);
                markarray.push(mark);
            }
        }
    }

    function getChildBirthPlace(progenitors, idx) {
        // Call this function if you can't find a person's birthplace
        // It will check if the person has children, and if so, returns the child's birthplace instead

        if (progenitors[idx].gender == "Male") {

            if (progenitors[(idx + 1) / 2 - 1]) { // Check if child exists
                return progenitors[(idx + 1) / 2 - 1].birth.latlng;
            } else {
                return undefined;
            }

        } else { // female
            if (progenitors[idx / 2 - 1]) { // Check if child exists
                return progenitors[idx / 2 - 1].birth.latlng;
            } else {
                return undefined;
            }
        }

    }

    function asyncLoop(iterations, func, callback) {
        var index = 0;
        var done = false;
        var loop = {
            next: function () {
                if (done) {
                    return;
                }

                if (index < iterations) {
                    index++;
                    func(loop);

                } else {
                    done = true;
                    callback();
                }
            },

            prev: function () {
                index--;
            },

            iteration: function () {
                return index - 1;
            },

            breakout: function () {
                done = true;
                callback();
            }
        };
        loop.next();
        return loop;
    }

    function loadingAnimationStart() {
        $(function () {
            $('#loading').show();
        });
        $(function () {
            $('#loading').activity({ segments: 10, width: 3, space: 1, length: 6, color: '#FFFFFF', speed: 1.5 });
        });
    }

    function loadingAnimationEnd() {
        $(function () {
            $('#loading').activity(false);
        });
        $(function () {
            $('#loading').hide();
        });
    }

    function clearOverlays() {
        for (var i = 0; i < markarray.length; i++) {
            markarray[i].setMap(null);
        }

        for (var i = 0; i < polyarray.length; i++) {
            polyarray[i].setMap(null);
        }

        markarray.length = 0;
        polyarray.length = 0;
        firstTime = true;
        nSearches = 0;
        oms.clearMarkers();
        mc.clearMarkers();

    }

    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    function rgbToHex(r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    function populateIdField(id) {
        var personId = document.getElementById("personid");
        personId.value = id;
    }

    function populateUser() {
        if (!userID) {
            personRead("", function (currentUser) {
                populateIdField(currentUser.id);
                userID = currentUser.id;
                var username = document.getElementById("username");
                username.value = currentUser.name;
            });
        } else {
            populateIdField(userID);
        }
    }

    function isEven(num) {
        // Returns true for even numbers and false for odd
        if (num / 2 == Math.round(num / 2)) {
            return true;
        } else {
            return false;
        }
    }

    function log2(num) {
        // Base 2 logarithm of number
        return Math.log(num) / Math.log(2);
    }

    function startEvents() {
        loadingAnimationStart();
        var runButton = document.getElementById('runButton');
        runButton.disabled = true;
        runButton.className = 'disabledbutton';
    }

    function completionEvents() {
        loadingAnimationEnd();
        var runButton = document.getElementById('runButton');
        runButton.disabled = false;
        runButton.className = 'runButton';
    }