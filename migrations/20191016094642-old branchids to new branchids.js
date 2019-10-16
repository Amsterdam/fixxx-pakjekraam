module.exports = {

  async up(queryInterface, Sequelize) {

    const transaction = await queryInterface.sequelize.transaction();

    function oldBranchIdsToNew(tabel) {
      console.log(`querying ${tabel}`);
      return queryInterface.sequelize.query(`SELECT * FROM ${tabel} WHERE "brancheId" IS NOT NULL`, {
        type: queryInterface.sequelize.QueryTypes.SELECT
      }, transaction)
        .then(voorkeuren => {
          let promises = [];
          voorkeuren.map(voorkeur => {

            let newBrancheId = null;
            switch (voorkeur.brancheId) {
              case '1':
                newBrancheId = '103-brood-banket';
                break;
              case 'agf':
                newBrancheId = '101-agf-exotische-groenten';
                break;
              case 'exo-groente':
                newBrancheId = '101-agf-exotische-groenten';
                break;
              case '15':
                newBrancheId = '102-bio-health-fairtrade';
                break;
              case '10':
                newBrancheId = '104-hummus-kruiden-olijven';
                break;
              case '9':
                newBrancheId = '105-noten-zuidvruchten';
                break;
              case 'zui':
                newBrancheId = '105-noten-zuidvruchten';
                break;
              case 'natte-vis':
                newBrancheId = '107-vis-nat';
                break;
              case '2':
                newBrancheId = '108-vleeswaren';
                break;
              case '4':
                newBrancheId = '109-zuivel-poelier-eieren';
                break;
              case 'kip':
                newBrancheId = '109-zuivel-poelier-eieren';
                break;
              case 'kaas':
                newBrancheId = '109-zuivel-poelier-eieren';
                break;
              case '5':
                newBrancheId = '203-ijs';
                break;
              case '12':
                newBrancheId = '206-oudhollands-gebak-snoepwaren';
                break;
              case 'patat':
                newBrancheId = '207-patat-snacks';
                break;
              case '6':
                newBrancheId = '209-vis-gebakken';
                break;
              case '26':
                newBrancheId = '301-antiek-kunst';
                break;
              case '34':
                newBrancheId = '302-bloemen-planten';
                break;
              case 'blm':
                newBrancheId = '302-bloemen-planten';
                break;
              case '25':
                newBrancheId = '303-boeken';
                break;
              case '30':
                newBrancheId = '304-dierenbijnodigdheden';
                break;
              case 'horloges':
                newBrancheId = '305-horloges-brillen-sieraden';
                break;
              case '28':
                newBrancheId = '306-huishoudelijke-artikelen-meubels-apparatuur';
                break;
              case '21':
                newBrancheId = '307-kleding-baby-kinder';
                break;
              case '20':
                newBrancheId = '308-kleding-onder-beenmode-sokken';
                break;
              case 'sokken':
                newBrancheId = '308-kleding-onder-beenmode-sokken';
                break;
              case '19':
                newBrancheId = '309-kleding-volwassenen';
                break;
              case '22':
                newBrancheId = '310-kleding-vintage';
                break;
              case '33':
                newBrancheId = '311-lampen';
                break;
              case '16':
                newBrancheId = '313-parfumerie-drogisterij-persoonlijke-verzorging';
                break;
              case '35':
                newBrancheId = '314-partijhandel';
                break;
              case 'schoenen':
                newBrancheId = '315-schoenen-tassen-lederwaren';
                break;
              case '27':
                newBrancheId = '317-speelgoed-spellen';
                break;
              case '32':
                newBrancheId = '318-doe-het-zelf-gereedschap-ijzerwaren';
                break;
              case '29':
                newBrancheId = '319-elektronica-mobieltjes-accessoires';
                break;
              case '31':
                newBrancheId = '320-fietsen-auto-accessoires';
                break;
              case 'stoffen':
                newBrancheId = '321-stoffen-textiel-fornituren';
                break;
              case 'experimentele-zone':
                newBrancheId = '401-experimentele-zone';
                break;
              case 'standwerker':
                newBrancheId = '402-promotieplaats';
                break;
              case 'promo':
                newBrancheId = '403-standwerker';
                break;
              default:
                console.log(`Branche with id ${voorkeur.brancheId} not found`);
            }

            console.log(voorkeur);
            console.log(newBrancheId);

            let promise = queryInterface.bulkUpdate(tabel, {
              brancheId: voorkeur.id
            }, voorkeur.id, { transaction });
            promises.push(promise);

          })
          return Promise.all(promises);
        })
        .catch(e => {
          console.log(e);
        })
    }

    try {
      let changes = await oldBranchIdsToNew('voorkeur')
      console.log(`Changes done: ${changes.length}`);
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {

  },

};

