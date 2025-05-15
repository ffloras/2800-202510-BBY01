function navOpenClose() {
    if ($(".header-navigation")) {
        // https://stackoverflow.com/questions/13037637/css-animation-and-display-none
        // Answer #7
        const navObjects = $(".header-navigation-bg, .header-navigation-links, .hamburger");
        // this does not check if each object has the class "show" it returns true if any of the objects has the class "show"
        if (navObjects.hasClass("toggle")) {
            navObjects.removeClass("toggle");
            setTimeout(() => navObjects.addClass('untoggle'), 0.7);
        } else {
            navObjects.removeClass("untoggle");
            setTimeout(() => navObjects.addClass('toggle'), 0.7);
        }
    }
}

function hamburgerMenu() {
    $("#navbarPlaceholder").on("click", ".header .hamburger-container", navOpenClose);
}
hamburgerMenu();