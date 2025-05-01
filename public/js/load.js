function loadNavigation() {   
    $('#navbarPlaceholder').load('/text/header.html');
    $('#footerPlaceholder').load('/text/footer.html');   
}
loadNavigation();

function navOpenClose() {
    if ($(".header-navigation")) {
        if (document.querySelector(".header-navigation").classList.contains("show")) {
            document.querySelector(".header-navigation").classList.remove("show");
        } else {
            document.querySelector(".header-navigation").classList.add("show");
        }
    }
    
}

function hamburgerMenu() {
    $("#navbarPlaceholder").on("click", ".header .hamburger-container", navOpenClose);
}
hamburgerMenu();