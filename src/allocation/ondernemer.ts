import {
    IBranche,
    IMarkt,
    IMarktindeling,
    IMarktondernemer,
    IMarktplaats,
    IPlaatsvoorkeur
} from '../markt.model';

import {
    count,
    sum
} from '../util';


const priorityCompare = (voorkeurA?: IPlaatsvoorkeur, voorkeurB?: IPlaatsvoorkeur): number => {
    const prioA = voorkeurA && typeof voorkeurA.priority === 'number' ? voorkeurA.priority : 0;
    const prioB = voorkeurB && typeof voorkeurB.priority === 'number' ? voorkeurB.priority : 0;

    return prioB - prioA;
};

const Ondernemer = {
    getBrancheIds: (markt: IMarkt, ondernemer: IMarktondernemer) => {
      return ondernemer.voorkeur && ondernemer.voorkeur.branches ||
             [];
    },

    getBranches: (markt: IMarkt, ondernemer: IMarktondernemer): IBranche[] => {
        const brancheIds = Ondernemer.getBrancheIds(markt, ondernemer);

        return brancheIds.reduce((branches, brancheId) => {
            const branche = markt.branches.find(b => b.brancheId === brancheId);
            if (branche) {
                branches.push(branche);
            }
            return branches;
        }, []);
    },

    getPlaatsVoorkeuren: (
        markt: IMarkt,
        ondernemer: IMarktondernemer,
        includeVastePlaatsen: boolean = true
    ): IPlaatsvoorkeur[] => {
        let vastePlaatsenAsVoorkeur = <IPlaatsvoorkeur[]>[];
        // Merge de vaste plaatsen van deze ondernemer...
        if (includeVastePlaatsen) {
            const plaatsen = Ondernemer.getVastePlaatsen(ondernemer);
            vastePlaatsenAsVoorkeur = plaatsen.map(plaats => ({
                ...plaats,
                erkenningsNummer: ondernemer.erkenningsNummer,
                marktId: markt.marktId,
                priority: 0
            }));
        }
        // ...samen met hun verplaatsingsvoorkeuren. Sorteer aflopend op prioriteit...
        const voorkeuren = [
            ...vastePlaatsenAsVoorkeur,
            ...markt.voorkeuren.filter(voorkeur => voorkeur.erkenningsNummer === ondernemer.erkenningsNummer)
        ].sort(priorityCompare);

        // ...en haal duplicaten eruit.
        return voorkeuren.reduce((unique, voorkeur) => {
            if (!~unique.findIndex(({ plaatsId }) => plaatsId === voorkeur.plaatsId)) {
                unique.push(voorkeur);
            }
            return unique;
        }, []);
    },

    getTargetSize: (ondernemer: IMarktondernemer): number => {
        const voorkeur = ondernemer.voorkeur;
        return voorkeur ?
               Math.max(1, voorkeur.minimum || null, voorkeur.maximum || null) :
               1;
    },

    getVastePlaatsen: (ondernemer: IMarktondernemer): IMarktplaats[] => {
        const { plaatsen = [] } = ondernemer;
        return plaatsen.map(plaatsId => ({ plaatsId }));
    },

    heeftVastePlaats: (ondernemer: IMarktondernemer, plaats: IMarktplaats): boolean => {
        if (!ondernemer.plaatsen) {
            return false;
        }
        return !!ondernemer.plaatsen.find(plaatsId => plaatsId === plaats.plaatsId);
    },

    heeftVastePlaatsen: (ondernemer: IMarktondernemer): boolean => {
        return Ondernemer.isVast(ondernemer) && count(ondernemer.plaatsen) > 0;
    },

    isInBranche: (markt: IMarkt, ondernemer: IMarktondernemer, branche?: IBranche): boolean => {
        const brancheIds = Ondernemer.getBrancheIds(markt, ondernemer);
        return branche ? brancheIds.includes(branche.brancheId) : !!brancheIds.length;
    },

    isInMaxedOutBranche: (indeling: IMarktindeling, ondernemer: IMarktondernemer): boolean => {
        const branches = Ondernemer.getBranches(indeling, ondernemer);

        // For each branche this ondernemer is in, find out if it has already
        // exceeded the maximum amount of toewijzingen or the maximum amount
        // of plaatsen.
        return !!branches.find(branche => {
            const { maximumToewijzingen, maximumPlaatsen } = branche;
            const brancheToewijzingen = indeling.toewijzingen.filter(toewijzing =>
                Ondernemer.isInBranche(indeling, toewijzing.ondernemer, branche)
            );
            const branchePlaatsen = brancheToewijzingen
                                    .map(toewijzing => toewijzing.plaatsen.length)
                                    .reduce(sum, 0);

            return maximumToewijzingen && brancheToewijzingen.length >= maximumToewijzingen ||
                   maximumPlaatsen     && branchePlaatsen >= maximumPlaatsen;
        });
    },

    isVast: (ondernemer: IMarktondernemer): boolean => {
        return ondernemer.status === 'vpl' || ondernemer.status === 'vkk';
    },

    wantsExpansion: (indeling: IMarktindeling, ondernemer: IMarktondernemer): number => {
        const targetSize = Ondernemer.getTargetSize(ondernemer);
        return Math.max(0, targetSize - indeling.expansionIteration);
    } ,

    wantsToMove: (indeling: IMarktindeling, ondernemer: IMarktondernemer): boolean => {
        const plaatsen   = Ondernemer.getVastePlaatsen(ondernemer);
        const voorkeuren = Ondernemer.getPlaatsVoorkeuren(indeling, ondernemer, false);
        return voorkeuren.length >= plaatsen.length;
    }
};

export default Ondernemer;
