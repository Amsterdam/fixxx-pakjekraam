const { validate } = require('jsonschema');
const OPTIONS = {
  throwError   : false,
  propertyName : 'DATA'
};

module.exports = {
  MarketBranches(index, data) {
    return validate(data, {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          'brancheId': { type: 'string', required: true },
          'description': { type: 'string', required: true },
          'color': { type: 'string', required: true },
          'number': { type: 'number' },
          'verplicht': { type: 'boolean', required: false },
          'maximumPlaatsen': { type: 'number', minimum: 1 },
          'maximumToewijzingen': { type: 'number', minimum: 1 }
        },
        additionalProperties: false
      }
    }, OPTIONS);
  },

  MarketGeografie(index, data) {
    return validate(data, {
      type: 'object',
      properties: {
        'obstakels': {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              'kraamA': { type: 'string', required: true },
              'kraamB': { type: 'string', required: true },
              'obstakel': {
                type: 'array',
                items: {
                  type: 'string',
                  enum: index.obstakelTypes
                },
                required: true
              }
            },
            additionalProperties: false
          }
        }
      }
    }, OPTIONS);
  },

  MarketLocaties(index, data) {
    return validate(data, {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          'plaatsId': { type: 'string', required: true },
          'inactive': { type: 'boolean' },
          'branches': {
            type: 'array',
            items: {
              type: 'string',
              enum: index.branches
            }
          },
          'verkoopinrichting' : {
            type: 'array',
            items: {
              type: 'string',
              enum: ['eigen-materieel']
            }
          },
          'properties': {
            type: 'array',
            items: {
              type: 'string',
              enum: index.plaatsEigenschappen
            }
          },
          'tags': { type: 'array' }
        },
        additionalProperties: false
      }
    }, OPTIONS);
  },

  Market(index, data) {
    return validate(data, {
      type: 'object',
      additionalProperties: false,
      properties: {
        'expansionLimit': { type: 'number', minimum: 0 },
        'rows': {
          type: 'array',
          required: true,
          items: {
            type: 'array',
            minItems: 1,
            items: { type: 'string' }
          }
        }
      }
    }, OPTIONS);
  },

  Paginas(index, data) {
    return validate(data, {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          'title': {
            type: 'string',
            required: true
          },
          'indelingslijstGroup': {
            type: 'array',
            required: true,
            items: {
              type: 'object',
              properties: {
                'class': { type: 'string' },
                'type': { type: 'string' },
                'title': { type: 'string' },
                'landmarkTop': { type: 'string' },
                'landmarkBottom': { type: 'string' },
                'plaatsList': {
                  type: 'array',
                  minItem: 1,
                  items: {
                    type: 'string'
                  }
                }
              }
            }
          }
        }
      }
    }, OPTIONS);
  }
};
