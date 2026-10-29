const ASSINATURA_RESPONSAVEL_URL = new URL(
  "../assets/assinatura-responsavel.png",
  import.meta.url,
).href;

let assinaturaResponsavelPromise = null;

export const RESPONSAVEL_ASSINATURA = Object.freeze({
  nome: "José Salvador Oliveira Costa",
  cargo: "Responsável Salvateck",
});

function carregarImagem(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("SIGNATURE_IMAGE_LOAD_FAILED"));
    image.src = url;
  });
}

export async function carregarAssinaturaResponsavelPdf() {
  if (assinaturaResponsavelPromise) {
    return assinaturaResponsavelPromise;
  }

  assinaturaResponsavelPromise = (async () => {
    try {
      const response = await fetch(ASSINATURA_RESPONSAVEL_URL, {
        cache: "no-store",
      });

      if (!response.ok) {
        return "";
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      try {
        const image = await carregarImagem(objectUrl);
        const canvas = document.createElement("canvas");

        const sourceWidth = Math.max(
          1,
          image.naturalWidth || image.width || 1,
        );

        const sourceHeight = Math.max(
          1,
          image.naturalHeight || image.height || 1,
        );

        const padding = 8;

        canvas.width = sourceWidth + padding * 2;
        canvas.height = sourceHeight + padding * 2;

        const context = canvas.getContext("2d");

        if (!context) {
          return "";
        }

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        const offsets = [
          [0, 0],
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ];

        offsets.forEach(([offsetX, offsetY]) => {
          context.drawImage(
            image,
            padding + offsetX,
            padding + offsetY,
            sourceWidth,
            sourceHeight,
          );
        });

        return canvas.toDataURL("image/png");
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    } catch (error) {
      console.warn(
        "[PDF] Não foi possível carregar a assinatura do responsável.",
        error,
      );

      return "";
    }
  })();

  return assinaturaResponsavelPromise;
}

export function desenharAssinaturaResponsavelPdf(
  pdf,
  {
    dataUrl,
    x = 22,
    y = 0,
    width = 72,
    height = 20,
    nome = RESPONSAVEL_ASSINATURA.nome,
    cargo = RESPONSAVEL_ASSINATURA.cargo,
    textColor = [43, 47, 51],
    lineColor = [158, 164, 170],
  } = {},
) {
  if (!pdf || !dataUrl) {
    return y;
  }

  try {
    const imageProperties = pdf.getImageProperties(dataUrl);

    const imageRatio =
      Number(imageProperties?.width || 0) /
      Number(imageProperties?.height || 1);

    let finalWidth = width;
    let finalHeight = imageRatio > 0 ? finalWidth / imageRatio : height;

    if (finalHeight > height) {
      finalHeight = height;
      finalWidth = finalHeight * imageRatio;
    }

    const finalX = x + (width - finalWidth) / 2;
    const finalY = y + (height - finalHeight) / 2;

    pdf.addImage(
      dataUrl,
      "PNG",
      finalX,
      finalY,
      finalWidth,
      finalHeight,
    );
  } catch (error) {
    console.warn("[PDF] Não foi possível inserir a assinatura.", error);

    return y;
  }

  const lineY = y + height + 1.5;

  pdf.setDrawColor(...lineColor);
  pdf.setLineWidth(0.3);
  pdf.line(x, lineY, x + Math.max(width, 58), lineY);

  pdf.setTextColor(...textColor);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.text(String(nome || "Responsável").trim(), x, lineY + 4.3);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.4);
  pdf.text(String(cargo || "Salvateck").trim(), x, lineY + 8);

  return lineY + 10;
}
