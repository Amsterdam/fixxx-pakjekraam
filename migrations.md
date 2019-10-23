## Migrations
Migrations in this project are implemented with Sequelize.

### Creating a new table
`npx sequelize-cli model:generate --name afwijzing --attributes marktId:integer,marktDate:string,erkenningsNummer:integer,reasonCode:integer`

### Creating a migration
`npx sequelize-cli migration:generate --name "remove days from marktVoorkeuren"`

### Running migration
`npx sequelize-cli db:migrate`

### Undo a migration
`npx sequelize-cli db:migrate:undo`

### Documengtation migrations
- Source: https://sequelize.org/master/manual/migrations.html
- Info for our case http://bitsandbites.me/blog/2014/06/24/sequelize-migrations-mid-project/
- Stackoverflow about generating migrations mid project https://stackoverflow.com/questions/27835801/how-to-auto-generate-migrations-with-sequelize-cli-from-sequelize-models

