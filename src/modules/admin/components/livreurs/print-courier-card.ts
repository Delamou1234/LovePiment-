'use client';

const PRINT_ROOT_ID = 'courier-card-print-root';

function findCardsToPrint(): HTMLElement[] {
  const portalCard = document.querySelector<HTMLElement>(
    '.courier-card-print-portal .courier-id-card',
  );
  if (portalCard) return [portalCard];

  const modalCard = document.querySelector<HTMLElement>(
    '.courier-card-modal__preview .courier-id-card',
  );
  if (modalCard) return [modalCard];

  return Array.from(document.querySelectorAll<HTMLElement>('.courier-card-print-grid .courier-id-card'));
}

export function triggerCourierCardPrint(onCleanup?: () => void) {
  document.getElementById(PRINT_ROOT_ID)?.remove();

  const sources = findCardsToPrint();
  const root = document.createElement('div');
  root.id = PRINT_ROOT_ID;
  root.className = 'courier-card-print-root';

  if (sources.length === 1) {
    root.classList.add('is-single');
  }

  for (const source of sources) {
    const clone = source.cloneNode(true) as HTMLElement;
    clone.setAttribute('data-print-clone', 'true');
    root.appendChild(clone);
  }

  document.body.appendChild(root);
  document.body.classList.add('is-printing-courier-card');

  const cleanup = () => {
    document.body.classList.remove('is-printing-courier-card');
    document.getElementById(PRINT_ROOT_ID)?.remove();
    onCleanup?.();
  };

  window.addEventListener('afterprint', cleanup, { once: true });
  window.print();
}
