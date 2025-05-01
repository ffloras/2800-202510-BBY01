document.addEventListener("DOMContentLoaded", () => {
    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const inputs = document.querySelectorAll('#profileForm input, #profileForm select');

    // Enable editing
    editBtn.addEventListener('click', () => {
        inputs.forEach(input => input.disabled = false);
        saveBtn.disabled = false;
    });

    // Handle save
    document.getElementById('profileForm').addEventListener('submit', (e) => {
        e.preventDefault();
        alert("Profile saved successfully!");
        inputs.forEach(input => input.disabled = true);
        saveBtn.disabled = true;

        
    });

    // Handle delete
    deleteBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to delete your profile?")) {
            alert("Profile deleted.");
            // Optional: send delete request to server
        }
    });
});