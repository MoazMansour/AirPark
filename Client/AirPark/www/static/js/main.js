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
})

function addMenuClickListener(navId){
    $("#"+navId).click(function(){
        $(".nav-page").hide();
        $("#"+navId+"-page").show();
        $(".nav-item").parent().removeClass("uk-active");
        $("#"+navId).parent().addClass("uk-active");
        UIkit.offcanvas($("#offcanvas-nav")).hide();
    });
}
