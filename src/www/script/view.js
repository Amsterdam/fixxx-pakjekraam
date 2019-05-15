const renderIndelingslijst = markt => {
    document.title = markt.title;
    document.querySelector('h1').textContent = markt.title;

    const table = document.createElement('table');

    document.body.appendChild(table);

    markt.locaties.forEach(kraam => {
        const vph = markt.ondernemers.find(
            ondernemer => ondernemer.status === 'vpl' && ondernemer.locatie === kraam.locatie,
        );
        const vphAanwezig = !!vph && isAanwezig(markt.aanmeldingen, vph);
        const vphToewijzing = vph && markt.toewijzingen.find(toewijzing => toewijzing.ondernemer === vph.id);
        const vphToegewezen = !!vph && !!vphToewijzing && vph.locatie === vphToewijzing.locatie;

        const kraamToewijzing = markt.toewijzingen.find(toewijzing => toewijzing.kraam === kraam.locatie);
        const toegewezenOndernemer = kraamToewijzing
            ? markt.ondernemers.find(ondernemer => ondernemer.id === kraamToewijzing.ondernemer)
            : null;

        console.debug(
            `Kraam ${kraam.locatie}: ${vph ? 'vpl' : 'open'} ${vph ? (vphToegewezen ? 'aanwezig' : 'afwezig') : ''}`,
        );

        table.insertAdjacentHTML(
            'beforeend',
            `<tr class="${(kraam.tags || []).join(' ')}">
            <th>${kraam.locatie}</th>
            <td>
                ${
                    vph
                        ? `<input type="checkbox" name="aanmeldingen[]" value="${vph.id}" id="aanmelding-${vph.id}" ${
                              vphAanwezig ? 'checked' : ''
                          }>`
                        : ''
                }
            </td>
            <td>
                ${
                    vph
                        ? `<label for="aanmelding-${vph.id}">${
                              vphToewijzing && vph.locatie !== vphToewijzing.locatie
                                  ? `<s>${vph.description}</label></s> `
                                  : vph.description
                          }</label>`
                        : ''
                }
            </td>
            <td>
                ${
                    kraam.inactive
                        ? 'buiten gebruik'
                        : kraamToewijzing
                        ? `${toegewezenOndernemer.sollicitatieNummer} ${toegewezenOndernemer.description}`
                        : 'open'
                }
            </td>
            <td>${kraamToewijzing ? toegewezenOndernemer.status : ''}</td>
            <td>${kraam.branche || ''}</td>
        </tr>
        `,
        );
    });
};

const anceniteitSort = (a, b) => a.sollicitatieNummer - b.sollicitatieNummer;

const renderSollicitanten = markt => {
    const frag = document.createDocumentFragment();
    const header = frag.appendChild(document.createElement('h2'));

    header.textContent = 'Sollicitanten';

    const table = document.createElement('table');

    markt.ondernemers
        .filter(ondernemer => ondernemer.status === 'soll')
        .sort(anceniteitSort)
        .forEach(ondernemer => {
            const toewijzing = markt.toewijzingen.find(x => x.ondernemer === ondernemer.id);

            table.insertAdjacentHTML(
                'beforeend',
                `<tr>
                <td>
                    <input type="checkbox" name="aanmeldingen[]" value="${ondernemer.id}" id="aanmelding-${
                    ondernemer.id
                }" ${toewijzing ? 'checked' : ''}></td>
                <th>${ondernemer.sollicitatieNummer}</th>
                <td>
                    <label for="aanmelding-${ondernemer.id}">${ondernemer.description}</label>
                </td>
                <td>
                    ${toewijzing ? toewijzing.kraam : ''}
                </td>
            </tr>
            `,
            );
        });

    frag.appendChild(table);

    document.body.appendChild(frag);
};
