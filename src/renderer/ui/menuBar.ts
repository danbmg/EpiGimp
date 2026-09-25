// Barre de menu du haut : chaque `.menu` a un bouton titre qui ouvre/ferme son menu déroulant.
export function initMenuBar(menuBar: HTMLElement): void {
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
