$(document).ready(function () {
  const storyInput = $('#story');
  const errorSpan = $('#storyCountError');

  // Live word count update
  storyInput.on('input', function () {
    let text = $(this).val().trim();
    let wordCount = text.split(/\s+/).filter(word => word.length > 0).length;

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

  // Form submission handler
  $('#postForm').submit(function (event) {
    event.preventDefault();

    let storyText = storyInput.val().trim();
    let wordCount = storyText.split(/\s+/).filter(function (word) {
      return word.length > 0;
    }).length;

    // Validation
    if (wordCount < 20) {
      alert('Story must be at least 20 words.');
      return;
    }

    if (wordCount > 70) {
      alert('Story must be no more than 70 words.');
      return;
    }

    let formData = new FormData(this);

    // Submit via AJAX
    $.ajax({
      url: '/api/stories',
      type: 'POST',
      data: formData,
      contentType: false,
      processData: false,
      success: function (response) {
        console.log('Story submitted successfully!', response);
        alert('Story submitted successfully!');
        $('#postForm')[0].reset();
        errorSpan.text('').removeClass('valid invalid');
        window.location.href = '/stories';
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

  // Cancel button handler
  $('#cancelBtn').click(function () {
    $('#postForm')[0].reset();
    errorSpan.text('').removeClass('valid invalid');
    window.location.href = '/';
  });
});
