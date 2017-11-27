var userObject;
var currentPage = "";
var searchResultMap;

var locSelectLastPage = "";
var locSelectHasChosen = false;
var locSelectLatitude = 0;
var locSelectLongitude = 0;
var locSelectGmapsObject;

var hasGeoData = false;
var geoLocateLat = 0;
var geoLocateLon = 0;

var locSearchResultList = [];

var searchRangeValue = 15;
var hostJoining = false;

$(function(){
    $('form,input,select,textarea').attr("autocomplete", "off");

    // Login guard: Redirect back to login page if the credentials aren't saved.
    loginGuard();

    // Generate sidebar
    generateSidebar();

    //Find geolocation data for usage later
    GMaps.geolocate({
        success: function(position) {
            hasGeoData = true;
            geoLocateLat = position.coords.latitude;
            geoLocateLon = position.coords.longitude;
            console.log("Found geolocation data!");
        }
      });

    $("#search-nav-page").show();

    //addMenuClickListener("sign-out-nav");
    $("#header-nav-home").click(function(){
        navSet("search-nav");
    });

    $("#sign-in-button").click(function(e){
        e.preventDefault();
        if (isSigningIn == false){
            tryLogin();
        }
    });

    $("#sign-up-button").click(function(e){
        e.preventDefault();

        $("#page-sign-in").hide();
        $("#page-sign-up").show();

        //$( '#page-sign-up' ).removeClass( 'fadeOutRight' ).show().addClass( 'fadeInRight' );
        //$( '#page-sign-in' ).removeClass( 'fadeInRight' ).addClass( 'fadeOutRight' );

        //Try to sign up using the entered information
        /*
        $.ajax({
            url: baseUrl + "/api/user",
            type: "POST",
            data: {
                    username:$("#login-username").val(),
                    password:$("#login-password").val()
            },
            dataType: 'json',
            success: function(result){
                UIkit.modal.alert(result.message);
            },
            error: function(result){
                UIkit.modal.alert(result.message);
            }
        });
        */
    });

    $('#search-tabs').click(function () {
        console.log("Switched tabs.");
        displaySearchResults();
    });
/*
    $("#do-search").click(function(e){
        e.preventDefault();
        displaySearchResults();

        //Update the search map and search results list.

    })
    */

    $("#search-range").on("change", function() {
        searchRangeValue = $("#search-range").val();
        $("#search-range-label").text(searchRangeValue);
        displaySearchResults();
    });

    //Add spot functionality
    $("#add-spot").click(function(){
        locationSelectionModal("Add a Parking Spot",function(data){
            $.ajax({
                url: baseUrl + "/api/spot",
                type: "POST",
                data: {
                        latitude: data.latitude,
                        longitude: data.longitude,
                        capacity: 1
                },
                dataType: 'json',
                success: function(result){
                    UIkit.modal.alert(result.message);
                    displaySpots();
                },
                error: function(result){
                    UIkit.modal.alert(result.message);
                    displaySpots();
                },
                beforeSend: function (xhr){
                    //Attach HTTP basic header
                    xhr.setRequestHeader('Authorization', "Basic " + loggedInCredentials);
                }
            });
        },function(){});
    });

})




function addMenuClickListener(navId){
    $("#"+navId).click(function(){
        navSet(navId);
    });
}

function addMenuClickListeners(){

    addMenuClickListener("home-nav");
    addMenuClickListener("search-nav");
    addMenuClickListener("reservation-nav");
    addMenuClickListener("profile-nav");
    addMenuClickListener("host-activate-nav");
    addMenuClickListener("spots-nav");
    addMenuClickListener("rentals-nav");
    addMenuClickListener("settings-nav");
    //Login handler
    $("#sign-out-nav").click(function(){
        UIkit.offcanvas($("#offcanvas-nav")).hide();
        logOut();
    });
}

