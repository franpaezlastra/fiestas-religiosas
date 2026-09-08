type Props = {
  id?: string;
  titulo: string;
  kicker?: string;
};

export function Portadilla({ id, titulo, kicker }: Props) {
  return (
    <div id={id} className="bg-portadilla py-10 md:py-14">
      <div className="bg-azul-petroleo px-4 py-5 text-center text-blanco md:py-7">
        <h2 className="font-display text-[2.5rem] leading-tight md:text-[3.5rem]">{titulo}</h2>
        {kicker ? (
          <p className="caption-en mt-2 font-body text-sm font-light text-blanco/85 md:text-base">
            {kicker}
          </p>
        ) : null}
      </div>
    </div>
  );
}
