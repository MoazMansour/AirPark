var isLoggedIn = false;
var loggedInCredentials = "";
var isSigningIn = false;

var searchResultMap;
var baseUrl = "http://localhost:8080";

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

    $("#do-search").click(function(e){
        navSet("search-result-nav");
    })

    //Add spot functionality
    $("#add-spot").click(function(){
    });



    //DEBUG
    //logIn("test","test");
})

function addMenuClickListener(navId){
    $("#"+navId).click(function(){
        navSet(navId);
    });
}

function navSet(navId){
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
    }
}

function displaySearchResults(){
      searchResultMap = new GMaps({
        div: '#search-result-map',
        lat: -12.043333,
        lng: -77.028333
      });
      GMaps.geolocate({
          success: function(position) {
            searchResultMap.setCenter(position.coords.latitude, position.coords.longitude);
          }
        });
}

//Load the spots from the REST api
function displaySpots(){
    $.ajax({
        url: baseUrl + "/api/spots",
        dataType: 'json',
        success: function(result){
            console.log(result);
            $("#host-spot-container").html("");
            for (var i = 0; i < result.length; i++){
                var newSpotListElement = `
                <div class="spot-card uk-card uk-card-small uk-card-default uk-card-body uk-width-1-1 uk-margin">
                    <h3 class="uk-card-title">Location `+result[i].spotId+`</h3>
                    <div class="spot-card-action-pane">
                    <span class="spot-action-edit" uk-icon="icon: pencil; ratio: 1.5"></span>
                    <span class="spot-action-delete" uk-icon="icon: trash; ratio: 1.5"></span>
                    </div>
                    <p>
                    Location: `+result[i].latitude+', '+result[i].longitude+`<br>
                    Capacity: `+result[i].capacity+`<br>
                    </p>
                </div>`;

                $("#host-spot-container").append($(newSpotListElement));
            }
        },
        beforeSend: function (xhr){
            //Attach HTTP basic header
            xhr.setRequestHeader('Authorization', "Basic " + loggedInCredentials);
        }
    });

    /*
    $(".spot-action-delete").click(function(){
        UIkit.modal.confirm('Are you sure you want to delete this location?').then(function() {
            console.log('Confirmed.')
        }, function () {
            console.log('Rejected.')
        });
    });*/

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
