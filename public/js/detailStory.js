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
    const titleElement = document.querySelector(".story-title");
    titleElement.innerText = story.title;

    const storyContentElement = document.querySelector(".story-content");
    storyContentElement.innerText = story.story;

    // Add image if present
    if (story.image) {
      const img = document.createElement("img");
      img.src = `/${story.image}`;
      img.alt = story.title;
      img.classList.add("img-fluid", "rounded", "shadow");
      document.querySelector(".story-image").appendChild(img);
    }

    // Get session user info and show Edit/Delete if story belongs to user
    const sessionRes = await fetch("/sessionInfo");
    if (sessionRes.ok) {
      const sessionData = await sessionRes.json();

      if (story.author === sessionData.username) {
        const buttonContainer = document.createElement("div");
        buttonContainer.className = "text-center mt-3";

        // Edit button
        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit Story";
        editBtn.className = "btn btn-primary me-2";
        editBtn.addEventListener("click", () => {
          // Make title editable
          const titleInput = document.createElement("input");
          titleInput.type = "text";
          titleInput.value = titleElement.innerText;
          titleInput.className = "form-control mb-2";
          titleElement.replaceWith(titleInput);

          // Make story content editable
          const storyTextarea = document.createElement("textarea");
          storyTextarea.value = storyContentElement.innerText;
          storyTextarea.className = "form-control mb-2";
          storyTextarea.rows = 5;
          storyContentElement.replaceWith(storyTextarea);

          // Add file input for image
          const imageInput = document.createElement("input");
          imageInput.type = "file";
          imageInput.accept = "image/*";
          imageInput.className = "form-control mb-3";
          document.querySelector(".story-image").appendChild(imageInput);

          // Save Changes button
          const saveBtn = document.createElement("button");
          saveBtn.textContent = "Save Changes";
          saveBtn.className = "btn btn-success mt-2";
          buttonContainer.appendChild(saveBtn);

          // Handle save
          saveBtn.addEventListener("click", async () => {
            const formData = new FormData();
            formData.append("id", storyId);
            formData.append("title", titleInput.value);
            formData.append("story", storyTextarea.value);
            if (imageInput.files.length > 0) {
              formData.append("image", imageInput.files[0]);
            }

            const response = await fetch(`/api/stories/${storyId}`, {
              method: "PUT",
              body: formData,
            });

            if (response.ok) {
              alert("Story updated!");
              window.location.reload();
            } else {
              alert("Failed to update story.");
            }
          });

          editBtn.disabled = true;
        });

        // Delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete Story";
        deleteBtn.className = "btn btn-danger";
        deleteBtn.addEventListener("click", async () => {
          if (!confirm("Are you sure you want to delete this story?")) return;

          const response = await fetch(`/api/stories/${storyId}`, {
            method: "DELETE",
          });

          if (response.ok) {
            alert("Story deleted.");
            window.location.href = "/stories";
          } else {
            alert("Failed to delete story.");
          }
        });

        buttonContainer.appendChild(editBtn);
        buttonContainer.appendChild(deleteBtn);
        document.querySelector(".story-container").appendChild(buttonContainer);
      }
    }

  } catch (err) {
    console.error("Error loading story:", err);
    document.body.innerHTML = "<h2>Error loading story. Please try again later.</h2>";
  }
});
