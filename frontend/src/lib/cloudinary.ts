import { v2 as cloudinary } from 'cloudinary';

const uploadStr = (process.env.CLAUDINARY_API || process.env.CLOUDINARY_URL || '').trim();
const urlMatches = uploadStr.match(/cloudinary:\/\/(.*?):(.*?)@(.*)/);

if (urlMatches) {
  cloudinary.config({
    cloud_name: urlMatches[3],
    api_key: urlMatches[1],
    api_secret: urlMatches[2],
  });
} else {
  console.warn("Cloudinary not configured properly in .env");
}

export default cloudinary;
