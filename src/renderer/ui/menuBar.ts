// Top menu bar: each `.menu` has a title button that opens/closes its dropdown.
// File menu items stay disabled until New / Open / Export are implemented (issue #10).
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
      // Keep this click from reaching the document listener below, which would close the menu again.
      event.stopPropagation();
    });
  });

  // Clicking anywhere else or pressing Escape closes the open menu.
  document.addEventListener('click', closeAll);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAll();
    }
  });
}

function setMenuOpen(menu: HTMLElement, open: boolean): void {
  menu.querySelector('.menu-title')?.setAttribute('aria-expanded', String(open));
  const items = menu.querySelector<HTMLElement>('.menu-items');
  if (items) {
    items.hidden = !open;
  }
}
