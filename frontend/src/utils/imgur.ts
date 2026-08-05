import apiClient from '../api/client';

/**
 * Uploads an image file to MinIO S3 via backend API /api/files/upload.
 * Falls back to Imgur or Data URL if backend is unreachable.
 */
export const uploadToImgur = async (file: File): Promise<string> => {
    // 1. Primary: Upload to backend MinIO S3 service
    try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await apiClient.post('/api/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data && res.data.url) {
            return res.data.url;
        }
    } catch (err) {
        console.warn('Backend MinIO upload failed, trying Imgur fallback:', err);
    }

    // 2. Secondary: Fallback to Imgur
    const clientId = 'c9d300067ff505d'; // Imgur Client ID
    try {
        const formData = new FormData();
        formData.append('image', file);
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

    // 3. Last Fallback: Base64 Data URL
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
};