function generateSettingsPage(){
    $("#settings-nav-page").html("<h3>Account Settings</h3>");
    $("#settings-nav-page").append("<button id=\"set-home-button\" class=\"uk-button uk-button-default uk-width-1-1\">Set Default Location</button>");
    $("#settings-nav-page").append("<button id=\"sign-out-settings-button\" class=\"uk-button uk-button-default uk-width-1-1 uk-margin\">Sign Out</button>");

    //If host mode, show remove host button
    if (userObject.host){
        $("#settings-nav-page").append("<button id=\"remove-host-button\" class=\"uk-button uk-button-default uk-width-1-1\">Leave Host Mode</button>");
        $("#remove-host-button").click(function(e){
            e.preventDefault();
            $("#remove-host-button").text("Leaving...");
            $.ajax({
                url: baseUrl + "/api/user_host",
                type: "POST",
                data: {
                    host: false
                },
                dataType: 'json',
                success: function(result){
                    refreshUserObject(function(){
                        UIkit.modal.alert("Unenrolled as a Host. Thanks for being a host on AirPark!");
                        $("#remove-host-button").remove();
                        refreshUserObject(function(){
                            generateSidebar();
                        });
                    });
                },
                error: function(result){
                    UIkit.modal.alert("Error: Could not unenroll as a Host! Please try again later.");
                },
                beforeSend: function (xhr){
                    //Attach HTTP basic header
                    xhr.setRequestHeader('Authorization', "Basic " + loggedInCredentials);
                }
            });
        });
    }

    $("#set-home-button").click(function(e){
        e.preventDefault();
        locationSelectionModal("Select Work Location",function(data){
            console.log(data);
            $.ajax({
                url: baseUrl + "/api/user/"+userObject.userId+"/location",
                type: "PATCH",
                dataType: 'json',
                data: {
                    latitude: data.latitude,
                    longitude: data.longitude
                },
                success: function(result){
                    userObject.latitude = data.latitude;
                    userObject.longitude = data.longitude;
                    UIkit.modal.alert(result.message);
                },
                error: function(result){
                    UIkit.modal.alert(result.message);
                },
                beforeSend: function (xhr){
                    //Attach HTTP basic header
                    xhr.setRequestHeader('Authorization', "Basic " + loggedInCredentials);
                }
            });
        },function(){});
    });

    $("#sign-out-settings-button").click(function(){
        UIkit.offcanvas($("#offcanvas-nav")).hide();
        logOut();
    });
}

function generateJoinHostPage(){
    $("#host-activate-text").html("");
    $("#host-activate-text").append("<h3>Become a Host</h3>");
    $("#host-activate-text").append("<p>Become a host on AirPark to share your driveway with others.");
    $("#host-activate-text").append("AirPark benefits the local community, relieving traffic and");
    $("#host-activate-text").append("earning you passive income!</p>");
    $("#host-activate-text").append("<button id=\"join-host\" class=\"uk-button uk-button-default uk-width-1-1 uk-margin\">Join as Host</button>");
    $("#host-activate-text").append("<br><a><i>Terms & Conditions</i></a>");
    $("#join-host").click(function(e){
        e.preventDefault();
        if (!hostJoining){
            hostJoining = true;
            $("#join-host").text("Joining...");
            $.ajax({
                url: baseUrl + "/api/user_host",
                type: "POST",
                data: {
                    host: true
                },
                dataType: 'json',
                success: function(result){
                    refreshUserObject(function(){
                        $("#host-activate-text").html("<h3>Welcome!</h3><p>Welcome to Hosting on AirPark. Let's get started by adding some parking spots. Open the menu to the left and navigate to <i>My Spots</i> to begin.")
                        generateSidebar();
                        hostJoining = false;
                    });
                },
                error: function(result){
                    UIkit.modal.alert("Error: Could not join as a Host! Please try again later.");
                    hostJoining = false;
                },
                beforeSend: function (xhr){
                    //Attach HTTP basic header
                    xhr.setRequestHeader('Authorization', "Basic " + loggedInCredentials);
                }
            });
        }
    });
}

function navSet(navId){
    currentPage = navId;
    $(".nav-page").hide();
    $("#"+navId+"-page").show();
    $(".nav-item").parent().removeClass("uk-active");
    $("#"+navId).parent().addClass("uk-active");
    UIkit.offcanvas($("#offcanvas-nav")).hide();

    //Do specific behavior based on the nav id
    switch (navId){
        case "spots-nav":
            displaySpots();
            break;
        case "loc-select-nav":
            //Reset some of the variable states
            locSelectHasChosen = false;
            locSelectLatitude = 0;
            locSelectLongitude = 0;
            break;
        case "search-nav":
            displaySearchResults();
            break;
        case "host-activate-nav":
            generateJoinHostPage();
            break;
        case "settings-nav":
            generateSettingsPage();

            break;
    }
}

function displaySearchResults(){
    $("#search-result-map").removeAttr("style");
    searchResultMap = new GMaps({
        div: '#search-result-map',
        lat: userObject.latitude,
        lng: userObject.longitude
    });

    var searchData = {
        latitude: userObject.latitude,
        longitude: userObject.longitude,
        walkingDuration: $("#search-range").val()
    };

    $.ajax({
        url: baseUrl + "/api/spots",
        type: "GET",
        dataType: 'json',
        data: searchData,
        success: function(result){
            //Clear list
            $("#search-spot-container").html("");
            //Add home marker
            searchResultMap.addMarker({
                lat: userObject.latitude,
                lng: userObject.longitude,
                title: "Your Work",
                icon  : '/static/img/blue.png'
            });
            for (var i = 0; i < result.length; i++){
                //Add the spot to the map
                searchResultMap.addMarker({
                    lat: result[i].spot.latitude,
                    lng: result[i].spot.longitude,
                    title: "Spot "+result[i].spot.spotId,
                    icon  : '/static/img/red.png'
                });

                //Add the spot to the list
                var staticImgLink = GMaps.staticMapURL({
                  size: [100, 100],
                  lat: result[i].spot.latitude,
                  lng: result[i].spot.longitude,
                  markers: [
                    {lat: result[i].spot.latitude, lng: result[i].spot.longitude, size: 'small'}
                  ]
                });

                var newSpotListElement = `
                <div class="spot-card uk-card uk-card-small uk-card-default uk-card-body uk-width-1-1 uk-margin">
                    <div class="uk-card-badge uk-label uk-light">`+Math.round(result[i].duration)+` MINS</div>
                    <h3 class="uk-card-title">Spot `+result[i].spot.spotId+`</h3>
                    <div class="spot-card-action-pane">
                    </div>
                    <p>
                    <!--Location: `+result[i].spot.latitude+', '+result[i].spot.longitude+`<br>-->
                    Capacity: `+result[i].spot.capacity+`<br>
                    </p>
                    <img class="spot-display-image" src=`+staticImgLink+`/>
                </div>`;

                $("#search-spot-container").append($(newSpotListElement));
            }
        },
        error: function(result){
            UIkit.modal.alert(result.message);
        },
        beforeSend: function (xhr){
            //Attach HTTP basic header
            xhr.setRequestHeader('Authorization', "Basic " + loggedInCredentials);
        }
    });
}

