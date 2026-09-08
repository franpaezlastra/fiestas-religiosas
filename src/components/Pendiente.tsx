type Props = {
  titulo: string;
  children: string;
};

export function Pendiente({ titulo, children }: Props) {
  return (
    <aside className="border border-dashed border-azul-logo/50 bg-papel px-4 py-5 text-azul-logo">
      <p className="font-display text-sm uppercase tracking-wide">{titulo}</p>
      <p className="mt-2 font-body text-sm text-texto">{children}</p>
    </aside>
  );
}
