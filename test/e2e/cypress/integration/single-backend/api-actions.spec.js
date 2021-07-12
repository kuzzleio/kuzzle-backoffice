describe('API Actions - query', function() {
  const kuzzleUrl = 'http://localhost:7512'

  beforeEach(() => {
    // reset database and setup
    cy.request('POST', `${kuzzleUrl}/admin/_resetDatabase`)
    cy.request('POST', `${kuzzleUrl}/admin/_resetSecurity`)
    cy.initLocalEnv(Cypress.env('BACKEND_VERSION'))
  })

  it('Should be able to perform a query', () => {
    const indexName = 'testindex'
    cy.waitOverlay()
    cy.visit(`/#/api-action`)
    cy.get(
      '[data-cy="api-actions-query-JSONEditor-0"] textarea.ace_text-input'
    ).type(
      `{selectall}{backspace}{
"controller": "index",
"action": "create",
"index": "${indexName}"`,
      {
        delay: 200,
        force: true
      }
    )
    cy.get('[data-cy="api-actions-run-button-0"]').click()

    cy.wait(1000)

    cy.request('GET', `${kuzzleUrl}/${indexName}/_exists`).should(response => {
      expect(response.body.result).to.equals(true)
    })
  })

  it('Should display the query status and response', () => {
    const indexName = 'testindex'
    cy.waitOverlay()
    cy.visit(`/#/api-action`)
    cy.wait(500)
    cy.get(
      '[data-cy="api-actions-query-JSONEditor-0"] textarea.ace_text-input'
    ).type(
      `{selectall}{backspace}{
"controller": "index",
"action": "create",
"index": "${indexName}"`,
      {
        delay: 200,
        force: true
      }
    )
    cy.get('[data-cy="api-actions-run-button-0"]').click()

    cy.wait(1000)

    cy.get('[data-cy="api-actions-response-status-0"]').should('contain', '200')
    cy.get('[data-cy="api-actions-response-JSONEditor-0"]')
      .should('contain', '"error": null')
      .should('contain', '"action": "create"')
      .should('contain', '"controller": "index"')
      .should('contain', `"index": "${indexName}"`)
      .should('contain', '"status": 200')
  })

  it('Should be able to set query controller using input', () => {
    cy.waitOverlay()
    cy.visit(`/#/api-action`)
    cy.get('[data-cy="api-actions-controller-input-0"]').type('index')
    cy.get('[data-cy="api-actions-query-JSONEditor-0"]').should(
      'contain',
      '"controller": "index"'
    )
  })

  it('Should be able to set query action using input', () => {
    cy.waitOverlay()
    cy.visit(`/#/api-action`)
    cy.get('[data-cy="api-actions-action-input-0"]').type('create')
    cy.get('[data-cy="api-actions-query-JSONEditor-0"]').should(
      'contain',
      '"action": "create"'
    )
  })

  it('Should be able to get query controllers available as options', () => {
    cy.waitOverlay()
    cy.visit(`/#/api-action`)
    cy.get('#controllersList option').should('have.length.of.at.least', 1)
  })

  it('Should be able to get query actions available as options', () => {
    cy.waitOverlay()
    cy.visit(`/#/api-action`)
    cy.get('[data-cy="api-actions-controller-input-0"]').type('index')
    cy.get('#actionsList option').should('have.length.of.at.least', 1)
  })

  it('Should not display options if user has no rights (publicApi/openapi)', () => {
    cy.waitOverlay()
    cy.request({
      method: 'PUT',
      url: 'http://localhost:7512/roles/anonymous',
      body: {
        controllers: {
          '*': {
            actions: {
              '*': true
            }
          },
          server: {
            actions: {
              publicApi: false,
              openapi: false
            }
          }
        }
      }
    })
    cy.visit(`/#/api-action`)
    cy.get('#controllersList option').should('have.length', 0)
    cy.get('#actionsList option').should('have.length', 0)
  })
})

