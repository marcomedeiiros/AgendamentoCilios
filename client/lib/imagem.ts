const LADO_MAXIMO = 1200;
const QUALIDADE = 0.82;

export const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp'];
export const TAMANHO_MAXIMO = 8 * 1024 * 1024;

/**
 * Reduz a foto no navegador antes de enviar. Sem isso, uma imagem direto da
 * câmera do celular passaria de 5 MB e o envio falharia no limite do servidor.
 * Devolve uma data URL JPEG.
 */
export function prepararFoto(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!TIPOS_ACEITOS.includes(arquivo.type)) {
      reject(new Error('Envie a foto em JPG, PNG ou WebP.'));
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO) {
      reject(new Error('A foto precisa ter no máximo 8 MB.'));
      return;
    }

    const url = URL.createObjectURL(arquivo);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      const escala = Math.min(1, LADO_MAXIMO / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Não foi possível processar a imagem neste navegador.'));
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', QUALIDADE));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível abrir essa imagem.'));
    };

    img.src = url;
  });
}
