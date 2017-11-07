var isLoggedIn = false;
var loggedInCredentials = "";
var userObject;
var isSigningIn = false;
var currentPage = "";
var searchResultMap;
var baseUrl = "http://localhost:8080";

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

function refreshLoggedIn(){
    if (isLoggedIn){
        $("#login-overlay").hide();
    } else {
        $("#login-overlay").show();
    }
}

function logOut(){
    isLoggedIn = false;
    loggedInCredentials = "";
    refreshLoggedIn();
}

function logIn(username, password){
    isLoggedIn = true;
    loggedInCredentials = btoa(username + ":" + password);
    console.log("Based64 encoded login credentials: "+loggedInCredentials);
    navSet("search-nav");
    refreshLoggedIn();
}

function tryLogin(){
    isSigningIn = true;
    $("#sign-in-button").text("Signing In...");

    var username = $("#login-username").val();
    var password = $("#login-password").val();
    var tempCreds = btoa(username + ":" + password);

    console.log("username = "+username);
    console.log("password = "+password);

    $.ajax({
        url: baseUrl + "/api/user_active",
        dataType: 'json',
        success: function(result){
            userObject = result;
            loginSuccess();
            logIn(username,password);
        },
        error: function(result){
            loginFailure();
        },
        beforeSend: function (xhr){
            //Attach HTTP basic header
            xhr.setRequestHeader('Authorization', "Basic " + tempCreds);
        }
    });
}

function loginSuccess(){
    $("#sign-in-button").text("Sign In");
    isSigningIn = false;

    // Hide login failure UI
    $("#login-username").removeClass("uk-form-danger");
    $("#login-password").removeClass("uk-form-danger");
    $("#login-username").val("");
    $("#login-password").val("");
    $("#login-failure").hide();
}

function loginFailure(){
    $("#sign-in-button").text("Sign In");
    isSigningIn = false;

    //show login failure UI
    $("#login-username").addClass("uk-form-danger");
    $("#login-password").addClass("uk-form-danger");
    $("#login-username").val("");
    $("#login-password").val("");
    $("#login-failure").show().text("Failed to login. Please try again!");
}

$(function(){
    $('form,input,select,textarea').attr("autocomplete", "off");

    //Find geolocation data for usage later
    GMaps.geolocate({
        success: function(position) {
            hasGeoData = true;
            geoLocateLat = position.coords.latitude;
            geoLocateLon = position.coords.longitude;
            console.log("Found geolocation data!");
        }
      });

    $("#home-nav-page").show();
    addMenuClickListener("home-nav");
    addMenuClickListener("search-nav");
    addMenuClickListener("reservation-nav");
    addMenuClickListener("profile-nav");
    addMenuClickListener("host-activate-nav");
    addMenuClickListener("spots-nav");
    addMenuClickListener("rentals-nav");
    addMenuClickListener("settings-nav");
    //addMenuClickListener("sign-out-nav");
    $("#header-nav-home").click(function(){
        navSet("search-nav");
    });

    //Login handler
    $("#sign-out-nav").click(function(){
        UIkit.offcanvas($("#offcanvas-nav")).hide();
        logOut();
    });

    $("#sign-out-settings-button").click(function(){
        UIkit.offcanvas($("#offcanvas-nav")).hide();
        logOut();
    });

    $("#sign-in-button").click(function(e){
        e.preventDefault();
        if (isSigningIn == false){
            tryLogin();
        }
    });

    $("#sign-up-button").click(function(e){
        e.preventDefault();
        //Try to sign up using the entered information
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

    //DEBUG
    logIn("test","test");
})

function addMenuClickListener(navId){
    $("#"+navId).click(function(){
        navSet(navId);
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
