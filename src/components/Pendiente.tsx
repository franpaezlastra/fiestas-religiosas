type Props = {
  titulo: string;
  children: string;
};

export function Pendiente({ titulo, children }: Props) {
  return (
    <aside className="border-2 border-dashed border-azul-logo px-4 py-4 text-azul-logo">
      <p className="font-display text-sm uppercase tracking-wide">{titulo}</p>
      <p className="mt-2 font-body text-sm text-texto">{children}</p>
    </aside>
  );
}
