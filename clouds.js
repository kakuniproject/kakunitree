/**
 * @fileoverview Resposta inercial do balão e das bolhinhas à rolagem.
 */
(function (root) {
  const controllers = new WeakMap();

  /**
   * Vincula três molas amortecidas, sem movimento quando a página está parada.
   * O impulso segue o scroll, contrariando o deslocamento visual do conteúdo.
   *
   * @param {!Document=} doc Documento público ou documento da prévia.
   * @param {{paused: (function(): boolean|undefined)}=} options Estado da pausa.
   */
  function bind(doc = document, { paused = () => false } = {}) {
    controllers.get(doc)?.dispose();
    const bubble = doc.querySelector('.speech');
    const view = doc.defaultView;
    if (!bubble || !view) return;
    const reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
    const springs = [
      {
        property: '--cloud-y',
        stiffness: 190,
        damping: 28,
        gain: 0.8,
        limit: 7,
      },
      {
        property: '--near-dot-y',
        stiffness: 155,
        damping: 22,
        gain: 1.25,
        limit: 9,
      },
      {
        property: '--far-dot-y',
        stiffness: 125,
        damping: 19,
        gain: 1.6,
        limit: 11,
      },
    ].map((spring) => ({ ...spring, position: 0, velocity: 0 }));
    let frame = 0;
    let lastTime = 0;
    let lastScroll = view.scrollY;

    /** Cancela a simulação e restaura as três posições iniciais. */
    function reset() {
      view.cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      lastScroll = view.scrollY;
      for (const spring of springs) {
        spring.position = spring.velocity = 0;
        bubble.style.setProperty(spring.property, '0px');
      }
    }

    /**
     * Integra a força restauradora e o amortecimento usando tempo em segundos.
     * @param {number} time Instante informado pelo requestAnimationFrame.
     */
    function tick(time) {
      frame = 0;
      if (reduced.matches || paused() || doc.hidden) {
        reset();
        return;
      }
      const dt = Math.min(
        0.032,
        Math.max(0.001, (time - (lastTime || time - 16)) / 1000),
      );
      lastTime = time;
      let moving = false;
      for (const spring of springs) {
        spring.velocity +=
          (-spring.stiffness * spring.position -
            spring.damping * spring.velocity) *
          dt;
        spring.position = Math.max(
          -spring.limit,
          Math.min(spring.limit, spring.position + spring.velocity * dt),
        );
        if (
          Math.abs(spring.position) < 0.03 &&
          Math.abs(spring.velocity) < 0.05
        ) {
          spring.position = spring.velocity = 0;
        } else moving = true;
        bubble.style.setProperty(
          spring.property,
          `${spring.position.toFixed(3)}px`,
        );
      }
      if (moving) frame = view.requestAnimationFrame(tick);
      else lastTime = 0;
    }

    /** Converte a variação de rolagem em impulsos diferentes para cada mola. */
    function scroll() {
      const delta = Math.max(-60, Math.min(60, view.scrollY - lastScroll));
      lastScroll = view.scrollY;
      if (reduced.matches || paused() || !delta) return;
      for (const spring of springs) {
        spring.velocity = Math.max(
          -140,
          Math.min(140, spring.velocity + delta * spring.gain),
        );
      }
      if (!frame) frame = view.requestAnimationFrame(tick);
    }

    view.addEventListener('scroll', scroll, { passive: true });
    reduced.addEventListener('change', reset);
    controllers.set(doc, {
      reset,
      dispose() {
        reset();
        view.removeEventListener('scroll', scroll);
        reduced.removeEventListener('change', reset);
      },
    });
  }

  root.KakuniClouds = {
    bind,
    /** @param {!Document=} doc Documento cujo movimento deve ser interrompido. */
    reset(doc = document) {
      controllers.get(doc)?.reset();
    },
  };
})(globalThis);
