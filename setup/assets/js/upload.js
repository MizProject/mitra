/**
 * Handles the file upload process to a specified endpoint.
 * @param {string} fieldName - The name of the form field for the file (e.g., 'logo', 'banner').
 * @param {HTMLInputElement} fileInput - The file input element.
 * @returns {Promise<object>} A promise that resolves with the server's JSON response.
 */
async function uploadFile(fieldName, fileInput) {
    if (!fileInput.files || fileInput.files.length === 0) {
        // This is not an error, just means no file was selected for this field.
        return Promise.resolve({ message: "No file selected." });
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    // The backend `upload.single('file')` expects the field name to be 'file'.
    formData.append('file', file);

    try {
        // The `type` query parameter tells the backend what kind of file this is.
        const response = await fetch(`/api/upload-image?type=${fieldName}`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
            throw new Error(errorResult.error || `Failed to upload ${fieldName}.`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error uploading ${fieldName}:`, error);
        throw new Error(`Upload failed for ${fieldName}. Please check the server logs.`);
    }
}