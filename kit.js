/**
 * @fileoverview Validação de conteúdo e renderização da página KakuniBoys.
 */
(function (root) {
  'use strict';
  /**
   * Escapa texto antes de inseri-lo no HTML.
   * @param {*} s Valor recebido do conteúdo.
   * @return {string} Texto com caracteres reservados escapados.
   */
  const esc = (s) =>
    String(s ?? '').replace(
      /[&<>"']/g,
      (c) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[c],
    );
  /**
   * Normaliza destinos HTTP, HTTPS e e-mail.
   * @param {string} s Endereço a verificar.
   * @return {string} Endereço normalizado ou string vazia se inválido.
   */
  const safeURL = (s) => {
    try {
      const u = new URL(s);
      return ['https:', 'http:', 'mailto:'].includes(u.protocol) ? u.href : '';
    } catch {
      return '';
    }
  };
  /**
   * Restringe imagens a arquivos do pacote, URLs web ou dados raster.
   * @param {string} s Caminho ou conteúdo da imagem.
   * @return {string} Origem aceita ou string vazia.
   */
  const safeImage = (s) =>
    /^assets\/[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp|gif|avif)$/.test(s || '')
      ? s
      : /^data:image\/(png|jpeg|webp|gif|avif);base64,[A-Za-z0-9+/=]+$/.test(
            s || '',
          )
        ? s
        : /^https?:\/\//i.test(s || '')
          ? safeURL(s)
          : '';
  const icons = {
    youtube:
      '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>',
    twitch: '<path d="M4 3h17v12l-6 6h-5v-4H4zM10 7v5m5-5v5"/>',
    instagram:
      '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17 7h.01"/>',
    tiktok: '<path d="M14 3v12a4 4 0 1 1-4-4m4-8c0 4 3 6 6 6"/>',
    discord:
      '<path d="M8 5 5 6 2 17l5 3 2-3h6l2 3 5-3-3-11-3-1M8 12h.01M16 12h.01"/>',
    link: '<path d="m9 15 6-6m-7 9H6a4 4 0 0 1-3-7l4-4a4 4 0 0 1 6 0m-2 10a4 4 0 0 0 6 0l4-4a4 4 0 0 0-3-7h-2"/>',
  };
  /**
   * Renderiza um ícone vetorial da biblioteca interna.
   * @param {string} p Identificador da plataforma.
   * @return {string} SVG decorativo; usa o ícone de link como alternativa.
   */
  const icon = (p) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[p] || icons.link}</svg>`;
  /**
   * Verifica o esquema de conteúdo antes de renderizar, importar ou exportar.
   * @param {!Object} c Configuração do canal, com versão, perfil e lista de links.
   * @return {!Array<string>} Mensagens de erro; lista vazia indica conteúdo válido.
   */
  function validate(c) {
    const errors = [];
    if (!c || c.version !== 1) return ['Formato de conteúdo incompatível.'];
    for (const [k, max] of Object.entries({
      name: 80,
      handle: 80,
      bio: 500,
      eyebrow: 120,
      footer: 180,
    }))
      if (typeof c[k] !== 'string' || c[k].length > max)
        errors.push(`Campo ${k}: use texto com até ${max} caracteres.`);
    if (!c.name?.trim()) errors.push('Preencha o nome do canal.');
    if (!/^#[0-9a-f]{6}$/i.test(c.accent))
      errors.push('Cor de destaque inválida.');
    if (!/^#[0-9a-f]{6}$/i.test(c.background))
      errors.push('Cor de fundo inválida.');
    if (!['light', 'dark'].includes(c.theme)) errors.push('Tema inválido.');
    if (
      c.siteUrl !== undefined &&
      (!/^https?:\/\//.test(c.siteUrl) || !safeURL(c.siteUrl))
    )
      errors.push('Endereço público inválido.');
    if (
      c.defaultLanguage !== undefined &&
      !['pt', 'en'].includes(c.defaultLanguage)
    )
      errors.push('Idioma inválido.');
    if (
      c.english !== undefined &&
      (!c.english ||
        typeof c.english !== 'object' ||
        ['bio', 'eyebrow', 'footer'].some(
          (k) => typeof c.english[k] !== 'string' || c.english[k].length > 500,
        ))
    )
      errors.push('Textos em inglês inválidos.');
    for (const k of ['avatar', 'cover'])
      if (typeof c[k] !== 'string' || (c[k] && !safeImage(c[k])))
        errors.push(`Imagem ${k} inválida.`);
    if (!Array.isArray(c.links) || c.links.length > 30)
      return [...errors, 'Use no máximo 30 links.'];
    c.links.forEach((l, i) => {
      if (!l || typeof l !== 'object') {
        errors.push(`Link ${i + 1} inválido.`);
        return;
      }
      if (
        typeof l.title !== 'string' ||
        !l.title.trim() ||
        l.title.length > 100
      )
        errors.push(`Link ${i + 1}: título obrigatório, até 100 caracteres.`);
      if (typeof l.description !== 'string' || l.description.length > 200)
        errors.push(`Link ${i + 1}: descrição com até 200 caracteres.`);
      if (typeof l.url !== 'string' || !safeURL(l.url))
        errors.push(
          `Link ${i + 1}: informe uma URL completa (https://) ou mailto:.`,
        );
      if (typeof l.image !== 'string' || (l.image && !safeImage(l.image)))
        errors.push(`Link ${i + 1}: imagem inválida.`);
      if (
        !Object.hasOwn(icons, l.platform) ||
        typeof l.featured !== 'boolean' ||
        typeof l.enabled !== 'boolean'
      )
        errors.push(`Link ${i + 1}: opções inválidas.`);
      if (
        l.color !== undefined &&
        l.color !== '' &&
        !/^#[0-9a-f]{6}$/i.test(l.color)
      )
        errors.push(`Link ${i + 1}: cor inválida.`);
      for (const k of ['titleEn', 'descriptionEn', 'iconText'])
        if (
          l[k] !== undefined &&
          (typeof l[k] !== 'string' ||
            l[k].length > (k === 'iconText' ? 16 : 200))
        )
          errors.push(`Link ${i + 1}: campo ${k} inválido.`);
    });
    return errors;
  }
  /**
   * Monta o HTML público também usado pela prévia do editor.
   * Não altera a configuração. Os textos são escapados e os destinos validados.
   *
   * @param {!Object} c Configuração do canal previamente validada.
   * @param {string=} lang Idioma pt ou en; usa o idioma inicial quando omitido.
   * @return {string} HTML do perfil, links, compartilhamento e crédito do Studio.
   */
  function render(c, lang = c.defaultLanguage || 'pt') {
    const accent = /^#[0-9a-f]{6}$/i.test(c.accent) ? c.accent : '#ff754d';
    const [r, g, b] = accent
      .slice(1)
      .match(/../g)
      .map((n) => parseInt(n, 16) / 255)
      .map((n) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4));
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const ink = lum > 0.179 ? '#17191b' : '#ffffff';
    const en = lang === 'en',
      text = (k) => (en && c.english?.[k] ? c.english[k] : c[k]);
    const image = (s, cls, alt) =>
      safeImage(s)
        ? `<img class="${cls}" src="${esc(safeImage(s))}" alt="${esc(alt)}">`
        : '';
    const initials = (c.name || 'Canal')
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    const card = (l) => {
      const color = /^#[0-9a-f]{6}$/i.test(l.color || '') ? l.color : '';
      const ci = color ? contrast(color) : '';
      return `<a class="channel-link ${l.featured ? 'featured' : ''}" ${color ? `style="background:${color};color:${ci};border-color:${color};--muted:${ci};--accent-ink:${ci}"` : ''} href="${esc(safeURL(l.url))}" target="_blank" rel="noopener noreferrer">${image(l.image, 'link-image', '') || `<span class="link-icon">${l.iconText ? `<span class="custom-icon">${esc(l.iconText)}</span>` : icon(l.platform)}</span>`}<span class="link-copy"><span class="link-title">${esc(en && l.titleEn ? l.titleEn : l.title)}</span>${l.description ? `<span class="link-description">${esc(en && l.descriptionEn ? l.descriptionEn : l.description)}</span>` : ''}</span><span class="external" aria-hidden="true">${icon('link')}</span></a>`;
    };
    const cover = image(c.cover, '', en ? 'Channel cover' : 'Capa do canal');
    return `<div class="channel" style="--accent:${accent};--accent-ink:${ink}">
      <div class="channel-top"><span class="wordmark"><i class="brand-mark" aria-hidden="true"></i>${esc(c.handle)}</span><div class="top-actions"><div class="languages" role="group" aria-label="${en ? 'Language' : 'Idioma'}"><button data-lang="pt" aria-pressed="${!en}" lang="pt-BR">PT</button><button data-lang="en" aria-pressed="${en}" lang="en">EN</button></div><button class="share" aria-label="${en ? 'Share channel' : 'Compartilhar canal'}">${icon('link')}</button></div></div>
      <div class="cover">${cover ? `<picture>${cover}</picture>` : '<div class="cover-art" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>'}</div>
      <header class="identity"><div class="mascot-row"><div class="mascot">${text('eyebrow') ? `<div class="speech">${esc(text('eyebrow'))}</div>` : ''}${image(c.avatar, 'avatar', en ? 'Channel avatar' : 'Logo do canal') || `<div class="avatar" aria-hidden="true">${esc(initials)}</div>`}</div></div><h1>${esc(c.name)}</h1><p class="handle">${esc(c.handle)}</p><p class="bio">${esc(text('bio'))}</p></header>
      <div class="link-list">${
        c.links
          .filter((l) => l.enabled && safeURL(l.url))
          .map(card)
          .join('') ||
        `<p class="empty">${en ? 'New links coming soon.' : 'Novos links em breve.'}</p>`
      }</div>
      <footer class="channel-footer"><p>${esc(text('footer'))}</p><div class="footer-actions"><button class="copy-link">${en ? 'Copy channel link' : 'Copiar link do canal'}</button><button class="qr-open">QR code</button><button class="motion-toggle" aria-pressed="false">${en ? 'Pause animations' : 'Pausar animações'}</button></div></footer></div>`;
  }
  /**
   * Escolhe texto claro ou escuro pela luminância relativa da cor.
   * @param {string} hex Cor no formato hexadecimal de seis dígitos.
   * @return {string} Cor de texto que oferece maior contraste.
   */
  function contrast(hex) {
    const [r, g, b] = hex
      .slice(1)
      .match(/../g)
      .map((n) => parseInt(n, 16) / 255)
      .map((n) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179 ? '#17191b' : '#ffffff';
  }
  root.LinkKit = { esc, safeURL, safeImage, icon, validate, render };
})(globalThis);
