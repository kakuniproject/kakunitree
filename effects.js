/**
 * @fileoverview Interações dos links com o mouse, compartilhadas com a prévia do editor.
 */
window.KakuniEffects = {
  /**
   * Restaura os botões ao estado visual neutro.
   * @param {!Document=} doc Documento que contém os links.
   */
  reset(doc = document) {
    KakuniClouds.reset(doc);
    doc.querySelectorAll('.channel-link').forEach((card) => {
      card.classList.remove('pointer-active');
      card.style.removeProperty('--mouse-x');
      card.style.removeProperty('--mouse-y');
    });
  },
  /**
   * Vincula inclinação e deslocamento de ícone ao ponteiro do mouse.
   * Ignora toque, preferência de movimento reduzido e pausa explícita.
   *
   * @param {!Document=} doc Documento público ou documento da prévia.
   * @param {{paused: (function(): boolean|undefined), navigate: (boolean|undefined)}=} options Opções de pausa e navegação.
   */
  bind(doc = document, { paused = () => false, navigate = true } = {}) {
    KakuniClouds.bind(doc, { paused });
    const fine = matchMedia('(hover: hover) and (pointer: fine)'),
      reduced = matchMedia('(prefers-reduced-motion: reduce)');
    doc.querySelectorAll('.channel-link').forEach((card) => {
      let bounds;
      /**
       * Limpa a referência geométrica e os deslocamentos de um botão.
       */
      const reset = () => {
        bounds = null;
        card.classList.remove('pointer-active');
        card.style.removeProperty('--mouse-x');
        card.style.removeProperty('--mouse-y');
      };
      card.addEventListener('pointermove', (event) => {
        if (
          event.pointerType !== 'mouse' ||
          !fine.matches ||
          reduced.matches ||
          paused()
        ) {
          reset();
          return;
        }
        bounds ??= card.getBoundingClientRect();
        const x = Math.max(
          -1,
          Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1),
        );
        const y = Math.max(
          -1,
          Math.min(1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1),
        );
        card.style.setProperty('--mouse-x', x.toFixed(3));
        card.style.setProperty('--mouse-y', y.toFixed(3));
        card.classList.add('pointer-active');
      });
      card.addEventListener('pointerleave', reset);
      card.addEventListener('pointercancel', reset);
      card.addEventListener('blur', reset);
      if (!navigate)
        card.addEventListener('click', (event) => event.preventDefault());
    });
  },
};
