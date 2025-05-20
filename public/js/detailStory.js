// Wait until the DOM is fully loaded
document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const storyId = urlParams.get("id"); // Get the story ID from the URL

  // Handle missing story ID
  if (!storyId) {
    document.body.innerHTML = "<h2>Story ID is missing in the URL.</h2>";
    return;
  }

  try {
    // Fetch the story data using the ID
    const response = await fetch(`/api/stories/${storyId}`);
    if (!response.ok) {
      throw new Error("Story not found or bad response");
    }
    const story = await response.json();

    // Populate title
    const titleElement = document.querySelector(".story-title");
    titleElement.innerText = story.title;

    // Populate story content
    const storyContentElement = document.querySelector(".story-content");
    storyContentElement.innerText = story.story;

    // Add image if one exists for the story
    if (story.image) {
      const img = document.createElement("img");
      img.src = `/${story.image}`;
      img.alt = story.title;
      img.classList.add("img-fluid", "rounded", "shadow");
      document.querySelector(".story-image").appendChild(img);
    }

    // Fetch session information to determine if the user is the story owner
    const sessionRes = await fetch("/sessionInfo");
    if (sessionRes.ok) {
      const sessionData = await sessionRes.json();

      // If the logged-in user is the story's author
      if (story.author === sessionData.username) {
        const buttonContainer = document.createElement("div");
        buttonContainer.className = "text-center mt-3";

        // === Edit Button ===
        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit Story";
        editBtn.className = "btn btn-primary me-2";
        editBtn.addEventListener("click", () => {
          // Replace title with editable input
          const titleInput = document.createElement("input");
          titleInput.type = "text";
          titleInput.value = titleElement.innerText;
          titleInput.className = "form-control mb-2";
          titleElement.replaceWith(titleInput);

          // Replace content with editable textarea
          const storyTextarea = document.createElement("textarea");
          storyTextarea.value = storyContentElement.innerText;
          storyTextarea.className = "form-control mb-2";
          storyTextarea.rows = 5;
          storyContentElement.replaceWith(storyTextarea);

          // Image upload input
          const imageInput = document.createElement("input");
          imageInput.type = "file";
          imageInput.accept = "image/*";
          imageInput.className = "form-control mb-3";
          document.querySelector(".story-image").appendChild(imageInput);

          // Save button to submit changes
          const saveBtn = document.createElement("button");
          saveBtn.textContent = "Save Changes";
          saveBtn.className = "btn btn-success mt-2";
          buttonContainer.appendChild(saveBtn);

          // Save story changes on click
          saveBtn.addEventListener("click", async () => {
            const formData = new FormData();
            formData.append("id", storyId);
            formData.append("title", titleInput.value);
            formData.append("story", storyTextarea.value);

            // Add image if a new one is selected
            if (imageInput.files.length > 0) {
              formData.append("image", imageInput.files[0]);
            }

            // Send PUT request to update story
            const response = await fetch(`/api/stories/${storyId}`, {
              method: "PUT",
              body: formData,
            });

            // Handle response
            if (response.ok) {
              alert("Story updated!");
              window.location.reload();
            } else {
              alert("Failed to update story.");
            }
          });

          // Disable the edit button to prevent re-editing
          editBtn.disabled = true;
        });

        // === Delete Button ===
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete Story";
        deleteBtn.className = "btn btn-danger";
        deleteBtn.addEventListener("click", async () => {
          // Confirm deletion
          if (!confirm("Are you sure you want to delete this story?")) return;

          // Send DELETE request
          const response = await fetch(`/api/stories/${storyId}`, {
            method: "DELETE",
          });

          // Handle delete response
          if (response.ok) {
            alert("Story deleted.");
            window.location.href = "/stories";
          } else {
            alert("Failed to delete story.");
          }
        });

        // Append both buttons to the container
        buttonContainer.appendChild(editBtn);
        buttonContainer.appendChild(deleteBtn);
        document.querySelector(".story-container").appendChild(buttonContainer);
      }
    }
  } catch (err) {
    console.error("Error loading story:", err);
    document.body.innerHTML =
      "<h2>Error loading story. Please try again later.</h2>";
  }
});
