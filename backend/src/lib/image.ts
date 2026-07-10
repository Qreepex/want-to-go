import sharp from "sharp";

const MAX_DIMENSION = 1024;

interface CompressedImage {
  buffer: Buffer;
  contentType: string;
}

export async function compressImage(
  buffer: Buffer,
  mimetype: string,
): Promise<CompressedImage> {
  const image = sharp(buffer, { animated: mimetype === "image/gif" }).resize({
    width: MAX_DIMENSION,
    height: MAX_DIMENSION,
    fit: "inside",
    withoutEnlargement: true,
  });

  switch (mimetype) {
    case "image/jpeg":
      return {
        buffer: await image.jpeg({ quality: 80, mozjpeg: true }).toBuffer(),
        contentType: mimetype,
      };
    case "image/png":
      return {
        buffer: await image
          .png({ compressionLevel: 9, palette: true })
          .toBuffer(),
        contentType: mimetype,
      };
    case "image/webp":
      return {
        buffer: await image.webp({ quality: 80 }).toBuffer(),
        contentType: mimetype,
      };
    case "image/avif":
      return {
        buffer: await image.avif({ quality: 55 }).toBuffer(),
        contentType: mimetype,
      };
    case "image/gif":
      return {
        buffer: await image.gif().toBuffer(),
        contentType: mimetype,
      };
    default:
      return { buffer, contentType: mimetype };
  }
}
