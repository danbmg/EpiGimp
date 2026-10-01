// Barre de menu du haut : chaque `.menu` a un bouton titre qui ouvre/ferme son menu déroulant.
// Chaque item `data-command="x"` lance `commands.x`.
export function initMenuBar(menuBar: HTMLElement, commands: Record<string, () => void>): void {
  const menus = menuBar.querySelectorAll<HTMLElement>('.menu');

  const closeAll = (): void => {
    menus.forEach((menu) => setMenuOpen(menu, false));
  };

  menus.forEach((menu) => {
    const title = menu.querySelector('.menu-title');
    if (!title) {
      return;
    }
    title.addEventListener('click', (event) => {
      const wasOpen = title.getAttribute('aria-expanded') === 'true';
      closeAll();
      setMenuOpen(menu, !wasOpen);
      event.stopPropagation();
    });
  });

  // Échoue au démarrage plutôt qu'au clic si `index.html` référence une commande inconnue.
  menuBar.querySelectorAll<HTMLElement>('[data-command]').forEach((item) => {
    const command = commands[item.dataset.command ?? ''];
    if (!command) {
      throw new Error(`Unknown menu command "${item.dataset.command}" in index.html`);
    }
    item.addEventListener('click', () => {
      closeAll();
      command();
    });
  });

  document.addEventListener('click', closeAll);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAll();
    }
  });
}

// Ouvre ou ferme un menu et affiche/masque ses items.
function setMenuOpen(menu: HTMLElement, open: boolean): void {
  menu.querySelector('.menu-title')?.setAttribute('aria-expanded', String(open));
  const items = menu.querySelector<HTMLElement>('.menu-items');
  if (items) {
    items.hidden = !open;
  }
}
