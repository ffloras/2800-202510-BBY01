
document.addEventListener("DOMContentLoaded", async () => {
  const storyContainer = document.getElementById("stories-container");

  try {
    const response = await fetch("/api/stories");
    const stories = await response.json();

    if (stories.length === 0) {
      storyContainer.innerHTML = "<p>No stories posted yet.</p>";
      return;
    }

    stories.forEach(story => {
      const storyCard = document.createElement("div");
      storyCard.className = "story-block";
      storyCard.innerHTML = `
        <h4>${story.title}</h4>
        <p><strong>Author:</strong> ${story.author}</p>
        <p>${story.story}</p>
        <a href="/detailStory" class="button-read-more">Read more...</a>
      `;
      storyContainer.appendChild(storyCard);
    });
  } catch (err) {
    console.error("Failed to load stories:", err);
    storyContainer.innerHTML = "<p>Failed to load stories.</p>";
  }
});

  