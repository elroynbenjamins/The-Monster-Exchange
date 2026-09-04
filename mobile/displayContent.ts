import {content as rulesContent} from '../src/content/index.ts';
import {cards} from './cards';
// Card labels lead presentation; immutable simulation IDs and save fingerprints remain unchanged.
export const content={...rulesContent,species:rulesContent.species.map(species=>{
 const name=cards[species.id]?.printedName||species.name;
 return {...species,name,description:species.description.split(species.name).join(name)};
})};
