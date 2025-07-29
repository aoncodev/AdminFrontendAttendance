// Simple QR Code generator using canvas
export const generateQRCode = (text: string, size = 512): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Create canvas
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      canvas.width = size;
      canvas.height = size;

      // Simple QR-like pattern generator (for demo purposes)
      // In production, use a proper QR code library
      const moduleSize = size / 25; // 25x25 grid

      // Fill background
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, size, size);

      // Generate pattern based on text
      ctx.fillStyle = "#000000";

      // Create a simple pattern based on the text hash
      const hash = text.split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);

      // Generate QR-like pattern
      for (let row = 0; row < 25; row++) {
        for (let col = 0; col < 25; col++) {
          const shouldFill =
            (hash + row * col) % 3 === 0 ||
            (row < 7 && col < 7) ||
            (row < 7 && col > 17) ||
            (row > 17 && col < 7) ||
            (row > 8 && row < 16 && col > 8 && col < 16);

          if (shouldFill) {
            ctx.fillRect(
              col * moduleSize,
              row * moduleSize,
              moduleSize,
              moduleSize
            );
          }
        }
      }

      // Add text at bottom
      ctx.fillStyle = "#000000";
      ctx.font = `${size / 20}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText(text, size / 2, size - 10);

      // Convert to data URL
      const dataURL = canvas.toDataURL("image/png");
      resolve(dataURL);
    } catch (error) {
      reject(error);
    }
  });
};
