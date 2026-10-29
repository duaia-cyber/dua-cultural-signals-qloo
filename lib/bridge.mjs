// A transparent comparison of the bounded results returned by Qloo.
// IDs, not names, determine whether two references represent the same entity.
const idOf = item => item.id.toLowerCase();

function compareDomain(itemsA, itemsB, referenceA, referenceB) {
  const idA = idOf(referenceA), idB = idOf(referenceB);
  const targetA = itemsA.findIndex(item => idOf(item) === idB);
  const targetB = itemsB.findIndex(item => idOf(item) === idA);
  const direct = [];
  if (targetA >= 0) direct.push({ from: referenceA.name, to: referenceB.name, rank: targetA + 1 });
  if (targetB >= 0) direct.push({ from: referenceB.name, to: referenceA.name, rank: targetB + 1 });

  // Avoid presenting either seed artist as its own independently discovered bridge.
  const a = new Map(itemsA.filter(item => ![idA, idB].includes(idOf(item))).map(item => [idOf(item), item]));
  const b = new Map(itemsB.filter(item => ![idA, idB].includes(idOf(item))).map(item => [idOf(item), item]));
  return {
    common: [...a].filter(([id]) => b.has(id)).map(([, item]) => item),
    onlyA: [...a].filter(([id]) => !b.has(id)).map(([, item]) => item),
    onlyB: [...b].filter(([id]) => !a.has(id)).map(([, item]) => item),
    direct,
    sampleA: itemsA.length,
    sampleB: itemsB.length,
  };
}

export function buildBridge(referenceA, referenceB, goal, artistsA, artistsB, filmsA, filmsB) {
  const actions = {
    showcase: 'Use these cultural references to develop a programme; verify living performers, availability, fees and consent separately.',
    collaboration: 'Use the references to research potential creative partners; confirm interest and contact people only with appropriate consent.',
    campaign: 'Use the references to shape a campaign concept; independently clear music, image and other rights before use.',
  };
  if (!Object.hasOwn(actions, goal)) throw new TypeError('Invalid goal');
  return {
    references: [referenceA.name, referenceB.name],
    goal,
    artists: compareDomain(artistsA, artistsB, referenceA, referenceB),
    films: compareDomain(filmsA, filmsB, referenceA, referenceB),
    actions: [actions[goal], 'Check context and representation with people from the communities involved.', 'Treat these results as research leads, not proof of shared audiences or an endorsement.'],
    method: 'Qloo returned up to six artist and six film references for each selected artist. Common entries have matching Qloo entity IDs in these limited results.',
  };
}