describe('API Actions - tabs and save', function() {
  const kuzzleUrl = 'http://localhost:7512'

  beforeEach(() => {
    // reset database and setup
    cy.request('POST', `${kuzzleUrl}/admin/_resetDatabase`)
    cy.request('POST', `${kuzzleUrl}/admin/_resetSecurity`)
    cy.initLocalEnv(Cypress.env('BACKEND_VERSION'))
  })

  it('Should be able to open a new tab', () => {
    cy.waitOverlay()
    cy.visit(`/#/api-action`)
    cy.get('ul[role="tablist"] li').should('have.length', 1)
    cy.get('[data-cy="api-actions-tab-plus"]').click()
    cy.get('ul[role="tablist"] li').should('have.length', 2)
  })

  it('Should persist query by tabs', () => {
    cy.waitOverlay()
    cy.visit(`/#/api-action`)
    cy.get(
      '[data-cy="api-actions-query-JSONEditor-0"] textarea.ace_text-input'
    ).type(`{selectall}{backspace}tab0`, {
      delay: 200,
      force: true
    })
    cy.get('[data-cy="api-actions-tab-plus"]').click()
    cy.get('[data-cy="api-actions-query-JSONEditor-1"]').should(
      'not.contain',
      'tab0'
    )
    cy.get('[data-cy="api-actions-tab-0"]').click()
    cy.get('[data-cy="api-actions-query-JSONEditor-0"]').should(
      'contain',
      'tab0'
    )
  })

  it('Should be able to save a new query', () => {
    const queryName = 'createIndexToto'
    const envName = 'valid'
    cy.clearLocalStorage('storedQueries')
    cy.waitOverlay()
    cy.visit(`/#/api-action`)
    cy.get(
      '[data-cy="api-actions-query-JSONEditor-0"] textarea.ace_text-input'
    ).type(
      `{selectall}{backspace}{
"controller": "index",
"action": "create",
"index": "toto"`,
      {
        delay: 200,
        force: true
      }
    )
    cy.get('[data-cy="api-actions-save-button-0"]').click()
    cy.get('[data-cy="api-actions-modal-name-input"]').type(
      `{selectall}{backspace}${queryName}`,
      {
        delay: 200,
        force: true
      }
    )
    cy.get('[data-cy="api-actions-modal-ok-button"]').click()
    cy.get(`[data-cy="api-actions-saved-query-${queryName}"]`)
    cy.window().then(window => {
      const storedQueries = JSON.parse(
        window.localStorage.getItem('storedQueries')
      )
      const queryIdx = storedQueries[envName].findIndex(
        e => e.name === queryName
      )
      expect(queryIdx).to.equals(0)
      expect(storedQueries[envName][queryIdx].query.controller).to.equals(
        'index'
      )
      expect(storedQueries[envName][queryIdx].query.action).to.equals('create')
      expect(storedQueries[envName][queryIdx].query.index).to.equals('toto')
    })
  })

  it('Should be able to open a saved query', () => {
    const envName = 'valid'
    const queryName = 'createIndexToto'
    const storedQueries = {
      [envName]: [
        {
          query: { controller: 'index', action: 'create', index: 'toto' },
          name: queryName
        }
      ]
    }
    localStorage.setItem('storedQueries', JSON.stringify(storedQueries))
    cy.waitOverlay()
    cy.visit(`/#/api-action`)

    cy.get(`[data-cy="api-actions-saved-query-${queryName}"]`).click()
    cy.get('[data-cy="api-actions-query-JSONEditor-1"]')
      .should('contain', '"controller": "index"')
      .should('contain', '"action": "create"')
      .should('contain', '"index": "toto"')
  })

  it('Should be able to run a saved query', () => {
    const envName = 'valid'
    const queryName = 'createIndexToto'
    const indexName = 'toto'
    const storedQueries = {
      [envName]: [
        {
          query: { controller: 'index', action: 'create', index: indexName },
          name: queryName
        }
      ]
    }
    localStorage.setItem('storedQueries', JSON.stringify(storedQueries))
    cy.waitOverlay()
    cy.visit(`/#/api-action`)

    cy.get(`[data-cy="api-actions-saved-query-${queryName}"]`).click()
    cy.get('[data-cy="api-actions-run-button-1"]').click()

    cy.wait(1000)

    cy.request('GET', `${kuzzleUrl}/${indexName}/_exists`).should(response => {
      expect(response.body.result).to.equals(true)
    })
  })

  it('Should be able to edit a saved query', () => {
    const envName = 'valid'
    const queryName = 'createIndexToto'
    const indexName = 'toto'
    const indexName2 = 'titi'
    const storedQueries = {
      [envName]: [
        {
          query: { controller: 'index', action: 'create', index: indexName },
          name: queryName
        }
      ]
    }
    localStorage.setItem('storedQueries', JSON.stringify(storedQueries))
    cy.waitOverlay()
    cy.visit(`/#/api-action`)

    cy.get(`[data-cy="api-actions-saved-query-${queryName}"]`).click()

    cy.get(
      '[data-cy="api-actions-query-JSONEditor-1"] textarea.ace_text-input'
    ).type(
      `{selectall}{backspace}{
"controller": "index",
"action": "create",
"index": "${indexName2}"`,
      {
        delay: 200,
        force: true
      }
    )
    cy.get('[data-cy="api-actions-save-button-1"]').click()

    cy.window().then(window => {
      const storedQueries = JSON.parse(
        window.localStorage.getItem('storedQueries')
      )
      const queryIdx = storedQueries[envName].findIndex(
        e => e.name === queryName
      )
      expect(storedQueries[envName][queryIdx].query.index).to.equals(indexName2)
    })
  })

  it('Should be able to persist saved queries by environment', () => {
    const envName = 'valid'
    const envName2 = 'valid2'
    const queryName = 'createIndexToto'
    const queryName2 = 'createIndexTiti'
    const indexName = 'toto'
    const indexName2 = 'titi'
    const backendVersion = Cypress.env('BACKEND_VERSION') || 2
    const storedQueries = {
      [envName]: [
        {
          query: { controller: 'index', action: 'create', index: indexName },
          name: queryName
        }
      ],
      [envName2]: [
        {
          query: { controller: 'index', action: 'create', index: indexName2 },
          name: queryName2
        }
      ]
    }
    localStorage.setItem('storedQueries', JSON.stringify(storedQueries))
    localStorage.setItem(
      'environments',
      JSON.stringify({
        [envName]: {
          name: envName,
          color: 'darkblue',
          host: 'localhost',
          ssl: false,
          port: 7512,
          backendMajorVersion: backendVersion,
          token: null
        },
        [envName2]: {
          name: envName2,
          color: 'darkblue',
          host: 'localhost',
          ssl: false,
          port: 7512,
          backendMajorVersion: backendVersion,
          token: null
        }
      })
    )
    cy.waitOverlay()
    cy.visit(`/#/login`)
    cy.get('[data-cy="EnvironmentSwitch"]').click()
    cy.get(
      `[data-cy="EnvironmentSwitch-env_${envName}"]  > .EnvironmentSwitch-env-name`
    ).click({
      force: true
    })
    cy.get('[data-cy="LoginAsAnonymous-Btn"]').click()
    cy.visit(`/#/api-action`)
    cy.get(`[data-cy="api-actions-saved-query-${queryName}"]`)

    cy.visit(`/#/login`)
    cy.get('[data-cy="EnvironmentSwitch"]').click()
    cy.get(
      `[data-cy="EnvironmentSwitch-env_${envName2}"]  > .EnvironmentSwitch-env-name`
    ).click({
      force: true
    })
    cy.get('[data-cy="LoginAsAnonymous-Btn"]').click()
    cy.visit(`/#/api-action`)
    cy.get(`[data-cy="api-actions-saved-query-${queryName2}"]`)
  })

  it('Should be able to export queries', () => {
    const envName = 'valid'
    const queryName = 'createIndexToto'
    const indexName = 'toto'
    const storedQueries = {
      [envName]: [
        {
          query: { controller: 'index', action: 'create', index: indexName },
          name: queryName
        }
      ]
    }

    const exportedQueries = [
      {
        query: { controller: 'index', action: 'create', index: indexName },
        name: queryName
      }
    ]
    localStorage.setItem('storedQueries', JSON.stringify(storedQueries))
    cy.waitOverlay()
    cy.visit(`/#/api-action`)

    cy.get('[data-cy="button-export-api-actions"]').click()

    cy.get(
      `[data-cy="modal-export-action-checkbox-${envName}-${storedQueries[envName][0].name}"]`
    ).check({ force: true })

    cy.wait(1000)

    cy.get('[data-cy="modal-button-export-action"]').should(
      'have.attr',
      'download',
      `APIActions.json`
    )

    cy.get('[data-cy="modal-button-export-action"]')
      .then(
        anchor =>
          new Cypress.Promise(resolve => {
            const xhr = new XMLHttpRequest()
            xhr.open('GET', anchor.prop('href'), true)
            xhr.responseType = 'blob'
            xhr.onload = () => {
              if (xhr.status === 200) {
                const blob = xhr.response
                const reader = new FileReader()
                reader.onload = () => {
                  resolve(JSON.parse(reader.result))
                }
                reader.readAsText(blob)
              }
            }
            xhr.send()
          })
      )
      .should('equal', JSON.stringify(exportedQueries))
  })

  it('Should be able to import queries', () => {
    const envName = 'valid'
    const storedQueries = {
      [envName]: []
    }

    localStorage.setItem('storedQueries', JSON.stringify(storedQueries))
    cy.waitOverlay()
    cy.visit(`/#/api-action`)

    cy.get('[data-cy="button-import-api-actions"]').click()
    cy.wait(1000)

    cy.get('[data-cy="import-api-actions-file-input"]').attachFile(
      'APIActions.json'
    )

    cy.get('[data-cy="modal-button-import-action"]').click()

    cy.get(`[data-cy="api-actions-saved-query-queryName"]`).should('exist')
  })

  it.only('Should be able to import queries and change query name', () => {
    const envName = 'valid'
    const storedQueries = {
      [envName]: []
    }

    localStorage.setItem('storedQueries', JSON.stringify(storedQueries))
    cy.waitOverlay()
    cy.visit(`/#/api-action`)

    cy.get('[data-cy="button-import-api-actions"]').click()
    cy.wait(1000)

    cy.get('[data-cy="import-api-actions-file-input"]').attachFile(
      'APIActions.json'
    )

    cy.get('[data-cy="imported-action-name-editor-0"]').type(
      `{selectall}{backspace}changedQueryName`
    )

    cy.get('[data-cy="modal-button-import-action"]').click()

    cy.get(`[data-cy="api-actions-saved-query-queryName"]`).should('not.exist')
    cy.get(`[data-cy="api-actions-saved-query-changedQueryName"]`).should(
      'exist'
    )
  })
})
