/**
 * @fileoverview Inicialização da página pública, idiomas, compartilhamento e controle de movimento.
 */
(function () {
  'use strict';
  const c = window.CHANNEL_CONTENT,
    host = document.getElementById('channel');
  if (LinkKit.validate(c).length) {
    host.textContent =
      'Não foi possível carregar o canal. Verifique o arquivo de conteúdo.';
    return;
  }
  let lang =
      new URLSearchParams(location.search).get('lang') ||
      c.defaultLanguage ||
      'pt',
    paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  lang = lang === 'en' ? 'en' : 'pt';
  /**
   * Obtém o endereço canônico para compartilhar e codificar no QR.
   * @return {string} URL configurada ou endereço atual sem consulta e fragmento.
   */
  const publicURL = () =>
    c.siteUrl || location.href.split('?')[0].split('#')[0];
  /**
   * Exibe uma mensagem temporária acessível, substituindo a anterior.
   * @param {string} text Mensagem apresentada ao visitante.
   */
  const feedback = (text) => {
    document.querySelector('.share-message')?.remove();
    const el = document.createElement('div');
    el.className = 'share-message';
    el.role = 'status';
    el.textContent = text;
    document.body.append(el);
    setTimeout(() => el.remove(), 3500);
  };
  /**
   * Copia o endereço público e informa o resultado ao visitante.
   * @return {!Promise<void>} Conclusão da tentativa de acesso à área de transferência.
   */
  async function copy() {
    try {
      await navigator.clipboard.writeText(publicURL());
      feedback(lang === 'en' ? 'Link copied.' : 'Link copiado.');
    } catch {
      feedback(
        lang === 'en'
          ? 'Copy the address from your browser.'
          : 'Copie o endereço na barra do navegador.',
      );
    }
  }
  /**
   * Aplica a pausa dos efeitos e preserva a imagem selecionada para a capa.
   * Quando pausado, desenha um quadro da própria capa em canvas; nunca usa o avatar.
   */
  function motion() {
    KakuniEffects.reset(document);
    document.body.classList.toggle('motion-paused', paused);
    const b = document.querySelector('.motion-toggle');
    b.setAttribute('aria-pressed', String(paused));
    b.textContent =
      lang === 'en'
        ? paused
          ? 'Resume animations'
          : 'Pause animations'
        : paused
          ? 'Retomar animações'
          : 'Pausar animações';
    const image = document.querySelector('.cover img');
    if (!image) return;
    image.parentElement.querySelector('.cover-still')?.remove();
    image.hidden = false;
    if (!paused) return;
    /**
     * Desenha uma imagem carregada como quadro estático com transparência.
     */
    const freeze = () => {
      if (!paused || !image.isConnected || !image.naturalWidth) return;
      image.parentElement.querySelector('.cover-still')?.remove();
      const canvas = document.createElement('canvas');
      canvas.className = 'cover-still';
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', image.alt);
      canvas.getContext('2d').drawImage(image, 0, 0);
      image.after(canvas);
      image.hidden = true;
    };
    if (image.complete) freeze();
    else image.addEventListener('load', freeze, { once: true });
  }
  /**
   * Atualiza idioma, metadados, conteúdo e eventos da página pública.
   */
  function render() {
    document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
    document.body.classList.toggle('light', c.theme === 'light');
    document.body.style.setProperty('--bg', c.background);
    document.title = c.name + ' · Links';
    document.querySelector('meta[name="description"]').content =
      lang === 'en' ? c.english?.bio || c.bio : c.bio;
    host.innerHTML = LinkKit.render(c, lang);
    document.querySelectorAll('[data-lang]').forEach(
      (b) =>
        (b.onclick = () => {
          lang = b.dataset.lang;
          try {
            const url = new URL(location.href);
            url.searchParams.set('lang', lang);
            history.replaceState(null, '', url);
          } catch {}
          render();
        }),
    );
    document.querySelector('.copy-link').onclick = copy;
    document.querySelector('.share').onclick = async () => {
      if (navigator.share) {
        try {
          await navigator.share({ title: c.name, url: publicURL() });
        } catch (e) {
          if (e.name !== 'AbortError') copy();
        }
      } else copy();
    };
    document.querySelector('.qr-open').onclick = openQR;
    document.querySelector('.motion-toggle').onclick = () => {
      paused = !paused;
      motion();
    };
    motion();
    KakuniEffects.bind(document, { paused: () => paused });
  }
  /**
   * Abre o diálogo modal com QR local e download em PNG.
   */
  function openQR() {
    const dialog = document.createElement('dialog');
    dialog.className = 'qr-dialog';
    const en = lang === 'en';
    dialog.innerHTML = `<form method="dialog"><button class="dialog-close" aria-label="${en ? 'Close' : 'Fechar'}">×</button></form><h2>${en ? 'Bring the crew along.' : 'Leve a galera junto.'}</h2><p>${en ? 'Scan to visit KakuniBoys.' : 'Escaneie para encontrar os KakuniBoys.'}</p><canvas aria-label="QR code"></canvas><p class="qr-url">${LinkKit.esc(publicURL())}</p><button class="qr-download">${en ? 'Download PNG' : 'Baixar PNG'}</button>`;
    document.body.append(dialog);
    try {
      KakuniQR.draw(dialog.querySelector('canvas'), publicURL());
    } catch {
      dialog.remove();
      feedback(
        en
          ? 'Unable to generate QR code.'
          : 'Não foi possível gerar o QR code.',
      );
      return;
    }
    dialog.querySelector('.qr-download').onclick = () =>
      KakuniQR.download(dialog.querySelector('canvas'));
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', () => dialog.remove());
    dialog.showModal();
  }
  render();
})();
