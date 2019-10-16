module.exports = {

  async up(queryInterface, Sequelize) {

    const transaction = await queryInterface.sequelize.transaction();

    function stripErkenningsNummerFromDots(tabel){
      console.log(`querying ${tabel}`);
      return queryInterface.sequelize.query(`SELECT * FROM ${tabel} WHERE "erkenningsNummer" LIKE '%.%'`, {
        type: queryInterface.sequelize.QueryTypes.SELECT
      }, transaction)
      .then(voorkeuren => {
        // let voorkeurenPromises = [];
        return voorkeuren.map( voorkeur => {
          return queryInterface.bulkUpdate(tabel, {
            erkenningsNummer: voorkeur.erkenningsNummer.replace(".", "")
          }, {
            id: voorkeur.id
          }, { transaction });
        })
      })
      .catch(e => {
        console.log(e);
      })
    }
    
    try {

      let changes = await stripErkenningsNummerFromDots('voorkeur')
      console.log(`Changes done: ${changes.length}`);

      let changesAllocation = await stripErkenningsNummerFromDots('allocation')
      console.log(`Changes done: ${changesAllocation.length}`);

      let changesPlaatsvoorkeur = await stripErkenningsNummerFromDots('plaatsvoorkeur')
      console.log(`Changes done: ${changesPlaatsvoorkeur.length}`);

      let changesRSVP = await stripErkenningsNummerFromDots('rsvp')
      console.log(`Changes done: ${changesRSVP.length}`);

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {

  },

};