//Load the spots from the REST api
function displaySpots(){
    $.ajax({
        url: baseUrl + "/api/spots",
        data: {
            user: -1
        },
        dataType: 'json',
        success: function(result){
            console.log(result);
            $("#host-spot-container").html("");
            for (var i = 0; i < result.length; i++){
                var staticImgLink = GMaps.staticMapURL({
                  size: [100, 100],
                  lat: result[i].latitude,
                  lng: result[i].longitude,
                  markers: [
                    {lat: result[i].latitude, lng: result[i].longitude, size: 'small'}
                  ]
                });

                var newSpotListElement = `
                <div class="spot-card uk-card uk-card-small uk-card-default uk-card-body uk-width-1-1 uk-margin">
                    <h3 class="uk-card-title">Spot `+result[i].spotId+`</h3>
                    <div class="spot-card-action-pane">
                    <!--<span class="spot-action-edit-`+i+`" uk-icon="icon: pencil; ratio: 1.5"></span>-->
                    <span class="spot-action-delete-`+i+`" spot-id="`+result[i].spotId+`" uk-icon="icon: trash; ratio: 1.5"></span>
                    </div>
                    <p>
                    <!--Location: `+result[i].latitude+', '+result[i].longitude+`<br>-->
                    Capacity: `+result[i].capacity+`<br>
                    </p>
                    <img class="spot-display-image" src=`+staticImgLink+`/>
                </div>`;

                $("#host-spot-container").append($(newSpotListElement));

                $(".spot-action-delete-"+i).click(function(){
                    var spotForIndex = Object.freeze($(this).attr("spot-id"));
                    UIkit.modal.confirm('Are you sure you want to delete this location?').then(function() {
                        console.log('Confirmed location delete.');
                        $.ajax({
                            url: baseUrl + "/api/spot/"+spotForIndex,
                            type: "DELETE",
                            dataType: 'json',
                            success: function(result){
                                displaySpots();
                            },
                            error: function(result){
                                UIkit.modal.alert(result.message);
                            },
                            beforeSend: function (xhr){
                                //Attach HTTP basic header
                                xhr.setRequestHeader('Authorization', "Basic " + loggedInCredentials);
                            }
                        });
                    }, function () {
                    });
                });
            }
        },
        beforeSend: function (xhr){
            //Attach HTTP basic header
            xhr.setRequestHeader('Authorization', "Basic " + loggedInCredentials);
        }
    });
}

// A function that will select a location and either pass it into the confirm function, or cancel.
function locationSelectionModal(description, confirm, cancel){
    locSelectLastPage = currentPage;
    navSet("loc-select-nav");
    $("#loc-select-header").text(description);

    locSelectGmapsObject = new GMaps({
        div: '#loc-select-map',
        lat: geoLocateLat,
        lng: geoLocateLon,
        click: function(e) {
            console.log(e);
            locSelectLatitude = e.latLng.lat();
            locSelectLongitude = e.latLng.lng();

            if (locSelectHasChosen == false){
                locSelectGmapsObject.addMarker({
                  lat: locSelectLatitude,
                  lng: locSelectLongitude,
                  title: 'Location'
                });
            } else {
                locSelectGmapsObject.markers[0].setPosition(new google.maps.LatLng(locSelectLatitude, locSelectLongitude));
            }

            locSelectHasChosen = true;

        },
      });

    $("#loc-select-confirm").off().click(function(){
        if (locSelectHasChosen == false){
            UIkit.modal.alert("Please click on the map to place a location marker!");
        } else {
            navSet(locSelectLastPage);
            confirm({
                latitude: locSelectLatitude,
                longitude: locSelectLongitude
            });
        }
    });
    $("#loc-select-cancel").off().click(function(){
        navSet(locSelectLastPage);
        cancel();
    });
}



//blocking sleep, use only for debug!
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}
