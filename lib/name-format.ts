// Usado no site e no servidor: deixa o nome com iniciais maiúsculas.
// "maria da silva" -> "Maria da Silva": inicial maiúscula em cada nome,
// mantendo minúsculas as partículas (da, de, do, das, dos, e).
const NAME_PARTICLES = new Set(["da", "de", "do", "das", "dos", "e", "di", "du", "van", "von"]);
export function formatPersonName(raw: string) {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR")
    .split(" ")
    .map((word, index) =>
      index > 0 && NAME_PARTICLES.has(word)
        ? word
        : word
            .split("-")
            .map((part) => part.charAt(0).toLocaleUpperCase("pt-BR") + part.slice(1))
            .join("-")
            .replace(/'(\p{L})/gu, (_, letter: string) => `'${letter.toLocaleUpperCase("pt-BR")}`),
    )
    .join(" ");
}
