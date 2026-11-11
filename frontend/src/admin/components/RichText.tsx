import { useEffect, useRef } from 'react';
import { Icon } from '../../shared/icons';

/**
 * Editor de texto con formato (como un procesador de texto sencillo): negrita, cursiva, subtítulos, listas y enlaces.
 * Guarda HTML básico; el servidor lo limpia (sin scripts ni estilos) al guardar.
 * Al pegar desde Word u otra página se pega solo el texto, para no arrastrar formatos extraños.
 */
const BUTTONS: { cmd: string; arg?: string; label: string; icon?: string; text?: string }[] = [
  { cmd: 'formatBlock', arg: 'h3', label: 'Subtítulo', text: 'Subtítulo' },
  { cmd: 'formatBlock', arg: 'p', label: 'Párrafo normal', text: 'Párrafo' },
  { cmd: 'bold', label: 'Negrita', text: 'N' },
  { cmd: 'italic', label: 'Cursiva', text: 'K' },
  { cmd: 'insertUnorderedList', label: 'Lista con viñetas', text: '• Lista' },
  { cmd: 'insertOrderedList', label: 'Lista numerada', text: '1. Lista' },
  { cmd: 'createLink', label: 'Agregar enlace', icon: 'external', text: 'Enlace' },
  { cmd: 'removeFormat', label: 'Quitar formato', text: 'Quitar formato' },
];

export function RichText({ id, value, onChange, disabled }: { id?: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value ?? '')) ref.current.innerHTML = value ?? '';
  }, [value]);
  const run = (cmd: string, arg?: string) => {
    ref.current?.focus();
    if (cmd === 'createLink') {
      const url = window.prompt('Dirección del enlace (por ejemplo https://www.ut.edu.co):', 'https://');
      if (!url || url === 'https://') return;
      document.execCommand(cmd, false, url);
    } else {
      document.execCommand(cmd, false, arg);
    }
    onChange(ref.current?.innerHTML ?? '');
  };
  return (
    <div className={`mt-1 overflow-hidden rounded-lg border border-line bg-white focus-within:border-ut-red focus-within:ring-2 focus-within:ring-ut-red/20 ${disabled ? 'opacity-70' : ''}`}>
      {!disabled && (
        <div role="toolbar" aria-label="Formato del texto" className="flex flex-wrap gap-1 border-b border-line bg-surface px-2 py-1.5">
          {BUTTONS.map((b) => (
            <button key={b.label} type="button" title={b.label} aria-label={b.label} onMouseDown={(e) => { e.preventDefault(); run(b.cmd, b.arg); }}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-white hover:text-ut-red ${b.cmd === 'bold' ? 'font-extrabold' : b.cmd === 'italic' ? 'italic font-serif' : 'font-semibold'}`}>
              {b.icon && <Icon name={b.icon} />}{b.text}
            </button>
          ))}
        </div>
      )}
      <div
        id={id} ref={ref} role="textbox" aria-multiline="true" contentEditable={!disabled} suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML ?? '')}
        onPaste={(e) => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); }}
        className="rich-text min-h-48 px-3 py-2 text-sm text-ink focus:outline-none"
      />
    </div>
  );
}
