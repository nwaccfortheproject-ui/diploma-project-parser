require('dotenv').config({ path: '.env' });
const { v2: cloudinary } = require('cloudinary');

const uploadStr = process.env.CLAUDINARY_API || process.env.CLOUDINARY_URL || '';
console.log("Raw CLAUDINARY_API:", uploadStr);

const urlMatches = uploadStr.match(/cloudinary:\/\/(.*?):(.*?)@(.*)/);

if (urlMatches) {
  console.log("Parsed credentials:");
  console.log("KEY:", urlMatches[1]);
  // console.log("SECRET:", urlMatches[2]); // hidden
  console.log("CLOUD NAME:", urlMatches[3]);

  cloudinary.config({
    cloud_name: urlMatches[3],
    api_key: urlMatches[1],
    api_secret: urlMatches[2],
  });
} else {
  console.error("Failed to parse Cloudinary URL.");
  process.exit(1);
}

async function testUpload() {
  try {
    // 1x1 transparent png base64
    const base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    console.log("Uploading test image...");
    const res = await cloudinary.uploader.upload(base64, {
      folder: "test"
    });
    console.log("Upload Success! URL:", res.secure_url);
  } catch (err) {
    console.error("Upload Error:", err);
  }
}

testUpload();
