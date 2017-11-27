var loggedInCredentials = null;
var baseUrl = "http://localhost:8080";
var userObject;


function generateSidebar(){
    //Generate sidebar based on user status.
    //Add commuter section
    $("#nav-container").html("");
    $("#nav-container").append("<li class=\"uk-nav-header\">Commuter</li>");
    $("#nav-container").append("<li class=\"uk-active\"><a id=\"search-nav\" class=\"nav-item\"><span class=\"uk-margin-small-right\" uk-icon=\"icon: home\"></span>Home</a></li>");
    $("#nav-container").append("<li><a id=\"reservation-nav\" class=\"nav-item\"><span class=\"uk-margin-small-right\" uk-icon=\"icon: location\"></span>My Reservations</a></li>");
    $("#nav-container").append("<li><a id=\"profile-nav\" class=\"nav-item\"><span class=\"uk-margin-small-right\" uk-icon=\"icon: user\"></span> My Profile</a></li>");

    $("#nav-container").append("<li class=\"uk-nav-header\">Host</li>");
    //Add host section if the user is a host
    if (userObject.host){
        $("#nav-container").append("<li><a id=\"spots-nav\" class=\"nav-item\"><span class=\"uk-margin-small-right\" uk-icon=\"icon: thumbnails\"></span>My Spots</a></li>");
        $("#nav-container").append("<li><a id=\"rentals-nav\" class=\"nav-item\"><span class=\"uk-margin-small-right\" uk-icon=\"icon: users\"></span>My Rentals</a></li>");
    } else {
        $("#nav-container").append("<li><a id=\"host-activate-nav\" class=\"nav-item\"><span class=\"uk-margin-small-right\" uk-icon=\"icon: bolt\"></span> Become a Host...</a></li>");
    }
    $("#nav-container").append("<li class=\"uk-nav-divider\"></li>");

    $("#nav-container").append("<li class=\"uk-nav-header\">Account</li>");
    $("#nav-container").append("<li><a id=\"settings-nav\" class=\"nav-item\"><span class=\"uk-margin-small-right\" uk-icon=\"icon: settings\"></span> Settings</a></li>");
    $("#nav-container").append("<li><a id=\"sign-out-nav\" class=\"nav-item\"><span class=\"uk-margin-small-right\" uk-icon=\"icon: sign-out\"></span> Sign Out</a></li>");

    addMenuClickListeners();
}

function loginGuard(){
    //Grab credentials from local storage.
    loggedInCredentials = window.localStorage.getItem("loggedInCredentials");
    //Grab user object from local storage.
    userObject = window.localStorage.getItem("userObject");
    //Check that both are not null.
    if (userObject && loggedInCredentials){
        //Continue
        try {
            userObject = JSON.parse(userObject);
        } catch (e) {
            //User object was invalid
            logOut();
        }
    } else {
        //Redirect
        window.location="login.html";
    }
}

function refreshUserObject(success){
    $.ajax({
        url: baseUrl + "/api/user_active",
        dataType: 'json',
        success: function(result){
            userObject = result;
            localStorage.setItem("userObject", JSON.stringify(userObject));
            success();
        },
        error: function(result){
            console.log("failed to update user object");
            console.log(result);
        },
        beforeSend: function (xhr){
            //Attach HTTP basic header
            xhr.setRequestHeader('Authorization', "Basic " + loggedInCredentials);
        }
    });
}

function logOut(){
    userObject = null;
    loggedInCredentials = null;
    window.localStorage.clear();
    window.location="login.html";
}

function reloadHome(){
    window.location="index.html";
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
