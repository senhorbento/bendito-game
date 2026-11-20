export const movies = [
  ["Comédia","Riso"],["Drama","Lágrimas"],["Terror","Susto"],["Suspense","Mistério"],["Aventura","Jornada"],["Fantasia","Magia"],["Ficção científica","Futuro"],["Romance","Beijo"],["Musical","Canção"],["Documentário","Realidade"],
  ["Animação","Desenho"],["Faroeste","Cowboy"],["Policial","Investigação"],["Guerra","Batalha"],["Histórico","Passado"],["Biografia","Vida"],["Super-herói","Máscara"],["Espionagem","Segredo"],["Apocalipse","Fim"],["Distopia","Controle"],
  ["Robô","Metal"],["Dragão","Fogo"],["Vampiro","Mordida"],["Zumbi","Mortos"],["Pirata","Navio"],["Detetive","Pista"],["Astronauta","Espaço"],["Monstro","Criatura"],["Alienígena","Planeta"],["Dinossauro","Fóssil"],
  ["Vilão","Mal"],["Herói","Coragem"],["Princesa","Coroa"],["Múmia","Sarcófago"],["Fantasma","Assombração"],["Bruxa","Feitiço"],["Ninja","Sombra"],["Agente","Missão"],["Cientista","Laboratório"],["Cavaleiro","Armadura"],
  ["Diretor","Câmera"],["Ator","Cena"],["Roteiro","História"],["Trilha sonora","Música"],["Cinema","Tela"],["Oscar","Estatueta"],["Trailer","Prévia"],["Sequência","Continuação"],["Remake","Releitura"],["Créditos","Encerramento"]
].map(([word, clue]) => ({ word, clues: [clue, `Relacionado a ${word}`, `Associado a ${word}`] }));
