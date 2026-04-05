(function () {
    'use strict';

    const MAX_DIMENSION = 4096;
    const JPEG_QUALITY = 0.85;
    const WEBP_QUALITY = 0.85;

    function compressImage(file, options = {}) {
        const maxWidth = options.maxWidth || MAX_DIMENSION;
        const quality = options.quality || JPEG_QUALITY;

        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(url);

                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxWidth) {
                    if (width > height) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxWidth) / height);
                        height = maxWidth;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const jpegBlob = new Promise((res) => {
                    canvas.toBlob(res, 'image/jpeg', quality);
                });
                const webpBlob = new Promise((res) => {
                    canvas.toBlob(res, 'image/webp', quality);
                });

                Promise.all([jpegBlob, webpBlob]).then(([jpeg, webp]) => {
                    resolve({
                        jpeg,
                        webp,
                        width,
                        height,
                        originalSize: file.size,
                        jpegSize: jpeg.size,
                        webpSize: webp.size
                    });
                });
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image for compression'));
            };

            img.src = url;
        });
    }

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    function isImageFile(file) {
        return file.type.startsWith('image/') && !file.type.includes('gif');
    }

    function isGifFile(file) {
        return file.type === 'image/gif';
    }

    window.AdminCompress = {
        compressImage,
        fileToBase64,
        blobToBase64,
        formatBytes,
        isImageFile,
        isGifFile,
        MAX_DIMENSION,
        JPEG_QUALITY,
        WEBP_QUALITY
    };
})();
