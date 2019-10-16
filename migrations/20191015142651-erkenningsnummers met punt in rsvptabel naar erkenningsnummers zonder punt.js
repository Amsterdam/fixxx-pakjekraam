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
          },voorkeur.id);
        })
      })
    }
    
    try {
      
      let changes = await stripErkenningsNummerFromDots('rsvp')
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

