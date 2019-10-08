import {
    IBranche,
    IMarkt,
    IMarktindeling,
    IMarktondernemer,
    IMarktplaats,
    IPlaatsvoorkeur,
    IToewijzing
} from '../markt.model';

import {
    sum
} from '../util';

const priorityCompare = (voorkeurA?: IPlaatsvoorkeur, voorkeurB?: IPlaatsvoorkeur): number => {
    const prioA = voorkeurA && typeof voorkeurA.priority === 'number' ? voorkeurA.priority : 0;
    const prioB = voorkeurB && typeof voorkeurB.priority === 'number' ? voorkeurB.priority : 0;

    return prioB - prioA;
};

const Ondernemer = {
    canExpandInIteration: (
        indeling: IMarktindeling,
        toewijzing: IToewijzing
    ): boolean => {
        const { ondernemer, plaatsen } = toewijzing;
        const currentSize = plaatsen.length;
        const targetSize  = Ondernemer.getTargetSize(ondernemer);
        const maxSize     = Math.min(targetSize, indeling.expansionIteration);

        return currentSize < maxSize &&
               !Ondernemer.isInMaxedOutBranche(indeling, ondernemer);
    },

    getBranches: (
        markt: IMarkt,
        ondernemer: IMarktondernemer
    ): IBranche[] => {
        const { branches: brancheIds = [] } = ondernemer.voorkeur || {};

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
        // Merge de vaste plaatsen van deze ondernemer...
        const vastePlaatsen = Ondernemer.getVastePlaatsen(markt, ondernemer);
        // ...samen met hun verplaatsingsvoorkeuren. Sorteer aflopend op prioriteit...
        const voorkeuren = [
            ...(includeVastePlaatsen ? vastePlaatsen : []),
            ...markt.voorkeuren.filter(({ erkenningsNummer }) => erkenningsNummer === ondernemer.erkenningsNummer)
        ].sort(priorityCompare);
        // ...en elimineer duplicaten na sortering.
        return voorkeuren.reduce((unique, voorkeur) => {
            if (
                !~unique.findIndex(({ plaatsId }) => plaatsId === voorkeur.plaatsId) && (
                    includeVastePlaatsen ||
                    !~vastePlaatsen.findIndex(({ plaatsId }) => plaatsId === voorkeur.plaatsId)
                )
            ) {
                unique.push(voorkeur);
            }
            return unique;
        }, []);
    },

    getStartSize: (ondernemer: IMarktondernemer): number => {
        const { plaatsen = [] } = ondernemer;
        const { minimum = Infinity, maximum = Infinity } = ondernemer.voorkeur || {};
        return Math.min(plaatsen.length, minimum, maximum) || 1;
    },
    getTargetSize: (ondernemer: IMarktondernemer): number => {
        const { plaatsen = [] } = ondernemer;
        const { minimum = 1, maximum = 0 } = ondernemer.voorkeur || {};
        return maximum || Math.max(plaatsen.length, minimum, 1);
    },

    getVastePlaatsen: (
        markt: IMarkt,
        ondernemer: IMarktondernemer
    ): IPlaatsvoorkeur[] => {
        const { plaatsen = [] } = ondernemer;
        return plaatsen.map(plaatsId => ({
            plaatsId,
            erkenningsNummer: ondernemer.erkenningsNummer,
            marktId: markt.marktId,
            priority: 0
        }));
    },

    heeftBranche: (ondernemer: IMarktondernemer): boolean => {
        const { branches: brancheIds = [] } = ondernemer.voorkeur || {};
        return !!brancheIds.length;
    },

    heeftEVI: (ondernemer: IMarktondernemer): boolean => {
        const { verkoopinrichting = [] } = ondernemer.voorkeur || {};
        return !!verkoopinrichting.length;
    },

    heeftVastePlaats: (
        ondernemer: IMarktondernemer,
        plaats: IMarktplaats
    ): boolean => {
        if (!ondernemer.plaatsen) {
            return false;
        }
        return !!ondernemer.plaatsen.find(plaatsId => plaatsId === plaats.plaatsId);
    },

    heeftVastePlaatsen: (ondernemer: IMarktondernemer): boolean => {
        return Ondernemer.isVast(ondernemer) &&
               ondernemer.plaatsen &&
               ondernemer.plaatsen.length > 0;
    },

    isInBranche: (
        ondernemer: IMarktondernemer,
        branche: IBranche
    ): boolean => {
        const { branches: brancheIds = [] } = ondernemer.voorkeur || {};
        return brancheIds.includes(branche.brancheId);
    },

    isInMaxedOutBranche: (
        indeling: IMarktindeling,
        ondernemer: IMarktondernemer
    ): boolean => {
        const branches = Ondernemer.getBranches(indeling, ondernemer);

        // For each branche this ondernemer is in, find out if it has already
        // exceeded the maximum amount of toewijzingen or the maximum amount
        // of plaatsen.
        return !!branches.find(branche => {
            const { maximumToewijzingen, maximumPlaatsen } = branche;
            const brancheToewijzingen = indeling.toewijzingen.filter(({ ondernemer }) =>
                Ondernemer.isInBranche(ondernemer, branche)
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

    wantsExpansion: (toewijzing: IToewijzing): boolean => {
        const { ondernemer, plaatsen } = toewijzing;
        const targetSize               = Ondernemer.getTargetSize(ondernemer);
        const currentSize              = plaatsen.length;
        return currentSize < targetSize;
    } ,

    wantsToMove: (
        indeling: IMarktindeling,
        ondernemer: IMarktondernemer
    ): boolean => {
        const voorkeuren = Ondernemer.getPlaatsVoorkeuren(indeling, ondernemer, false);
        return !!voorkeuren.length;
    }
};

export default Ondernemer;
