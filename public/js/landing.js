document.addEventListener("DOMContentLoaded", () => {
    const searchBtn = document.getElementById("searchBtn");
    const loginBtn = document.getElementById("loginBtn");
    const storiesBtn = document.getElementById("storiesBtn");

    // Handle address search
    searchBtn.addEventListener("click", () => {
        const address = document.getElementById("addressInput").value.trim();
        if (address) {
            const encodedAddress = encodeURIComponent(address);
            window.location.href = `main.html?address=${encodedAddress}`;
        } else {
            alert("Please enter a valid address.");
        }
    });

    // Handle login navigation
    loginBtn.addEventListener("click", () => {
        window.location.href = "login.html";
    });

    // Handle stories navigation
    storiesBtn.addEventListener("click", () => {
        window.location.href = "stories.html";
    });
});
