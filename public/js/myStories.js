$(document).ready(function () {
    fetch('/api/my-stories')
        .then(res => {
            if (!res.ok) {
                throw new Error(`Network response was not ok: ${res.statusText}`);
            }
            return res.json();
        })
        .then(data => {
            const container = $('#myStories-container');
            container.empty();

            if (!Array.isArray(data)) {
                console.error("Data received is not an array:", data);
                container.append("<p>Error: Could not load stories properly.</p>");
                return;
            }

            if (data.length === 0) {
                container.append("<p>No stories found.</p>");
                return;
            }

            data.forEach(story => {
                const storyText = story.story || "Story content not available.";
                const storyTitle = story.title || "Untitled Story";
                let imageHTML = '';
                if (story.image) {
                    imageHTML = `<img src="/${story.image}" alt="Story image" class="story-current-image mb-2" style="max-width: 200px; max-height: 200px; display: block;">`;
                }


                const storyBlock = $(`
                    <div class="story-block" data-id="${story._id}" data-image-path="${story.image || ''}">
                        ${imageHTML}
                        <h4 class="story-title">${storyTitle}</h4>
                        <p class="story-text">${storyText}</p>
                        <div class="mt-2">
                            <button class="btn btn-warning btn-sm edit-btn">Edit</button>
                            <button class="btn btn-danger btn-sm delete-btn">Delete</button>
                        </div>
                    </div>
                `);
                container.append(storyBlock);
            });
        })
        .catch(err => {
            console.error("Error fetching or processing my stories:", err);
            $('#myStories-container').empty().append("<p>Error loading stories. Please try again later.</p>");
        });

    // DELETE
    $(document).on('click', '.delete-btn', function () {
        const storyDiv = $(this).closest('.story-block');
        const id = storyDiv.data('id');

        if (confirm("Are you sure you want to delete this story?")) {
            fetch(`/api/stories/${id}`, { method: 'DELETE' })
                .then(res => {
                    if (res.ok) {
                        storyDiv.remove();
                        if ($('#myStories-container').children('.story-block').length === 0) {
                            $('#myStories-container').append("<p>No stories found.</p>");
                        }
                    } else {
                        res.text().then(text => alert("Failed to delete story. Server says: " + (text || res.statusText)));
                    }
                })
                .catch(err => {
                    console.error("Error deleting story:", err);
                    alert("Error deleting story. Please check console.");
                });
        }
    });

    // EDIT (inline)
    $(document).on('click', '.edit-btn', function () {
        const storyDiv = $(this).closest('.story-block');
        const id = storyDiv.data('id');
        const currentTitle = storyDiv.find('.story-title').text();
        const currentStoryText = storyDiv.find('.story-text').text();
        const currentImagePath = storyDiv.data('image-path'); // Get current image path

        const originalContent = storyDiv.html(); // Store original content for cancel

        let currentImageDisplay = '';
        if (currentImagePath) {
            currentImageDisplay = `<img src="/${currentImagePath}" alt="Current image" style="max-width: 100px; max-height: 100px; display:block; margin-bottom:10px;">`;
        }

        storyDiv.html(`
            <form class="edit-form" enctype="multipart/form-data"> 
                <div class="mb-3">
                    <label for="edit-title-${id}" class="form-label">Title</label>
                    <input type="text" id="edit-title-${id}" class="form-control edit-title" name="title" value="${currentTitle}" required />
                </div>
                <div class="mb-3">
                    <label for="edit-story-${id}" class="form-label">Story</label>
                    <textarea id="edit-story-${id}" class="form-control edit-story" name="story" rows="3" required>${currentStoryText}</textarea>
                </div>
                <div class="mb-3">
                    <label for="edit-image-${id}" class="form-label">Image </label>
                    ${currentImageDisplay}
                    <input type="file" id="edit-image-${id}" class="form-control edit-image" name="image" accept="image/*" />
                </div>
                <button type="submit" class="btn btn-success btn-sm me-2">Save</button>
                <button type="button" class="btn btn-secondary btn-sm cancel-edit-btn">Cancel</button>
            </form>
        `);

        storyDiv.find('.cancel-edit-btn').on('click', function () {
            storyDiv.html(originalContent); // Restore original content
        });

        storyDiv.find('.edit-form').on('submit', function (e) {
            e.preventDefault();
            
            const formData = new FormData(this); // Use FormData to handle file upload

            
            if (!formData.get('title').trim() || !formData.get('story').trim()) {
                alert("Title and story text cannot be empty.");
                return;
            }
            
            fetch(`/api/stories/${id}`, {
                method: 'PUT',
                body: formData 
            })
            .then(res => {
                if (!res.ok) {
                    return res.text().then(text => { throw new Error(text || res.statusText); });
                }
                return res.text(); 
            })
            .then(responseText => { 
                alert("Story updated successfully!"); 
                location.reload(); 
            })
            .catch(err => {
                console.error("Error updating story:", err);
                alert("Error updating story: " + err.message);
            });
        });
    });
});