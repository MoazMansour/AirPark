var isSigningIn = false;

$(function(){

    // Check if we have an existing login code, and if so, redirect to the main page.
    loggedInCredentials = window.localStorage.getItem("loggedInCredentials");
    if (loggedInCredentials){
        redirect();
    }

    // If we don't have an existing login code, show the login page
    $("#sign-in-page").show();

    // Click listeners for sign in, sign up.
    $("#sign-up-button").click(function(e){
        e.preventDefault();
        $("#sign-in-page").hide();
        $("#sign-up-page").show().slideDown();
    });

    $("#sign-in-button").click(function(e){
        e.preventDefault();
        if (!isSigningIn){
            // Get credentials from form.
            var username = $("#login-username").val();
            var password = $("#login-password").val();
            loggedInCredentials = btoa(username + ":" + password);
            $("#sign-in-button").text("Signing In...");
            tryLogin();
        }
    })

});

function redirect(){
    window.location="index.html";
}

function showSignInPage(){

}

function showSignUpPage(){

}

function tryLogin(){
    if (!isSigningIn){
        $("#sign-in-button").text("Signing In...");
        $.ajax({
            url: baseUrl + "/api/user_active",
            dataType: 'json',
            success: function(result){
                userObject = result;
                // Save credentials and session data to local storage.
                localStorage.setItem("loggedInCredentials", loggedInCredentials);
                localStorage.setItem("userObject", JSON.stringify(userObject));
                //console.log(loggedInCredentials);
                //console.log(userObject);

                loginSuccess();
            },
            error: function(result){
                loginFailure();
            },
            beforeSend: function (xhr){
                //Attach HTTP basic header
                xhr.setRequestHeader('Authorization', "Basic " + loggedInCredentials);
            }
        });
        isSigningIn = true;
    }
}

function loginSuccess(){
    //$("#sign-in-button").text("Sign In");
    //isSigningIn = false;
    //Redirect to index
    redirect()
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
