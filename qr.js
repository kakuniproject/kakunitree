/**
 * @fileoverview Geração e download de QR codes usando a biblioteca local Project Nayuki.
 */
window.KakuniQR = {
  /**
   * Desenha um QR com margem de quatro módulos e correção média.
   * @param {!HTMLCanvasElement} canvas Superfície de saída.
   * @param {string} text Texto ou endereço a codificar.
   * @throws {Error} Quando o conteúdo excede a capacidade da biblioteca.
   */
  draw(canvas, text) {
    const qr = qrcodegen.QrCode.encodeText(text, qrcodegen.QrCode.Ecc.MEDIUM),
      quiet = 4,
      scale = 10,
      size = (qr.size + quiet * 2) * scale;
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';
    for (let y = 0; y < qr.size; y++)
      for (let x = 0; x < qr.size; x++)
        if (qr.getModule(x, y))
          ctx.fillRect((x + quiet) * scale, (y + quiet) * scale, scale, scale);
  },
  /**
   * Baixa como PNG o QR já desenhado.
   * @param {!HTMLCanvasElement} canvas Canvas com o QR code.
   */
  download(canvas) {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'kakuniboys-qr-code.png';
    a.click();
  },
};
