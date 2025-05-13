
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