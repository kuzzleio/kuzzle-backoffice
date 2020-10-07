describe('Collection management', function() {
  const kuzzleUrl = 'http://localhost:7512'
  const indexName = 'testindex'
  const collectionName = 'testcollection'

  beforeEach(() => {
    // reset database and setup
    cy.request('POST', `${kuzzleUrl}/admin/_resetDatabase`)
    cy.request('POST', `${kuzzleUrl}/${indexName}/_create`)

    cy.initLocalEnv(Cypress.env('BACKEND_VERSION'))
  })

  it('Should render a visual feedback and prevent submitting when input is not valid', () => {
    cy.waitOverlay()
    cy.visit(`/#/data/${indexName}/create`)
    cy.contains('Create a new collection')

    cy.get('[data-cy="CollectionCreateOrUpdate-name"] input').type(' ', {
      force: true
    })

    cy.get(
      '[data-cy="CollectionCreateOrUpdate-name"] .invalid-feedback'
    ).should('contain', 'The name you entered is invalid')

    cy.get('[data-cy="CollectionCreateOrUpdate-name"] input').type(
      '{selectall}{backspace}',
      {
        force: true
      }
    )

    cy.get(
      '[data-cy="CollectionCreateOrUpdate-name"] .invalid-feedback'
    ).should('contain', 'Please fill-in a valid collection name')

    cy.get('[data-cy="CollectionCreateOrUpdate-submit"]').click()
    cy.wait(1000)
    cy.location().should(location => {
      expect(location.hash).to.equal(`#/data/${indexName}/create`)
    })

    cy.get('[data-cy="CollectionCreateOrUpdate-name"] input').type(
      '{selectall}validcoll',
      {
        force: true
      }
    )

    cy.get('[data-cy="JSONEditor"] .ace_line')
      .contains('{')
      .click({ force: true })

    cy.get('[data-cy="JSONEditor"] textarea.ace_text-input')
      .should('be.visible')
      .type('{selectall}{backspace}', { delay: 200, force: true })
      .type(`SuM UNV4L1d jayZON Kood`)

    cy.get('[data-cy="CollectionCreateOrUpdate-submit"]').click()
    cy.wait(1000)
    cy.location().should(location => {
      expect(location.hash).to.equal(`#/data/${indexName}/create`)
    })
  })

  it('Should be able to create a collection and access it', function() {
    cy.visit(`/#/data/${indexName}/create`)
    cy.wait(1000)

    cy.get('.CollectionCreate').should('be.visible')

    cy.get('[data-cy="CollectionCreateOrUpdate-name"]').click({ force: true })
    cy.get('[data-cy="CollectionCreateOrUpdate-name"]').type(collectionName)
    cy.get('[data-cy="CollectionCreateOrUpdate-submit"]').click({
      force: true
    })
    cy.get(`[data-cy="CollectionList-name--${collectionName}"]`).click({
      force: true
    })
    cy.contains(collectionName)
  })

  it('Should be able to update a collection', function() {
    cy.request('PUT', `${kuzzleUrl}/${indexName}/${collectionName}`, {
      dynamic: 'true'
    })
    cy.visit(`/#/data/${indexName}/${collectionName}/edit`)
    cy.contains(collectionName)

    cy.get('[data-cy="JSONEditor"] textarea.ace_text-input')
      .should('be.visible')
      .type('{selectall}{backspace}', { delay: 200, force: true })
      .type(
        `{
"firstName": {
"type": "keyword"`,
        {
          force: true
        }
      )
    cy.get('[data-cy=CollectionCreateOrUpdate-submit]').click()
    cy.get(`[data-cy="CollectionList-edit--${collectionName}"]`).click()
    cy.get('[data-cy="JSONEditor"]')
      .should('contain', '"firstName": {')
      .should('contain', '"type": "keyword"')
  })

  it('Should be able to clear a collection', () => {
    const documentId = 'newDoc'
    cy.request('PUT', `${kuzzleUrl}/${indexName}/${collectionName}`, {
      dynamic: 'true'
    })
    cy.request(
      'POST',
      `${kuzzleUrl}/${indexName}/${collectionName}/${documentId}/_create`,
      {
        message: '...in a bottle...'
      }
    )
    cy.wait(1000)
    cy.visit(`/#/data/${indexName}/${collectionName}`)
    cy.contains(documentId)
    cy.get('[data-cy="CollectionDropdownAction"]').click()
    cy.get('[data-cy="CollectionDropdown-clear"]').click()
    cy.get('[data-cy="CollectionClearModal-collectionName"]').type(
      collectionName
    )
    cy.get('[data-cy="CollectionClearModal-submit"]').click()
    cy.contains('This collection is empty')
  })

  it('Should be able to delete a stored collection from the collection list', function() {
    cy.skipOnBackendVersion(1)

    cy.request('PUT', `${kuzzleUrl}/${indexName}/${collectionName}`)

    cy.visit(`/#/data/`)
    cy.wait(1000)
    cy.visit(`/#/data/${indexName}/`)
    cy.contains(indexName)

    cy.get(`[data-cy="CollectionList-delete--${collectionName}"]`).click()
    cy.get('[data-cy="DeleteCollectionModal-confirm"]').type(collectionName)
    cy.get('[data-cy="DeleteCollectionModal-OK"]').click()

    cy.get('[data-cy="CollectionList-table"]').should(
      'not.contain',
      collectionName
    )
  })

  it('Should be able to delete a stored collection from its own dropdown action', function() {
    cy.skipOnBackendVersion(1)

    cy.request('PUT', `${kuzzleUrl}/${indexName}/${collectionName}`)

    cy.visit(`/#/data/${indexName}/${collectionName}`)
    cy.wait(500)
    cy.contains(collectionName)
    cy.get('[data-cy="CollectionDropdownAction"]').click()
    cy.wait(500)
    cy.get('[data-cy="CollectionDropdown-delete"]').click()
    cy.get('[data-cy="DeleteCollectionModal-confirm"]').type(collectionName)
    cy.get('[data-cy="DeleteCollectionModal-OK"]').click()

    cy.get('[data-cy="CollectionList-table"]').should(
      'not.contain',
      collectionName
    )
  })

  it('Should disable delete stored collections for Kuzzle v1', () => {
    cy.skipUnlessBackendVersion(1)
    cy.waitForService(`http://localhost:7512`)
    cy.request('PUT', `${kuzzleUrl}/${indexName}/${collectionName}`)

    cy.visit(`/#/data/`)
    cy.wait(500)
    cy.visit(`/#/data/${indexName}/`)
    cy.contains(indexName)
    cy.get(`[data-cy="CollectionList-delete--${collectionName}"]`).should(
      'not.exist'
    )
    cy.visit(`/#/data/${indexName}/${collectionName}`)
    cy.contains(collectionName)
    cy.get('[data-cy="CollectionDropdownAction"]').click()
    cy.get('[data-cy="CollectionDropdown-delete"]').should('not.exist')
  })

  it('Should be able to fetch collections when index change', function() {
    cy.request('POST', `${kuzzleUrl}/anotherindex/_create`)
    cy.request('PUT', `${kuzzleUrl}/anotherindex/foo`)

    cy.visit(`/#/data/`)
    cy.wait(500)
    cy.visit(`/#/data/${indexName}/`)
    cy.contains(indexName)
    cy.get('[data-cy="Treeview-item-index--anotherindex"]').click()
    cy.get('[data-cy="CollectionList-table"]').contains('foo')
  })

  it('Should be able to autofocus collection search', () => {
    cy.request('PUT', `${kuzzleUrl}/${indexName}/${collectionName}`)
    cy.request('PUT', `${kuzzleUrl}/${indexName}/foobar`)

    cy.waitOverlay()

    cy.visit(`/#/data/${indexName}/`)
    cy.wait(900)

    cy.get('body').type('f{enter}')

    cy.url().should('contain', 'foobar')
    cy.contains('foobar')
    cy.contains('This collection is empty')
  })
})
