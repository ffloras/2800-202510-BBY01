
$(document).ready(function() {
  $('#postForm').submit(function(event) {
  event.preventDefault(); // Prevent the default form submission
 
  // Get the story text
  let storyText = $('#story').val().trim();
  let wordCount = storyText.split(/\s+/).filter(function(word) {
    return word.length > 0;
  }).length;

  // Check word count
  if (wordCount < 20) {
    alert('Story must be at least 20 words.');
    return; // Stop the submission
  }

  // Check MAXIMUM word count
  if (wordCount > 70) {
    alert('Story must be no more than 70 words.');
    return; // Stop the submission
  }
 
  // Get the form data
  let formData = new FormData(this);
  // Send the data to the server using AJAX
  $.ajax({
  url: '/api/stories',  //  The server endpoint to handle story creation (adjust if needed)
  type: 'POST',
  data: formData,
  contentType: false,   
  processData: false,   
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
  let errorMessage = 'Error submitting story. Please try again.';
        if (xhr.responseText === "Story must be maximum 70 words.") {
          errorMessage = "Story must be no more than 70 words.";
        }
        alert(errorMessage);
      }
    });
  });
 
 
  $('#cancelBtn').click(function() {
  //  Implement cancel functionality (e.g., clear form, redirect)
  $('#postForm')[0].reset(); // Clear the form
  window.location.href = '/'; //  Redirect to the homepage or another page
  });
 });