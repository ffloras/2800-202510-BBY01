document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const storyId = urlParams.get("id");
  
    if (!storyId) {
      document.body.innerHTML = "<h2>Story ID is missing in the URL.</h2>";
      return;
    }
  
    try {
      const response = await fetch(`/api/stories/${storyId}`);
      if (!response.ok) {
        throw new Error("Story not found or bad response");
      }
      const story = await response.json();
  
      // Show story content
      document.querySelector(".story-title").innerText = story.title;
      document.querySelector(".story-content").innerText = story.story;
  
      // Add image if present
      if (story.image) {
        const img = document.createElement("img");
        img.src = `/${story.image}`;
        img.alt = story.title;
        img.classList.add("img-fluid", "rounded", "shadow");
        document.querySelector(".story-image").appendChild(img);
      }
  
    } catch (err) {
      console.error("Error loading story:", err);
      document.body.innerHTML = "<h2>Error loading story. Please try again later.</h2>";
    }
  });