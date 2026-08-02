/**
 * Uploads an image file to Imgur via public Client ID or falls back to data URL.
 */
export const uploadToImgur = async (file: File): Promise<string> => {
    const clientId = 'c9d300067ff505d'; // Imgur Client ID
    const formData = new FormData();
    formData.append('image', file);

    try {
        const res = await fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
                Authorization: `Client-ID ${clientId}`
            },
            body: formData
        });
        const data = await res.json();
        if (data.success && data.data?.link) {
            return data.data.link;
        }
    } catch (err) {
        console.warn('Imgur upload failed, converting file locally:', err);
    }

    // Fallback to reading file as Data URL if offline or Imgur blocked
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
};
