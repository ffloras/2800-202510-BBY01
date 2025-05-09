// document.addEventListener("DOMContentLoaded", () => {
//   const form = document.getElementById("postForm");
//   const cancelBtn = document.getElementById("cancelBtn");

//   cancelBtn.addEventListener("click", () => {
//     window.location.href = "/stories.html";
//   });

//   form.addEventListener("submit", async (e) => {
//     e.preventDefault();

//     const formData = new FormData();
//     formData.append("id", Date.now().toString());
//     formData.append("title", document.getElementById("title").value.trim());
//     formData.append("author", document.getElementById("author").value.trim() || "Anonymous");
//     formData.append("story", document.getElementById("story").value.trim());

//     const imageInput = document.getElementById("image");
//     if (imageInput.files.length > 0) {
//       formData.append("image", imageInput.files[0]);
//     }

//     try {
//       const response = await fetch("/api/posts", {
//         method: "POST",
//         body: formData
//       });

//       if (response.ok) {
//         alert("Story submitted with image!");
//         window.location.href = "/stories.html";
//       } else {
//         const errText = await response.text();
//         alert("Failed to submit story: " + errText);
//       }
//     } catch (err) {
//       console.error("Error:", err);
//       alert("Unexpected error occurred.");
//     }
//   });
// });

$(document).ready(function() {
  $('#postForm').submit(function(event) {
  event.preventDefault(); // Prevent the default form submission
 
 
  // Get the form data
  let formData = new FormData(this);
 
 
  // Send the data to the server using AJAX
  $.ajax({
  url: '/api/stories',  //  The server endpoint to handle story creation (adjust if needed)
  type: 'POST',
  data: formData,
  contentType: false,   //  Important for file uploads
  processData: false,   //  Important for file uploads
  success: function(response) {
  // Handle success (e.g., show a success message, redirect)
  console.log('Story submitted successfully!', response);
  alert('Story submitted successfully!');
  $('#postForm')[0].reset(); // Clear the form
  window.location.href = '/stories'; //  Redirect to the stories page
  },
  error: function(xhr, status, error) {
  // Handle errors (e.g., show an error message)
  console.error('Error submitting story:', error);
  alert('Error submitting story. Please try again.');
  }
  });
  });
 
 
  $('#cancelBtn').click(function() {
  //  Implement cancel functionality (e.g., clear form, redirect)
  $('#postForm')[0].reset(); // Clear the form
  window.location.href = '/'; //  Redirect to the homepage or another page
  });
 });