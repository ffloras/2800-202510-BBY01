document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("postForm");
  const cancelBtn = document.getElementById("cancelBtn");

  cancelBtn.addEventListener("click", () => {
    window.location.href = "/stories.html";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("id", Date.now().toString());
    formData.append("title", document.getElementById("title").value.trim());
    formData.append("author", document.getElementById("author").value.trim() || "Anonymous");
    formData.append("story", document.getElementById("story").value.trim());

    const imageInput = document.getElementById("image");
    if (imageInput.files.length > 0) {
      formData.append("image", imageInput.files[0]);
    }

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        alert("Story submitted with image!");
        window.location.href = "/stories.html";
      } else {
        const errText = await response.text();
        alert("Failed to submit story: " + errText);
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Unexpected error occurred.");
    }
  });
});
