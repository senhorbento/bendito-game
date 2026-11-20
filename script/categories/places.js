export const places = [
  ["Praia","Areia"],["Montanha","Altitude"],["Floresta","Árvores"],["Deserto","Oásis"],["Cachoeira","Queda"],["Ilha","Oceano"],["Vulcão","Lava"],["Caverna","Escuro"],["Lago","Reflexo"],["Rio","Correnteza"],
  ["Cidade","Trânsito"],["Vila","Pequena"],["Castelo","Muralha"],["Museu","História"],["Biblioteca","Livros"],["Escola","Estudo"],["Hospital","Cuidado"],["Estádio","Torcida"],["Teatro","Palco"],["Cinema","Filme"],
  ["Restaurante","Cardápio"],["Mercado","Compras"],["Padaria","Pães"],["Fazenda","Colheita"],["Parque","Brinquedos"],["Zoológico","Animais"],["Aquário","Peixes"],["Aeroporto","Viagem"],["Estação","Trilhos"],["Porto","Navios"],
  ["Farol","Luz"],["Ponte","Travessia"],["Praça","Encontro"],["Igreja","Sinos"],["Templo","Sagrado"],["Pirâmide","Egito"],["Metrô","Subterrâneo"],["Shopping","Lojas"],["Academia","Exercício"],["Camping","Barraca"],
  ["Acampamento","Fogueira"],["Rodoviária","Ônibus"],["Embaixada","Diplomacia"],["Universidade","Campus"],["Oficina","Ferramentas"],["Estúdio","Gravação"],["Galeria","Quadros"],["Mirante","Vista"],["Pousada","Descanso"],["Hotel","Quarto"]
].map(([word, clue]) => ({ word, clues: [clue, "Ligado", "Contexto"] }));
