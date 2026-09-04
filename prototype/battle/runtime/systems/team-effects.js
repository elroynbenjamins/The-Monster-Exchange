                                                                                      
                                                                                     

                              
                                
                                                 
                            
 

function countTypes(monsters                              , species                              )                         {
  const counts                         = {};
  for (const monster of monsters) {
    const definition = species.find(({ id }) => id === monster.speciesId);
    for (const type of definition?.types ?? []) if (type) counts[type] = (counts[type] ?? 0) + 1;
  }
  return counts;
}

function countTags(monsters                              , species                              )                         {
  const counts                         = {};
  for (const monster of monsters) {
    const definition = species.find(({ id }) => id === monster.speciesId);
    for (const tag of definition?.tags ?? []) counts[tag] = (counts[tag] ?? 0) + 1;
  }
  return counts;
}

export function evaluateTeamSynergies(monsters                              , species                              , synergies                              )              {
  const active = monsters.slice(0, 3);
  const types = countTypes(active, species);
  const tags = countTags(active, species);
  const activated = synergies.filter((synergy) => {
    if (active.length < synergy.minimumMembers) return false;
    if (Object.entries(synergy.requiredTypes ?? {}).some(([id, count]) => (types[id] ?? 0) < (count ?? 0))) return false;
    if (Object.entries(synergy.requiredTags ?? {}).some(([id, count]) => (tags[id] ?? 0) < count)) return false;
    return true;
  });
  const statModifiers                                  = {};
  for (const synergy of activated) {
    for (const [stat, value] of Object.entries(synergy.statModifiers ?? {})                      ) {
      statModifiers[stat] = Math.min(0.15, (statModifiers[stat] ?? 0) + value);
    }
  }
  return {
    synergyIds: activated.map(({ id }) => id), statModifiers,
    teamShieldPercent: Math.min(0.15, activated.reduce((sum, synergy) => sum + (synergy.teamShieldPercent ?? 0), 0)),
  };
}

export function passiveForMonster(monster                   , species                              , passives                              )                    {
  const definition = species.find(({ id }) => id === monster.speciesId);
  const passive = passives.find(({ id }) => id === definition?.passiveId);
  if (!passive) throw new Error(`Missing passive for species ${monster.speciesId}.`);
  return passive;
}
