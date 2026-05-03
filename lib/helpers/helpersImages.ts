import imageCompression from 'browser-image-compression';

export const handleImageCompression = async (imageFile: File): Promise<File | undefined> => {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  };
  try {
    return await imageCompression(imageFile, options);
  } catch (error) {
    console.log(error);
  }
};

export const handleHeaderImageCompression = async (imageFile: File): Promise<File | undefined> => {
  const isTextHeavyImage = imageFile.type === 'image/png';
  const options = {
    // Featured images often contain screenshots or dense typography, so give them
    // a larger fidelity budget than inline body images.
    maxSizeMB: isTextHeavyImage ? 3 : 2,
    maxWidthOrHeight: isTextHeavyImage ? 3200 : 2560,
    useWebWorker: true,
    initialQuality: 1,
    fileType: imageFile.type,
    alwaysKeepResolution: isTextHeavyImage
  };
  try {
    return await imageCompression(imageFile, options);
  } catch (error) {
    console.log(error);
    // Fall back to the default image compression path if the higher-fidelity
    // featured-image settings fail in this browser.
    return handleImageCompression(imageFile);
  }
};

export const fileToImageUrl = (file: File): Promise<string> => {
  if (!file) return Promise.resolve('');
  return new Promise(resolve => {
    const reader = new FileReader();

    reader.onload = e => {
      resolve(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  });
};
