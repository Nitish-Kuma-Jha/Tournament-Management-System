/**
 * Automatic bracket generator for tournaments
 */

const shuffleArray = (arr) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const nextPowerOfTwo = (n) => {
  let power = 1;
  while (power < n) power *= 2;
  return power;
};

exports.generateSingleEliminationBracket = (teams) => {
  const shuffled = shuffleArray(teams);
  const totalSlots = nextPowerOfTwo(shuffled.length);
  const byes = totalSlots - shuffled.length;
  const slots = [...shuffled, ...Array(byes).fill(null)];

  const rounds = [];
  let currentRound = [];

  // Round 1
  for (let i = 0; i < slots.length; i += 2) {
    currentRound.push({
      matchNumber: currentRound.length + 1,
      round: 1,
      teamA: slots[i] ? slots[i]._id || slots[i] : null,
      teamAName: slots[i] ? slots[i].name || 'TBD' : 'BYE',
      teamB: slots[i + 1] ? slots[i + 1]._id || slots[i + 1] : null,
      teamBName: slots[i + 1] ? slots[i + 1].name || 'TBD' : 'BYE',
      winner: null,
      status: 'scheduled',
    });
  }
  rounds.push(currentRound);

  // Subsequent rounds
  let roundNum = 2;
  let matchesInRound = currentRound.length / 2;
  while (matchesInRound >= 1) {
    const nextRound = [];
    for (let i = 0; i < matchesInRound; i++) {
      nextRound.push({
        matchNumber: i + 1,
        round: roundNum,
        teamA: null,
        teamAName: 'TBD',
        teamB: null,
        teamBName: 'TBD',
        winner: null,
        status: 'pending',
      });
    }
    rounds.push(nextRound);
    roundNum++;
    matchesInRound = Math.floor(matchesInRound / 2);
    if (matchesInRound === 0) break;
  }

  return {
    type: 'single_elimination',
    totalTeams: teams.length,
    totalSlots,
    totalRounds: rounds.length,
    rounds,
    generatedAt: new Date(),
  };
};

exports.generateRoundRobinBracket = (teams) => {
  const matches = [];
  let matchNumber = 1;

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        matchNumber: matchNumber++,
        round: 1,
        teamA: teams[i]._id || teams[i],
        teamAName: teams[i].name || 'Team ' + (i + 1),
        teamB: teams[j]._id || teams[j],
        teamBName: teams[j].name || 'Team ' + (j + 1),
        winner: null,
        status: 'scheduled',
      });
    }
  }

  return {
    type: 'round_robin',
    totalTeams: teams.length,
    totalMatches: matches.length,
    matches,
    standings: teams.map(t => ({
      team: t._id || t,
      teamName: t.name || 'Team',
      played: 0,
      won: 0,
      lost: 0,
      drawn: 0,
      points: 0,
    })),
    generatedAt: new Date(),
  };
};

exports.updateBracketResult = (bracket, matchId, winnerId) => {
  if (bracket.type === 'single_elimination') {
    for (const round of bracket.rounds) {
      const match = round.find(m => m.matchNumber === matchId);
      if (match) {
        match.winner = winnerId;
        match.status = 'completed';
        break;
      }
    }
  }
  return bracket;
};
