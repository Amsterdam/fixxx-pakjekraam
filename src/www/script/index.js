const albertCuyp = fetch('../data.json').then(response => response.json());

Promise.all([albertCuyp]).then(args => {
    let [markt] = args;

    markt = simulateAanmeldingen(markt);

    console.time(`Berekenen indelingslijst`);
    markt.toewijzingen = calcToewijzingen(markt);
    console.timeEnd(`Berekenen indelingslijst`);

    renderIndelingslijst(markt);

    renderSollicitanten(markt);
});
