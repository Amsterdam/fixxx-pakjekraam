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
    data: {
        aanmeldingen: IRSVP[];
        obstakels: IObstakelBetween[];
        marktplaatsen: IMarktplaats[];
        ondernemers: IMarktondernemer[];
        paginas: IAllocationPrintout;
        toewijzingen: IToewijzing[];
        markt: IMarkt;
    };
    marktSlug: string;
    marktId: string;
    datum: string;
    type: string;
    user: any;
};

export default class IndelingslijstenPage extends React.Component {
    public propTypes: ValidationMap<IndelingslijstenPageState> = {
        data: PropTypes.any,
        marktSlug: PropTypes.string,
        marktId: PropTypes.string,
        datum: PropTypes.string,
        type: PropTypes.string,
        user: PropTypes.any,
    };

    public render() {
        const props = this.props as IndelingslijstenPageState;
        const { aanmeldingen, obstakels, marktplaatsen, ondernemers, paginas, toewijzingen, markt } = props.data;
        const { datum, type, user } = props;
        const plaatsList = arrayToObject(marktplaatsen, 'plaatsId');
        const vphl = ondernemersToLocatieKeyValue(ondernemers);
        const obstakelList = obstakelsToLocatieKeyValue(obstakels);

        const titleMap: { [index: string]: string } = {
            indelingslijst: 'Indelingslijst',
            'concept-indelingslijst': 'Concept indelingslijst',
        };
        const title = titleMap[type] || titleMap['indelingslijst'];

        console.log(toewijzingen);

        return (
            <MarktDetailBase
                bodyClass="page-markt-indelingslijst page-print"
                title={title}
                markt={markt}
                type={type}
                datum={datum}
                user={user}
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
