document.addEventListener("DOMContentLoaded", () => {
  console.log('postStory script is loaded')
  const form = document.getElementById("postForm");
  const cancelBtn = document.getElementById("cancelBtn");

  cancelBtn.addEventListener("click", () => {
    window.location.href = "/stories.html";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    let data = {}
    data["id"] = Date.now().toString()
    data["title"] = document.getElementById("title").value.trim()
    data["author"] = document.getElementById("title").value.trim()
    data["story"] = document.getElementById("title").value.trim()
    data["image "] = document.getElementById("image").files.length > 0 ? document.getElementById("image").files[0] : null
    // const formData = new FormData();
    // formData.append("id", Date.now().toString());
    // formData.append("title", document.getElementById("title").value.trim());
    // formData.append("author", document.getElementById("author").value.trim() || "Anonymous");
    // formData.append("story", document.getElementById("story").value.trim());

    // const imageInput = document.getElementById("image");
    // if (imageInput.files.length > 0) {
    //   formData.append("image", imageInput.files[0]);
    // }
    // console.log('formData: ' , formData)

      const response = await fetch("http://localhost:8000/api/stories", {
        method: "POST",
        body: JSON.stringify(data)
      });
      const result = await response.json();

      console.log(`Server Response: ${result}`);

      if (response.ok) {
        alert("Story submitted with image!");
        window.location.href = "/stories.html";
      } else {
        const errText = await response.text();
        alert("Failed to submit story: " + errText);
      }
  });
});
