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
var isSearching = false;
var isUpdatingProfile = false;

$(function() {
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

  navSet("search-nav");

  //addMenuClickListener("sign-out-nav");
  $("#header-nav-home").click(function() {
    navSet("search-nav");
  });

  $('#search-tabs').click(function() {
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
  $("#add-spot").click(function() {
    locationSelectionModal("Add a Parking Spot", function(data) {

       UIkit.modal.prompt('Name this Spot:', 'Spot Name').then(function (name) {
          $.ajax({
            url: baseUrl + "/api/spot",
            type: "POST",
            data: {
              latitude: data.latitude,
              longitude: data.longitude,
              capacity: 1,
              name: name
            },
            dataType: 'json',
            success: function(result) {
              UIkit.modal.alert(result.message);
              displaySpots();
            },
            error: function(result) {
              UIkit.modal.alert(result.message);
              displaySpots();
            },
            beforeSend: function(xhr) {
              //Attach HTTP basic header
              xhr.setRequestHeader('Authorization', "Basic " + loggedInCredentials);
            }
          });
      });
    }, function() {});
  });

})




function addMenuClickListener(navId) {
  $("#" + navId).click(function() {
    navSet(navId);
  });
}

function addMenuClickListeners() {

  addMenuClickListener("home-nav");
  addMenuClickListener("search-nav");
  addMenuClickListener("reservation-nav");
  addMenuClickListener("profile-nav");
  addMenuClickListener("host-activate-nav");
  addMenuClickListener("spots-nav");
  addMenuClickListener("rentals-nav");
  addMenuClickListener("settings-nav");
  //Login handler
  $("#sign-out-nav").click(function() {
    UIkit.offcanvas($("#offcanvas-nav")).hide();
    logOut();
  });
}

function generateSearchPage() {
  $("#search-result-map").removeAttr("style");
  searchResultMap = new GMaps({
    div: '#search-result-map',
    lat: userObject.latitude,
    lng: userObject.longitude
  });
  //Add home marker
  mapAddHomeMarker();
  $("#loc-map-search-button").off().click(function() {
    if (!isSearching) {
      $("#loc-map-search-button").text("Searching...");
      console.log("search");
      displaySearchResults();
      isSearching = true;
    }
  });
}

function generateSettingsPage() {
  var htmlString = "<h3>Account Settings</h3>";
  htmlString += "<button id=\"set-home-button\" class=\"uk-button uk-button-default uk-width-1-1\">Set Default Location</button>";
  htmlString += "<button id=\"sign-out-settings-button\" class=\"uk-button uk-button-default uk-width-1-1 uk-margin\">Sign Out</button>"
  $("#settings-nav-page").html(htmlString);

  //If host mode, show remove host button
  if (userObject.host) {
    $("#settings-nav-page").append("<button id=\"remove-host-button\" class=\"uk-button uk-button-default uk-width-1-1\">Leave Host Mode</button>");
    $("#remove-host-button").click(function(e) {
      e.preventDefault();
      $("#remove-host-button").text("Leaving...");
      $.ajax({
        url: baseUrl + "/api/user_host",
        type: "POST",
        data: {
          host: false
        },
        dataType: 'json',
        success: function(result) {
          refreshUserObject(function() {
            UIkit.modal.alert("Unenrolled as a Host. Thanks for being a host on AirPark!");
            $("#remove-host-button").remove();
            refreshUserObject(function() {
              generateSidebar();
            });
          });
        },
        error: function(result) {
          UIkit.modal.alert("Error: Could not unenroll as a Host! Please try again later.");
        },
        beforeSend: function(xhr) {
          //Attach HTTP basic header
          xhr.setRequestHeader('Authorization', "Basic " + loggedInCredentials);
        }
      });
    });
  }

  $("#set-home-button").click(function(e) {
    e.preventDefault();
    locationSelectionModal("Select Work Location", function(data) {
      console.log(data);
      $.ajax({
        url: baseUrl + "/api/user/" + userObject.userId + "/location",
        type: "PATCH",
        dataType: 'json',
        data: {
          latitude: data.latitude,
          longitude: data.longitude
        },
        success: function(result) {
          userObject.latitude = data.latitude;
          userObject.longitude = data.longitude;
          UIkit.modal.alert(result.message);
        },
        error: function(result) {
          UIkit.modal.alert(result.message);
        },
        beforeSend: function(xhr) {
          //Attach HTTP basic header
          xhr.setRequestHeader('Authorization', "Basic " + loggedInCredentials);
        }
      });
    }, function() {});
  });

  $("#sign-out-settings-button").click(function() {
    UIkit.offcanvas($("#offcanvas-nav")).hide();
    logOut();
  });
}

function generateReservationsPage() {
    $("#active-reservations-container").html("");
    $("#expired-reservations-container").html("");
    $("#active-reservations-header").hide();
    $("#expired-reservations-header").hide();
    $("#reservation-nav-page").addClass("loading-icon");

  // display active reservations
  $.ajax({
    url: baseUrl + "/api/reservations",
    type: "GET",
    data: {
      renter: userObject.userId,
      activeStatus: true
    },
    dataType: 'json',
    success: function(result) {
        $("#active-reservations-header").show();
      var j = 0;
      for (var i = 0; i < result.length; i++) {
        getReservationInfo(result[i].reservationId, function(reservationInfo) {
                addReservationCard(false, reservationInfo);
        });
      }
    },
    error: function(result) {
      UIkit.modal.alert("Couldn't display your reservations. Please try again later!");
    },
    beforeSend: function(xhr) {
      //Attach HTTP basic header
      xhr.setRequestHeader('Authorization', "Basic " + loggedInCredentials);
    }
  });

    // Display expired reservations
    $.ajax({
      url: baseUrl + "/api/reservations",
      type: "GET",
      data: {
        renter: userObject.userId,
        activeStatus: false
      },
      dataType: 'json',
      success: function(result) {
      $("#expired-reservations-header").show();
        var j = 0;
        for (var i = 0; i < result.length; i++) {
          getReservationInfo(result[i].reservationId, function(reservationInfo) {
              addReservationCard(true, reservationInfo);
          });
        }
      },
      error: function(result) {
        UIkit.modal.alert("Couldn't display your reservations. Please try again later!");
      },
      beforeSend: function(xhr) {
        //Attach HTTP basic header
        xhr.setRequestHeader('Authorization', "Basic " + loggedInCredentials);
      }
    });

    setTimeout(function(){

        $("#reservation-nav-page").removeClass("loading-icon");
    },1000);
}

function addReservationCard(isExpired, reservationInfo){
    if (!isExpired){
        var confirmationStatus;
        var htmlButtons = ``;
        if(reservationInfo.reservation.confirmed == false) {
          confirmationStatus = "Pending";
          htmlButtons = `
          <button class="uk-button uk-width-1-1 uk-button-secondary">Cancel</button>
          `;
        } else {
          confirmationStatus = "Confirmed";
          htmlButtons = `
          <button class="uk-button uk-width-1-1 uk-button-primary">Check In</button>
          <button class="uk-button uk-width-1-1 uk-button-secondary">Cancel Reservation</button>
          `;
        }
        var date = new Date(reservationInfo.reservation.expirationTime * 1000);
        var htmlStr = `
          <div class="uk-card uk-card-default uk-margin">
            <div class="uk-card-header">
                <div class="uk-grid-small uk-flex-middle" uk-grid>
                    <div class="uk-width-auto uk-margin-remove-left">
                        <img class="uk-border-circle" width="40" height="40" src="/static/img/tickets.png">
                    </div>
                    <div class="uk-width-expand">
                        <h3 class="uk-card-title uk-margin-remove-bottom">`+confirmationStatus+`</h3>
                    </div>
                </div>
            </div>
            <div class="uk-card-body">
            <dl class="uk-description-list">
                <dt>Address</dt>
                <dd>` + reservationInfo.address + `</dd>
                <dt>Expires</dt>
                <dd>` + date + `</dd>
                <dt>Host</dt>
                <dd>` + reservationInfo.owner.name + `</dd>
            </dl>
          </div>
          <div class="uk-card-footer">`
          +htmlButtons+`
          </div>
          </div>
          `;
        $("#active-reservations-container").append(htmlStr);
    } else {
        var date = new Date(reservationInfo.reservation.expirationTime * 1000);
        var htmlStr = `
          <div class="uk-card uk-card-small uk-card-default uk-card-body uk-margin">
              <div class="uk-card-body">
              <dl class="uk-description-list">
                  <dt>Address</dt>
                  <dd>` + reservationInfo.address + `</dd>
                  <dt>Expired</dt>
                  <dd>` + date + `</dd>
                  <dt>Host</dt>
                  <dd>` + reservationInfo.owner.name + `</dd>
              </dl>
            </div>
          </div>`;
        $("#expired-reservations-container").append(htmlStr);
    }
}

function generateRentalsPage() {
  $("#active-rentals-container").html("");
  $("#expired-rentals-container").html("");

  // get active rentals
  $.ajax({
    url: baseUrl + "/api/reservations",
    type: "GET",
    data: {
      owner: userObject.userId,
      activeStatus: true
    },
    dataType: 'json',
    success: function(result) {
      for (var i = 0; i < result.length; i++) {
        getReservationInfo(result[i].reservationId, function(reservationInfo) {
          var date = new Date(reservationInfo.reservation.expirationTime * 1000);
          var confirmationStatus;
          if(reservationInfo.reservation.confirmed == false) {
            confirmationStatus = "Pending Confirmation";
          } else {
            confirmationStatus = "Confirmed";
          }

          var htmlStr = `
            Address: ` + reservationInfo.address + `<br>
            Expires: ` + date + `<br>
            Renter: ` + reservationInfo.renter.name + `<br>
            Status: ` + confirmationStatus + `<br>`;
          $("#active-rentals-container").append(htmlStr);
        });
      }
    },
    error: function(result) {
      UIkit.modal.alert(result.message);
    },
    beforeSend: function(xhr) {
      //Attach HTTP basic header
      xhr.setRequestHeader('Authorization', "Basic " + loggedInCredentials);
    }
  });

  // get expired rentals
  $.ajax({
    url: baseUrl + "/api/reservations",
    type: "GET",
    data: {
      owner: userObject.userId,
      activeStatus: false
    },
    dataType: 'json',
    success: function(result) {
      for (var i = 0; i < result.length; i++) {
        getReservationInfo(result[i].reservationId, function(reservationInfo) {
          var date = new Date(reservationInfo.reservation.expirationTime * 1000);
          var htmlStr = `
            Address: ` + reservationInfo.address + `<br>` +
            `Expires: ` + date + `<br>` +
            `Renter: ` + reservationInfo.renter.name + `<br>`;
          $("#expired-rentals-container").append(htmlStr);
        });
      }
    },
    error: function(result) {
      UIkit.modal.alert(result.message);
    },
    beforeSend: function(xhr) {
      //Attach HTTP basic header
      xhr.setRequestHeader('Authorization', "Basic " + loggedInCredentials);
    }
  });
}

function generateJoinHostPage() {
  var htmlString = "";
  htmlString += "<h3>Become a Host</h3>";
  htmlString += "<p>Become a host on AirPark to share your driveway with others.";
  htmlString += "AirPark benefits the local community, relieving traffic and ";
  htmlString += "earning you passive income!</p>";
  htmlString += "<button id=\"join-host\" class=\"uk-button uk-button-default uk-width-1-1 uk-margin\">Join as Host</button>";
  htmlString += "<br><a><i>Terms & Conditions</i></a>";
  $("#host-activate-text").html(htmlString);
  $("#join-host").click(function(e) {
    e.preventDefault();
    if (!hostJoining) {
      hostJoining = true;
      $("#join-host").text("Joining...");
      $.ajax({
        url: baseUrl + "/api/user_host",
        type: "POST",
        data: {
          host: true
        },
        dataType: 'json',
        success: function(result) {
          refreshUserObject(function() {
            $("#host-activate-text").html("<h3>Welcome!</h3><p>Welcome to Hosting on AirPark. Let's get started by adding some parking spots. Open the menu to the left and navigate to <i>My Spots</i> to begin.")
            generateSidebar();
            hostJoining = false;
          });
        },
        error: function(result) {
          UIkit.modal.alert("Error: Could not join as a Host! Please try again later.");
          hostJoining = false;
        },
        beforeSend: function(xhr) {
          //Attach HTTP basic header
          xhr.setRequestHeader('Authorization', "Basic " + loggedInCredentials);
        }
      });
    }
  });
}

function generateProfileViewPage() {

  var htmlString = `
        <button id="edit-profile" class="uk-button uk-button-default uk-margin-small uk-width-1-1">Edit Profile</button>
        <div class="uk-card uk-card-default uk-width-1-1">
        <div class="uk-card-header">
            <div class="uk-grid-small uk-flex-middle" uk-grid>
                <div class="uk-width-auto">
                    <img class="uk-border-circle" width="50" height="50" src="/static/img/profile_img.png">
                </div>
                <div class="uk-width-expand">
                    <h3 class="uk-card-title uk-margin-remove-bottom">` + userObject.username + `</h3>
                    <p id="profile-location" class="uk-text-meta uk-margin-remove-top">Commuter` + (userObject.host ? ", Host" : "") + `</p>
                </div>
            </div>
        </div>
        <div class="uk-card-body">
            <dl class="uk-description-list">
                <dt>Name</dt>
                <dd>` + userObject.name + `</dd>
                <dt>Phone Number</dt>
                <dd>` + userObject.phoneNumber + `</dd>
                <dt>Rating</dt>
                <dd>
                    <span class="star" uk-icon="icon: star"></span>
                    <span class="star" uk-icon="icon: star"></span>
                    <span class="star" uk-icon="icon: star"></span>
                    <span class="star" uk-icon="icon: star"></span>
                    <span class="star" uk-icon="icon: star"></span><br>
                    <i id="profile-star-desc" class="uk-text-meta">To earn a higher rating, use AirPark to reserve a spot! Hosts
                    and Commuters rate each other after each rental.</i>
                </dd>
            </dl>
        </div>
    </div>
    `;
  $("#profile-nav-page").html(htmlString);
  $("#edit-profile").click(function(e) {
    generateProfileEditPage();
    e.preventDefault();
  });

}

function generateProfileEditPage() {
  var htmlString = `
    <div class="uk-grid-small uk-child-width-expand uk-margin-small" uk-grid>
        <div class="uk-width-1-2">
            <button id="edit-profile-save" class="uk-button uk-button-default uk-width-1-1">Save</button>
        </div>
        <div class="uk-width-1-2">
            <button id="edit-profile-cancel" class="uk-button uk-button-default uk-width-1-1">Cancel</button>
        </div>
    </div>
    <div class="uk-card uk-card-default uk-width-1-1">
        <div class="uk-card-header">
            <div class="uk-grid-small uk-flex-middle" uk-grid>
                <div class="uk-width-auto">
                    <img class="uk-border-circle" width="50" height="50" src="/static/img/profile_img.png">
                </div>
                <div class="uk-width-expand">
                    <h3 class="uk-card-title uk-margin-remove-bottom">` + userObject.username + `</h3>
                    <p id="profile-location" class="uk-text-meta uk-margin-remove-top">` + "Rochester, NY" + `</p>
                </div>
            </div>
        </div>
        <form>
            <div class="uk-card-body">
                <dl class="uk-description-list">
                    <dt>Name</dt>
                    <dd>
                    <div class="uk-margin uk-dark-fix">
                        <input id="profile-name" class="uk-input" type="text" placeholder="Name">
                    </div>
                    </dd>
                    <dt>Phone Number</dt>
                    <dd>
                    <div class="uk-margin uk-dark-fix">
                        <input id="profile-phone-number" class="uk-input" type="text" placeholder="Phone #">
                    </div>
                    </dd>
                </dl>
            </div>
        </form>
    </div>
    `;
  $("#profile-nav-page").html(htmlString);
  $("#profile-name").val(userObject.name);
  $("#profile-phone-number").val(userObject.phoneNumber);

  $("#edit-profile-save").click(function(e) {
    e.preventDefault();

    if (!isUpdatingProfile) {
      isUpdatingProfile = true;
      $("#edit-profile-save").text("Saving...")
      // Get the changes, save them to the user object via server call.
      $.ajax({
        url: baseUrl + "/api/user/" + userObject.userId,
        type: "PATCH",
        data: {
          name: $("#profile-name").val(),
          phone_number: $("#profile-phone-number").val()
        },
        dataType: 'json',
        success: function(result) {
          //Success
          refreshUserObject(function(result) {
            UIkit.modal.alert("Updated user profile!");
            generateProfileViewPage();
            isUpdatingProfile = false;
          });
        },
        error: function(result) {
          // Failure
          UIkit.modal.alert("Could not update user profile! Please try again later.");
          generateProfileViewPage();
          isUpdatingProfile = false;
        },
        beforeSend: function(xhr) {
          //Attach HTTP basic header
          xhr.setRequestHeader('Authorization', "Basic " + loggedInCredentials);
        }
      });


    }
  })
  $("#edit-profile-cancel").click(function(e) {
    e.preventDefault();
    generateProfileViewPage();
  })

}


function navSet(navId) {
  currentPage = navId;
  $(".nav-page").hide();
  $("#" + navId + "-page").show();
  $(".nav-item").parent().removeClass("uk-active");
  $("#" + navId).parent().addClass("uk-active");
  UIkit.offcanvas($("#offcanvas-nav")).hide();

  //Do specific behavior based on the nav id
  switch (navId) {
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
      generateSearchPage();
      displaySearchResults();
      break;
    case "host-activate-nav":
      generateJoinHostPage();
      break;
    case "profile-nav":
      generateProfileViewPage();
      break;
    case "settings-nav":
      generateSettingsPage();
      break;
    case "reservation-nav":
      generateReservationsPage();
      break;
    case "rentals-nav":
      generateRentalsPage();
      break;
  }
}

function displaySearchResults(){
    var searchData = {
        latitude: userObject.latitude,
        longitude: userObject.longitude,
        walkingDuration: searchRangeValue
    };
    //$("#search-range").val()
    $.ajax({
        url: baseUrl + "/api/spots",
        type: "GET",
        dataType: 'json',
        data: searchData,
        success: function(result){
            console.log("Search succeeded");
            searchResultMap.removeMarkers(); //remove all markers
            searchResultMap.removeOverlays(); // remove all overlays
            //Clear list
            //$("#search-spot-container").html("");
            for (var i = 0; i < result.length; i++){
                //Add the spot to the map
                addSpotToMap(result[i].spot);
            }
            mapAddHomeMarker();
        $("#loc-map-search-button").text("Search");
        isSearching = false;
        },
        error: function(result) {
          //UIkit.modal.alert(result.message);
          console.log("Search failed");
          $("#loc-map-search-button").text("Search");
          isSearching = false;
        },
        beforeSend: function(xhr) {
          //Attach HTTP basic header
          xhr.setRequestHeader('Authorization', "Basic " + loggedInCredentials);
        }
    });
}

function addSpotToMap(spot){
    console.log(spot);
    searchResultMap.addMarker({
        lat: spot.latitude,
        lng: spot.longitude,
        title: spot.spotName,
        icon  : '/static/img/red.png'
    });

    searchResultMap.drawOverlay({
        lat: spot.latitude,
        lng: spot.longitude,
        verticalAlign: "bottom",
        click: function(){
            showSpotDetails(spot);
        },
      content: '<div class="map-overlay map-overlay-location" id="map-overlay-'+spot.spotId+'">'+"$"+spot.pricePerHour+"/hr"+'</div>'
    });
}

//Load the spots from the REST api
function displaySpots() {
  $.ajax({
    url: baseUrl + "/api/spots",
    data: {
      user: -1
    },
    dataType: 'json',
    success: function(result) {
      console.log(result);
      $("#host-spot-container").html("");
      for (var i = 0; i < result.length; i++) {
        var staticImgLink = GMaps.staticMapURL({
          size: [100, 100],
          lat: result[i].latitude,
          lng: result[i].longitude,
          markers: [{
            lat: result[i].latitude,
            lng: result[i].longitude,
            size: 'small'
          }]
        });

        var newSpotListElement = `
                <div class="spot-card uk-card uk-card-small uk-card-default uk-card-body uk-width-1-1 uk-margin">
                    <h3 class="uk-card-title">` + result[i].spotName + `</h3>
                    <div class="spot-card-action-pane">
                    <!--<span class="spot-action-edit-` + i + `" uk-icon="icon: pencil; ratio: 1.5"></span>-->
                    <span class="spot-action-delete-` + i + `" spot-id="` + result[i].spotId + `" uk-icon="icon: trash; ratio: 1.5"></span>
                    </div>
                    <p>
                    <!--Location: ` + result[i].latitude + ', ' + result[i].longitude + `<br>-->
                    Capacity: ` + result[i].capacity + `<br>
                    </p>
                    <img class="spot-display-image" src=` + staticImgLink + `/>
                </div>`;

        $("#host-spot-container").append($(newSpotListElement));

        $(".spot-action-delete-" + i).click(function() {
          var spotForIndex = Object.freeze($(this).attr("spot-id"));
          UIkit.modal.confirm('Are you sure you want to delete this location?').then(function() {
            console.log('Confirmed location delete.');
            $.ajax({
              url: baseUrl + "/api/spot/" + spotForIndex,
              type: "DELETE",
              dataType: 'json',
              success: function(result) {
                displaySpots();
              },
              error: function(result) {
                UIkit.modal.alert(result.message);
              },
              beforeSend: function(xhr) {
                //Attach HTTP basic header
                xhr.setRequestHeader('Authorization', "Basic " + loggedInCredentials);
              }
            });
          }, function() {});
        });
      }
    },
    beforeSend: function(xhr) {
      //Attach HTTP basic header
      xhr.setRequestHeader('Authorization', "Basic " + loggedInCredentials);
    }
  });
}

function mapAddHomeMarker(){
    //Add home marker
    searchResultMap.addMarker({
        lat: userObject.latitude,
        lng: userObject.longitude,
        title: "Your Home",
        icon  : '/static/img/blue.png'
    });
    searchResultMap.drawOverlay({
        lat: userObject.latitude,
        lng: userObject.longitude,
        verticalAlign: "bottom",
      content: '<div class="map-overlay">Home</div>'
    });
}

// A function that will select a location and either pass it into the confirm function, or cancel.
function locationSelectionModal(description, confirm, cancel) {
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

      if (locSelectHasChosen == false) {
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

  $("#loc-select-confirm").off().click(function() {
    if (locSelectHasChosen == false) {
      UIkit.modal.alert("Please click on the map to place a location marker!");
    } else {
      navSet(locSelectLastPage);
      confirm({
        latitude: locSelectLatitude,
        longitude: locSelectLongitude
      });
    }
  });
  $("#loc-select-cancel").off().click(function() {
    navSet(locSelectLastPage);
    cancel();
  });
}

function getSpotBySpotId(spotId, success_callback) {
  $.ajax({
    url: baseUrl + "/api/spot/" + spotId,
    type: "GET",
    dataType: 'json',
    success: function(result) {
      success_callback(result);
    },
    error: function(result) {
      UIkit.modal.alert(result.message);
    },
    beforeSend: function(xhr) {
      //Attach HTTP basic header
      xhr.setRequestHeader('Authorization', "Basic " + loggedInCredentials);
    }
  });
}

function getAddressFromLatLong(lat, long, success_callback) {
  $.ajax({
    url: baseUrl + "/api/spot/address",
    type: "GET",
    data: {
      latitude: lat,
      longitude: long
    },
    dataType: 'json',
    success: function(result) {
      success_callback(result);
    },
    error: function(result) {
      UIkit.modal.alert(result.message);
    },
    beforeSend: function(xhr) {
      //Attach HTTP basic header
      xhr.setRequestHeader('Authorization', "Basic " + loggedInCredentials);
    }
  });
}

function showSpotDetails(spot){
    console.log(spot);
    $("#detail-modal").addClass("loading-icon");
    var htmlString = "";
    showDetailModal(htmlString, null, null);

    getAddressFromLatLong(spot.latitude,spot.longitude,function(address){
        $("#detail-modal").removeClass("loading-icon");
        var htmlString = `
            <button id="reserve-spot" class="uk-button uk-button-default uk-margin-small uk-width-1-1">Reserve Spot</button>
            <div class="uk-card uk-card-default uk-width-1-1">
            <div class="uk-card-header">
                <div class="uk-grid-small uk-flex-middle" uk-grid>
                    <div class="uk-width-expand">
                        <h3 class="uk-card-title uk-margin-remove-bottom">`+spot.spotName+`</h3>
                    </div>
                </div>
            </div>
            <div class="uk-card-body">
                <dl class="uk-description-list">
                    <dt>Location</dt>
                    <dd>`+address.formattedAddress+`</dd>
                    <dt>Capacity</dt>
                    <dd>`+spot.capacity+`</dd>
                    <dt>Price (Per Hour)</dt>
                    <dd>$`+spot.pricePerHour+`/hr</dd>
                    <dt>Rating</dt>
                    <dd>
                        <span class="star" uk-icon="icon: star"></span>
                        <span class="star" uk-icon="icon: star"></span>
                        <span class="star" uk-icon="icon: star"></span>
                        <span class="star" uk-icon="icon: star"></span>
                        <span class="star" uk-icon="icon: star"></span>
                    </dd>
                </dl>
            </div>
        </div>
        `;
        showDetailModal(htmlString, null, null);
        $("#reserve-spot").click(function(e){
            showSpotReserve1();
            e.preventDefault();
        });
    });
}

function showSpotReserve1(){
    var htmlString = `

    <h3>Choose Expiration Time</h3>
    <div id="date_picker"> </div>
    <hr>
    `
    showDetailModal(htmlString, null, null, function(){
        showSpotReserve2();
    });

    $(function(){
			$('#date_picker').dtpicker();
		});
}

function showSpotReserve2(){
    var htmlString = `
    <h3>Enter Payment Method</h3>
    <hr>
    <form class="uk-form-stacked uk-grid-small" uk-grid>

        <div class="uk-margin-small uk-width-1-1">
            <div class="uk-form-controls">
                <input class="uk-input" id="form-stacked-text" type="text" placeholder="Name on Card">
            </div>
        </div>

        <div class="uk-margin-small uk-width-1-1">
            <div class="uk-form-controls">
                <input class="uk-input" id="form-stacked-text" type="text" placeholder="Card Number">
            </div>
        </div>

        <div class="uk-margin-small uk-width-1-2">
            <div class="uk-form-controls">
                <input class="uk-input" id="form-stacked-text" type="text" placeholder="Expiration Date">
            </div>
        </div>

        <div class="uk-margin-small uk-width-1-2">
            <div class="uk-form-controls">
                <input class="uk-input" id="form-stacked-text" type="text" placeholder="Expiration Date">
            </div>
        </div>

        <div class="uk-margin-small uk-width-1-1">
            <div class="uk-form-controls">
                <input class="uk-input" id="form-stacked-text" type="text" placeholder="ZIP/Postal Code">
            </div>
        </div>

        <div class="uk-margin-small uk-width-1-1">
            <div class="uk-form-controls">
                <input type="checkbox" value="true">Remember this Payment Method<br>
            </div>
        </div>

    </form>
    `
    showDetailModal(htmlString, null, null, function(){
        UIkit.modal.alert("Spot Reserved! The Host will approve your reservation. View your reservation status and check into the spot using the My Reservations page.");
        hideDetailModal();
        navSet("reservation-nav");
    });

}

function hideDetailModal(){
    $("#detail-modal").slideUp();
}

function showDetailModal(pageHtml, clickHandler, backHandler, nextHandler){
    $("#detail-modal-back").off().click(function(e){
        e.preventDefault();
        $("#detail-modal").slideUp();
        if (backHandler){
            backHandler();
        }
        $("#detail-modal-back").off();
    })
    $("#detail-modal-page").html(pageHtml);
    $("#detail-modal-page").show();
    $("#detail-modal").slideDown();
    if (nextHandler){
        console.log("adding click listener");
        $("#detail-modal-next").off().click(function(e){
            $("#detail-modal-next").off();
            e.preventDefault();
            nextHandler();
        })
        $("#detail-modal-next").show();
    } else {
        $("#detail-modal-next").hide();
    }
}

function getReservationInfo(reservationId, success_callback) {
  $.ajax({
    url: baseUrl + "/api/reservation/info",
    type: "GET",
    data: {
      reservation: reservationId
    },
    dataType: 'json',
    success: function(result) {
      success_callback(result);
    },
    error: function(result) {
      UIkit.modal.alert(result.message);
    },
    beforeSend: function(xhr) {
      //Attach HTTP basic header
      xhr.setRequestHeader('Authorization', "Basic " + loggedInCredentials);
    }
  })
}

function cancelReservation(reservationId, success){
    $.ajax({
      url: baseUrl + "/api/reservation/cancel/"+reservationId,
      type: "GET",
      dataType: 'json',
      success: function(result) {
        //Success
        success();
      },
      error: function(result) {
        // Failure
        UIkit.modal.alert("Could not cancel reservation! Please try again later.");
      },
      beforeSend: function(xhr) {
        //Attach HTTP basic header
        xhr.setRequestHeader('Authorization', "Basic " + loggedInCredentials);
      }
    })
}

function confirmReservation(reservationId, response) {
  $.ajax({
    url: baseUrl + "/api/reservation",
    type: "PATCH",
    data: {
      reservationId: reservationId,
      confirmation: response
    },
    dataType: 'json',
    success: function(result) {
      //Success
      generateRentalsPage();
    },
    error: function(result) {
      // Failure
      UIkit.modal.alert("Could not update reservation confirmation status! Please try again later.");
      generateRentalsPage()
    },
    beforeSend: function(xhr) {
      //Attach HTTP basic header
      xhr.setRequestHeader('Authorization', "Basic " + loggedInCredentials);
    }
  })
}
