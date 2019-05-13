const albertCuyp = fetch('../data.json').then(response => response.json());


Promise.all([albertCuyp]).then(args => {
    let [markt] = args;

    markt = simulateAanmeldingen(markt);

    console.time(`Berekenen looplijst`);
    markt.toewijzingen = calcToewijzingen(markt);
    console.timeEnd(`Berekenen looplijst`);

    renderLooplijst(markt);

    renderSollicitanten(markt);
});
