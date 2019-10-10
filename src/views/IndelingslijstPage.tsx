import * as React from 'react';
import PropTypes, { ValidationMap } from 'prop-types';
import MarktDetailBase from './components/MarktDetailBase';
import { ondernemersToLocatieKeyValue, obstakelsToLocatieKeyValue } from '../domain-knowledge.js';
import { arrayToObject } from '../util';
import IndelingslijstGroup from './components/IndelingslijstGroup';
import PrintPage from './components/PrintPage';
import Street from './components/Street';
import { IRSVP, IMarktplaats, IMarktondernemer, IToewijzing, IMarkt, IObstakelBetween } from '../markt.model';
import { IAllocationPrintout } from '../model/printout.model';

export type IndelingslijstenPageState = {
    aanmeldingen: IRSVP[];
    obstakels: IObstakelBetween[];
    marktplaatsen: IMarktplaats[];
    ondernemers: IMarktondernemer[];
    paginas: IAllocationPrintout;
    toewijzingen: IToewijzing[];
    markt: IMarkt;
    voorkeuren: any[];
    marktId: string;
    datum: string;
    type: string;
};

export default class IndelingslijstenPage extends React.Component {
    public propTypes: ValidationMap<IndelingslijstenPageState> = {
        aanmeldingen: PropTypes.array,
        obstakels: PropTypes.array,
        marktplaatsen: PropTypes.array,
        ondernemers: PropTypes.array,
        paginas: PropTypes.array,
        toewijzingen: PropTypes.array,
        markt: PropTypes.any,
        voorkeuren: PropTypes.array,
        marktId: PropTypes.string,
        datum: PropTypes.string,
        type: PropTypes.string,
    };

    public render() {

        const props = this.props as IndelingslijstenPageState;
        const { aanmeldingen, obstakels, marktplaatsen, ondernemers, paginas, markt, voorkeuren, datum, type } = props;
        let { toewijzingen } = props;
        const plaatsList = arrayToObject(marktplaatsen, 'plaatsId');
        const vphl = ondernemersToLocatieKeyValue(ondernemers);
        const obstakelList = obstakelsToLocatieKeyValue(obstakels);

        const titleMap: { [index: string]: string } = {
            indelingslijst: 'Indelingslijst',
            indeling: 'Indeling',
            'concept-indelingslijst': 'Concept indelingslijst',
        };
        const title = titleMap[type] || titleMap['indelingslijst'];

        toewijzingen = type !== 'wenperiode' ? toewijzingen : [];

        const plaatsvoorkeuren = voorkeuren.reduce((t: any, voorkeur: any) => {
            if (!t[voorkeur.erkenningsNummer]) {
                t[voorkeur.erkenningsNummer] = [];
            }
            t[voorkeur.erkenningsNummer].push(voorkeur);

            return t;
        }, {});

        return (
            <MarktDetailBase
                bodyClass="page-markt-indelingslijst page-print"
                title={title}
                markt={markt}
                type={type}
                datum={datum}
                showDate={true}
            >
                {paginas.map((page, j) => (
                    <PrintPage
                        key={`page-${j}`}
                        index={j}
                        title={`${title} ${markt.naam}`}
                        label={page.title}
                        datum={datum}
                    >
                        {page.indelingslijstGroup.map((pageItem, i) => {
                            if (pageItem.type && pageItem.type === 'street') {
                                return <Street key={`page-street-${i}`} title={pageItem.title} />;
                            } else {
                                return (
                                        <IndelingslijstGroup
                                            key={`page-group-${i}`}
                                            page={pageItem}
                                            plaatsList={plaatsList}
                                            vphl={vphl}
                                            obstakelList={obstakelList}
                                            aanmeldingen={aanmeldingen}
                                            toewijzingen={toewijzingen}
                                            ondernemers={ondernemers}
                                            markt={markt}
                                            datum={datum}
                                            type={type}
                                            plaatsvoorkeuren={plaatsvoorkeuren}
                                        />
                                );
                            }
                        })}
                    </PrintPage>
                ))}
            </MarktDetailBase>
        );
    }
}
