type Props = {
  id?: string;
  titulo: string;
  kicker?: string;
};

export function Portadilla({ id, titulo, kicker }: Props) {
  return (
    <div id={id} className="bg-portadilla py-8 md:py-12">
      <div className="bg-azul-petroleo px-4 py-4 text-center text-blanco md:py-5">
        <h2 className="font-display text-2xl leading-tight md:text-4xl">{titulo}</h2>
        {kicker ? <p className="caption-en mt-1 font-body text-sm font-light md:text-base">{kicker}</p> : null}
      </div>
    </div>
  );
}
