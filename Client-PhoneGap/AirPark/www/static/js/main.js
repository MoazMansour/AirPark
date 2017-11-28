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
  });

  //Add spot functionality
  $("#add-spot").click(function() {
    locationSelectionModal("Add a Parking Spot", function(data) {
      $.ajax({
        url: baseUrl + "/api/spot",
        type: "POST",
        data: {
          latitude: data.latitude,
          longitude: data.longitude,
          capacity: 1
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
  searchResultMap.addMarker({
    lat: userObject.latitude,
    lng: userObject.longitude,
    title: "Your Home",
    icon: '/static/img/blue.png'
  });
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
      var j = 0;
      for (var i = 0; i < result.length; i++) {
        getReservationInfo(result[i].reservationId, function(reservationInfo) {
          var confirmationStatus;
          if(reservationInfo.reservation.confirmed == false) {
            confirmationStatus = "Pending Confirmation";
          } else {
            confirmationStatus = "Confirmed";
          }
          var date = new Date(reservationInfo.reservation.expirationTime * 1000);
          var htmlStr = `
            Address: ` + reservationInfo.address + `<br>
            Expires: ` + date + `<br>
            Owner: ` + reservationInfo.owner.name + `<br>
            Status: ` + confirmationStatus + `<br>`;
          $("#active-reservations-container").append(htmlStr);
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

  // display expired reservations
  $.ajax({
    url: baseUrl + "/api/reservations",
    type: "GET",
    data: {
      renter: userObject.userId,
      activeStatus: false
    },
    dataType: 'json',
    success: function(result) {
      var j = 0;
      for (var i = 0; i < result.length; i++) {
        getReservationInfo(result[i].reservationId, function(reservationInfo) {
          var date = new Date(reservationInfo.reservation.expirationTime * 1000);
          var htmlStr = `
            Address: ` + reservationInfo.address + `<br>` +
            `Expires: ` + date + `<br>` +
            `Owner: ` + reservationInfo.owner.name + `<br>`;
          $("#expired-reservations-container").append(htmlStr);
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

function displaySearchResults() {
  var searchData = {
    latitude: userObject.latitude,
    longitude: userObject.longitude,
    walkingDuration: 15
  };
  //$("#search-range").val()
  $.ajax({
    url: baseUrl + "/api/spots",
    type: "GET",
    dataType: 'json',
    data: searchData,
    success: function(result) {
      console.log("Search succeeded");
      searchResultMap.removeMarkers(); //remove all markers
      //Clear list
      //$("#search-spot-container").html("");
      //Add home marker
      searchResultMap.addMarker({
        lat: userObject.latitude,
        lng: userObject.longitude,
        title: "Your Home",
        icon: '/static/img/blue.png'
      });
      for (var i = 0; i < result.length; i++) {
        //Add the spot to the map

        searchResultMap.addMarker({
          lat: result[i].spot.latitude,
          lng: result[i].spot.longitude,
          title: "Spot " + result[i].spot.spotId,
          icon: '/static/img/red.png'
        });

        //Add the spot to the list
        /*
                var staticImgLink = GMaps.staticMapURL({
                  size: [100, 100],
                  lat: result[i].spot.latitude,
                  lng: result[i].spot.longitude,
                  markers: [
                    {lat: result[i].spot.latitude, lng: result[i].spot.longitude, size: 'small'}
                  ]
              });*/

        /*
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


        $("#search-spot-container").append($(newSpotListElement));*/
      }
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
                    <h3 class="uk-card-title">Spot ` + result[i].spotId + `</h3>
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

//blocking sleep, use only for debug!
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds) {
      break;
    }
  }
}
