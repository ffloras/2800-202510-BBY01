document.addEventListener("DOMContentLoaded", async () => {
    const storyContainer = document.getElementById("storyContainer");
  
    try {
      const response = await fetch("/api/posts");
      const stories = await response.json();
  
      if (stories.length === 0) {
        storyContainer.innerHTML = "<p>No stories posted yet.</p>";
        return;
      }
  
      stories.forEach(story => {
        const storyCard = document.createElement("div");
        storyCard.className = "story-card";
        storyCard.innerHTML = `
          <h3>${story.title}</h3>
          <p><strong>Author:</strong> ${story.author}</p>
          <p>${story.story}</p>
          <hr/>
        `;
        storyContainer.appendChild(storyCard);
      });
    } catch (err) {
      console.error("Failed to load stories:", err);
      storyContainer.innerHTML = "<p>Failed to load stories.</p>";
    }
  });
  