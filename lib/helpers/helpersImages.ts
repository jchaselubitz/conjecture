import imageCompression from 'browser-image-compression';

export const handleImageCompression = async (imageFile: File): Promise<File | undefined> => {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };
  try {
    return await imageCompression(imageFile, options);
  } catch (error) {
    console.log(error);
  }
};

export const fileToImageUrl = (file: File): Promise<string> => {
  if (!file) return Promise.resolve('');
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  });
};

