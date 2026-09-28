





export function Portadilla({ id, titulo }) {
  return (
    <div id={id} className="bg-portadilla py-10 md:py-14">
      <div className="bg-azul-petroleo px-4 py-5 text-center text-blanco md:py-7">
        <h2 className="font-display text-[2.5rem] leading-tight md:text-[3.5rem]">{titulo}</h2>
      </div>
    </div>);

}