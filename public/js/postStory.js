// Wait for the DOM to be fully loaded
$(document).ready(function () {
  const storyInput = $('#story');              // Text area for the story input
  const errorSpan = $('#storyCountError');     // Span element for showing validation messages

  // Live word count validation as the user types
  storyInput.on('input', function () {
    let text = $(this).val().trim();           // Get trimmed input text
    let wordCount = text.split(/\s+/).filter(word => word.length > 0).length; // Count non-empty words

    // Validate word count range
    if (wordCount < 20) {
      errorSpan.text('Story must be at least 20 words.');
      errorSpan.removeClass('valid').addClass('invalid');
    } else if (wordCount > 70) {
      errorSpan.text('Story must be no more than 70 words.');
      errorSpan.removeClass('valid').addClass('invalid');
    } else {
      errorSpan.text(`Word count: ${wordCount}`);
      errorSpan.removeClass('invalid').addClass('valid');
    }
  });

  // Handle form submission
  $('#postForm').submit(function (event) {
    event.preventDefault();                    // Prevent default form behavior

    let storyText = storyInput.val().trim();   // Get trimmed story input
    let wordCount = storyText.split(/\s+/).filter(word => word.length > 0).length;

    // Final validation before submitting
    if (wordCount < 20) {
      alert('Story must be at least 20 words.');
      return;
    }

    if (wordCount > 70) {
      alert('Story must be no more than 70 words.');
      return;
    }

    let formData = new FormData(this);         // Create FormData object for AJAX

    // Submit the form via AJAX
    $.ajax({
      url: '/api/stories',
      type: 'POST',
      data: formData,
      contentType: false,                      // Let the browser set the correct content type
      processData: false,                      // Prevent jQuery from processing the data
      success: function (response) {
        console.log('Story submitted successfully!', response);
        alert('Story submitted successfully!');
        $('#postForm')[0].reset();             // Clear the form
        errorSpan.text('').removeClass('valid invalid');
        window.location.href = '/stories';     // Redirect to the stories page
      },
      error: function (xhr, status, error) {
        console.error('Error submitting story:', error);
        let errorMessage = 'Error submitting story. Please try again.';
        if (xhr.responseText === "Story must be maximum 70 words.") {
          errorMessage = "Story must be no more than 70 words.";
        }
        alert(errorMessage);
      }
    });
  });

  // Handle cancel button click
  $('#cancelBtn').click(function () {
    $('#postForm')[0].reset();                 // Clear the form
    errorSpan.text('').removeClass('valid invalid');
    window.location.href = '/';                // Redirect to homepage
  });
});
