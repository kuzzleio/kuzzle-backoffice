<template>
  <div class="DocumentList">
    <b-container
      :class="{ 'DocumentList--containerFluid': listViewType !== 'list' }"
      class="DocumentList--container"
    >
      <b-row>
        <b-col>
          <headline>
            <span class="code" :title="collectionName">{{
              truncateName(collectionName, 20)
            }}</span>
          </headline>
        </b-col>
        <b-col sm="6" class="text-right mt-3">
          <b-button
            variant="primary"
            data-cy="CreateDocument-btn"
            :disabled="
              indexOrCollectionNotFound ||
                !canCreateDocument(indexName, collectionName)
            "
            :to="{
              name: 'CreateDocument',
              params: { indexName, collectionName }
            }"
            >Create New Document</b-button
          >
          <collection-dropdown-view
            class="icon-medium icon-black ml-2"
            :active-view="listViewType"
            :index="indexName"
            :collection="collectionName"
            :mappingAttributes="mappingAttributes"
            @list="onListViewClicked"
            @map="onMapViewClicked"
            @column="onColumnViewClicked"
            @time-series="onTimeSeriesClicked"
          />
          <collection-dropdown-action
            class="icon-medium icon-black ml-2"
            :indexName="indexName"
            :collectionName="collectionName"
            @delete-collection-clicked="showDeleteCollectionModal"
            @clear="afterCollectionClear"
          />
        </b-col>
      </b-row>

      <list-not-allowed
        v-if="
          !canSearchDocument(indexName, collectionName) && index && collection
        "
      />

      <template v-else>
        <template v-if="isCollectionEmpty">
          <realtime-only-empty-state
            v-if="isRealtimeCollection"
            :index="indexName"
            :collection="collectionName"
          />
          <no-geopoint-field-state v-else-if="hasGeopoints" />
          <empty-state v-else :index="indexName" :collection="collectionName" />
        </template>

        <template v-if="!isCollectionEmpty">
          <filters
            class="mb-3"
            :available-operands="searchFilterOperands"
            :collection="collectionName"
            :current-filter="currentFilter"
            :index="indexName"
            :mapping-attributes="mappingAttributes"
            @enter-pressed="navigateToDocument"
            @filters-updated="onFiltersUpdated"
            @submit="onFilterSubmit"
          />
        </template>
        <template>
          <template v-if="!isCollectionEmpty">
            <b-card
              class="light-shadow"
              :bg-variant="documents.length === 0 ? 'light' : 'default'"
            >
              <b-card-text class="p-0">
                <no-results-empty-state v-if="!documents.length" />
                <template v-else>
                  <List
                    v-if="listViewType === 'list'"
                    :all-checked="allChecked"
                    :collection="collectionName"
                    :documents="formattedDocuments"
                    :index="indexName"
                    :current-page-size="paginationSize"
                    :selected-documents="selectedDocuments"
                    :total-documents="totalDocuments"
                    @bulk-delete="onBulkDeleteClicked"
                    @change-page-size="changePaginationSize"
                    @checkbox-click="toggleSelectDocuments"
                    @delete="onDeleteClicked"
                    @refresh="onRefresh"
                    @toggle-all="onToggleAllClicked"
                  />

                  <Column
                    v-if="listViewType === 'column'"
                    :index="indexName"
                    :collection="collectionName"
                    :documents="documents"
                    :mapping="collectionMapping"
                    :selected-documents="selectedDocuments"
                    :all-checked="allChecked"
                    :current-page-size="paginationSize"
                    :total-documents="totalDocuments"
                    @edit="onEditClicked"
                    @delete="onDeleteClicked"
                    @bulk-delete="onBulkDeleteClicked"
                    @change-page-size="changePaginationSize"
                    @checkbox-click="toggleSelectDocuments"
                    @refresh="onRefresh"
                    @toggle-all="onToggleAllClicked"
                  />

                  <TimeSeries
                    v-if="listViewType === 'time-series'"
                    :index="indexName"
                    :collection="collectionName"
                    :documents="documents"
                    :mapping="collectionMapping"
                    :current-page-size="paginationSize"
                    :total-documents="totalDocuments"
                    @change-page-size="changePaginationSize"
                    @changeDisplayPagination="changeDisplayPagination"
                  />

                  <Map
                    v-if="listViewType === 'map'"
                    :selected-geopoint="selectedGeopoint"
                    :selectedGeoshape="selectedGeoshape"
                    :current-page-size="paginationSize"
                    :index="indexName"
                    :geoDocuments="geoDocuments"
                    :shapesDocuments="shapesDocuments"
                    :collection="collectionName"
                    :mappingGeopoints="mappingGeopoints"
                    :mappingGeoshapes="mappingGeoshapes"
                    @change-page-size="changePaginationSize"
                    @on-select-geopoint="onSelectGeopoint"
                    @on-select-geoshape="onSelectGeoshape"
                    @edit="onEditClicked"
                    @delete="onDeleteClicked"
                  />

                  <b-row
                    v-show="
                      totalDocuments > paginationSize && displayPagination
                    "
                    align-h="center"
                  >
                    <b-pagination
                      v-model="currentPage"
                      aria-controls="my-table"
                      class="m-2 mt-4"
                      data-cy="DocumentList-pagination"
                      :total-rows="totalDocuments"
                      :per-page="paginationSize"
                    ></b-pagination>
                  </b-row>
                  <div
                    v-if="totalDocuments > 10000"
                    class="text-center mt-2"
                    data-cy="DocumentList-exceedESLimitMsg"
                  >
                    <small class="text-secondary"
                      >Due to limitations imposed by Elasticsearch, you won't be
                      able to browse documents beyond 10000.</small
                    >
                  </div>
                </template>
              </b-card-text>
            </b-card>
          </template>
        </template>
      </template>
      <DeleteCollectionModal
        :index="index"
        :collection="collection"
        :modalId="modalDeleteId"
        @delete-successful="afterDeleteCollection"
      />
      <delete-modal
        id="modal-delete"
        :candidates-for-deletion="candidatesForDeletion"
        :is-loading="deleteModalIsLoading"
        @confirm="onDeleteConfirmed"
        @hide="resetCandidatesForDeletion"
      />
    </b-container>
  </div>
</template>

<script>
import _ from 'lodash'

import Column from './Views/Column'
import Map from './Views/Map'
import List from './Views/List'
import TimeSeries from './Views/TimeSeries'
import DeleteModal from './DeleteModal'
import EmptyState from './EmptyState'
import NoResultsEmptyState from './NoResultsEmptyState'
import NoGeopointFieldState from './NoGeopointFieldState.vue'
import RealtimeOnlyEmptyState from './RealtimeOnlyEmptyState'
import Filters from '../../Common/Filters/Filters'
import ListNotAllowed from '../../Common/ListNotAllowed'
import CollectionDropdownView from '../Collections/DropdownView'
import CollectionDropdownAction from '../Collections/DropdownAction'
import DeleteCollectionModal from '../Collections/DeleteCollectionModal'
import Headline from '../../Materialize/Headline'
import * as filterManager from '../../../services/filterManager'
import { extractAttributesFromMapping } from '../../../services/mappingHelpers'
import { truncateName, dateFromTimestamp } from '@/utils'
import { mapGetters } from 'vuex'

const LOCALSTORAGE_PREFIX = 'current-list-view'
const LIST_VIEW_LIST = 'list'
const LIST_VIEW_BOXES = 'boxes'
const LIST_VIEW_MAP = 'map'
const LIST_VIEW_COLUMN = 'column'
const LIST_VIEW_TIME_SERIES = 'time-series'

export default {
  name: 'DocumentsPage',
  components: {
    CollectionDropdownView,
    CollectionDropdownAction,
    DeleteCollectionModal,
    DeleteModal,
    Column,
    Map,
    List,
    TimeSeries,
    EmptyState,
    Headline,
    Filters,
    ListNotAllowed,
    NoResultsEmptyState,
    RealtimeOnlyEmptyState,
    NoGeopointFieldState
  },
  props: {
    indexName: String,
    collectionName: String
  },
  data() {
    return {
      loading: false,
      searchFilterOperands: filterManager.searchFilterOperands,
      selectedDocuments: [],
      documents: [],
      formattedDocuments: [],
      totalDocuments: 0,
      documentToDelete: null,
      currentFilter: new filterManager.Filter(),
      listViewType: LIST_VIEW_LIST,
      deleteModalIsOpen: false,
      deleteModalIsLoading: false,
      candidatesForDeletion: [],
      mappingGeopoints: [],
      selectedGeopoint: '',
      resultPerPage: [10, 25, 50, 100, 500],
      currentPage: 1,
      modalDeleteId: 'modal-collection-delete',
      displayPagination: true,
      mappingGeoshapes: [],
      selectedGeoshape: '',
      handledGeoShapesTypes: ['circle', 'polygon', 'multipolygon']
    }
  },
  computed: {
    ...mapGetters('kuzzle', ['wrapper']),
    ...mapGetters('auth', [
      'canSearchDocument',
      'canCreateDocument',
      'canDeleteDocument',
      'canEditDocument'
    ]),
    hasGeopoints() {
      return this.listViewType === 'map' && this.mappingGeopoints.length === 0
    },
    hasGeoshapes() {
      return this.listViewType === 'map' && this.mappingGeoshapes.length === 0
    },
    shapesDocuments() {
      return this.documents
        .filter(document => {
          const shape = this.getProperty(document, this.selectedGeoshape)
          return shape ? this.handledGeoShapesTypes.includes(shape.type) : false
        })
        .map(d => ({
          content: d[this.selectedGeoshape],
          source: d
        }))
    },
    geoDocuments() {
      return this.documents
        .filter(document => {
          const [lat, lng] = this.getCoordinates(document)
          const latFloat = parseFloat(lat)
          const lngFloat = parseFloat(lng)

          return !isNaN(latFloat) && !isNaN(lngFloat)
        })
        .map(d => ({
          coordinates: [
            this.getProperty(d, this.latFieldPath),
            this.getProperty(d, this.lngFieldPath)
          ],
          source: d
        }))
    },
    index() {
      return this.$store.direct.getters.index.getOneIndex(this.indexName)
    },
    collection() {
      return this.index
        ? this.$store.direct.getters.index.getOneCollection(
            this.index,
            this.collectionName
          )
        : null
    },
    collectionMapping() {
      return this.collection ? this.collection.mapping : null
    },
    indexOrCollectionNotFound() {
      return !this.index || !this.collection ? true : false
    },
    mappingAttributes() {
      return this.collectionMapping
        ? this.extractAttributesFromMapping(this.collectionMapping)
        : null
    },
    latFieldPath() {
      return `${this.selectedGeopoint}.lat`
    },
    lngFieldPath() {
      return `${this.selectedGeopoint}.lon`
    },
    isCollectionGeo() {
      return this.mappingGeopoints.length > 0 || this.mappingGeoshapes > 0
    },
    isDocumentListFiltered() {
      return this.currentFilter.active !== filterManager.NO_ACTIVE
    },
    isCollectionEmpty() {
      return !this.isDocumentListFiltered && this.totalDocuments === 0
    },
    allChecked() {
      if (!this.selectedDocuments || !this.documents) {
        return false
      }

      return this.selectedDocuments.length === this.documents.length
    },
    paginationFrom() {
      return parseInt(this.currentFilter.from) || 0
    },
    paginationSize() {
      return parseInt(this.currentFilter.size) || 25
    },
    isRealtimeCollection() {
      return this.collection ? this.collection.isRealtime() : false
    }
  },
  async mounted() {
    await this.loadAllTheThings()

    if (this.paginationFrom) {
      this.setCurrentPage()
    }
  },
  watch: {
    currentPage: {
      handler(value) {
        const from = (value - 1) * this.paginationSize
        this.onFiltersUpdated(
          Object.assign(this.currentFilter, {
            from
          })
        )
        this.fetchDocuments()
      }
    },
    collectionName: {
      handler() {
        this.loadAllTheThings()
      }
    },
    indexName: {
      handler() {
        this.loadAllTheThings()
      }
    },
    documents: {
      immediate: true,
      handler() {
        this.addHumanReadableDateFields()
      }
    }
  },
  methods: {
    extractAttributesFromMapping,
    truncateName,
    // VIEW MAP - GEOPOINTS
    // =========================================================================
    getCoordinates(document) {
      return [
        this.getProperty(document, this.latFieldPath),
        this.getProperty(document, this.lngFieldPath)
      ]
    },
    getProperty(object, path) {
      if (!object) {
        return object
      }

      const names = path.split('.')

      if (names.length === 1) {
        return object[names[0]]
      }

      return this.getProperty(object[names[0]], names.slice(1).join('.'))
    },
    onSelectGeopoint(selectedGeopoint) {
      this.selectedGeopoint = selectedGeopoint
    },
    onSelectGeoshape(selectedGeoshape) {
      this.selectedGeoshape = selectedGeoshape
    },
    listMappingGeopoints(mapping, path = []) {
      let attributes = []
      for (const [attributeName, { type, properties }] of Object.entries(
        mapping
      )) {
        if (properties) {
          if (properties.lat && properties.lon) {
            attributes = attributes.concat(path.concat(attributeName).join('.'))
          }

          attributes = attributes.concat(
            this.listMappingGeopoints(properties, path.concat(attributeName))
          )
        } else if (type === 'geo_point') {
          attributes = attributes.concat(path.concat(attributeName).join('.'))
        }
      }

      return attributes
    },
    listMappingGeoshapes(mapping, path = []) {
      let attributes = []
      for (const [attributeName, { type, properties }] of Object.entries(
        mapping
      )) {
        if (properties) {
          attributes = attributes.concat(
            this.listMappingGeoshapes(properties, path.concat(attributeName))
          )
        } else if (type === 'geo_shape') {
          attributes = attributes.concat(path.concat(attributeName).join('.'))
        }
      }

      return attributes
    },

    // CREATE
    // =========================================================================
    onCreateClicked() {
      this.$router.push({ name: 'CreateDocument' })
    },

    // DELETE
    // =========================================================================
    async onDeleteConfirmed(documentsToDelete) {
      this.deleteModalIsLoading = true
      try {
        await this.wrapper.performDeleteDocuments(
          this.indexName,
          this.collectionName,
          documentsToDelete
        )
        this.$bvModal.hide('modal-delete')
        this.resetCandidatesForDeletion()
        this.fetchDocuments()
        this.deleteModalIsLoading = false
        this.$bvModal.hide('documentsDeleteModal')
      } catch (e) {
        this.$log.error(e)
        this.$bvToast.toast(
          'The complete error has been printed to the console.',
          {
            title:
              'Ooops! Something went wrong while deleting the document(s).',
            variant: 'danger',
            toaster: 'b-toaster-bottom-right',
            appendToast: true
          }
        )
      }
    },
    resetCandidatesForDeletion() {
      this.candidatesForDeletion.splice(0, this.candidatesForDeletion.length)
    },
    onBulkDeleteClicked() {
      this.candidatesForDeletion = this.candidatesForDeletion.concat(
        this.selectedDocuments
      )
      this.$bvModal.show('modal-delete')
    },
    onDeleteClicked(id) {
      this.candidatesForDeletion.push(id)
      this.$bvModal.show('modal-delete')
    },
    onEditClicked(id) {
      this.$router.push({
        name: 'UpdateDocument',
        params: { id }
      })
    },

    // DELETE COLLECTION
    // =========================================================================
    showDeleteCollectionModal() {
      this.$bvModal.show(this.modalDeleteId)
    },
    afterDeleteCollection() {
      this.$router.push({
        name: 'Collections',
        params: { indexName: this.indexName }
      })
    },
    // LIST (FETCH & SEARCH)
    // =========================================================================
    async loadAllTheThings() {
      try {
        this.loading = true
        this.loadListView()
        this.saveListView()
        this.loadMappingInfo()

        this.currentFilter = filterManager.load(
          this.indexName,
          this.collectionName,
          this.$route
        )
        filterManager.save(
          this.currentFilter,
          this.$router,
          this.indexName,
          this.collectionName
        )
        this.displayPagination = true
        this.loading = false
        await this.fetchDocuments()
      } catch (err) {
        this.$log.error(err)
        this.$bvToast.toast('The complete error has been printed to console.', {
          title: 'Ooops! Something went wrong.',
          variant: 'warning',
          toaster: 'b-toaster-bottom-right'
        })
        this.loading = false
      }
    },
    navigateToDocument() {
      const document = this.documents[0]

      if (!document) {
        return
      }

      this.$router.push({
        name: 'UpdateDocument',
        params: { id: document._id }
      })
    },
    onRefresh() {
      this.fetchDocuments()
    },
    async onFiltersUpdated(newFilters) {
      this.currentFilter = newFilters
    },
    onFilterSubmit(saveToHistory = true) {
      if (saveToHistory) {
        filterManager.addNewHistoryItemAndSave(
          this.currentFilter,
          this.indexName,
          this.collectionName
        )
      }
      this.fetchDocuments()
    },
    afterCollectionClear() {
      this.documents = []
      this.totalDocuments = 0
      this.currentFilter = new filterManager.Filter()
    },
    async fetchDocuments() {
      this.$forceUpdate()
      this.selectedDocuments = []

      let pagination = {
        from: this.paginationFrom,
        size: this.paginationSize
      }

      filterManager.save(
        this.currentFilter,
        this.$router,
        this.indexName,
        this.collectionName
      )

      try {
        let searchQuery = null
        searchQuery = filterManager.toSearchQuery(
          this.currentFilter,
          this.mappingAttributes,
          this.wrapper
        )

        if (!searchQuery) {
          searchQuery = {}
        }

        const sorting = filterManager.toSort(this.currentFilter)

        // TODO: refactor how search is done
        // Execute search with corresponding searchQuery
        const res = await this.wrapper.performSearchDocuments(
          this.collectionName,
          this.indexName,
          searchQuery,
          pagination,
          sorting
        )
        this.documents = res.documents
        this.totalDocuments = res.total
      } catch (e) {
        this.$log.error(e)
        if (e.message.includes('failed to create query')) {
          this.$bvToast.toast(
            'Your query is ill-formed. The complete error has been dumped to the console.',
            {
              title:
                'Ooops! Something went wrong while fetching the documents.',
              variant: 'warning',
              toaster: 'b-toaster-bottom-right',
              appendTouast: true,
              dismissible: true,
              noAutoHide: true
            }
          )
        } else {
          this.$bvToast.toast(e.message, {
            title: 'Ooops! Something went wrong while fetching the documents.',
            variant: 'warning',
            toaster: 'b-toaster-bottom-right',
            appendToast: true,
            dismissible: true,
            noAutoHide: true
          })
        }
      }
    },

    // PAGINATION
    // =========================================================================
    changePaginationSize(size) {
      this.$log.debug(`changing pagination to ${size}`)
      this.onFiltersUpdated(
        Object.assign(this.currentFilter, {
          size,
          currentPage: 0,
          from: 0
        })
      )
      this.fetchDocuments()
    },
    setCurrentPage() {
      this.currentPage = parseInt(this.paginationFrom / this.paginationSize + 1)
    },

    // SELECT ITEMS
    // =========================================================================
    onToggleAllClicked() {
      if (this.allChecked) {
        this.selectedDocuments = []
        return
      }
      this.selectedDocuments = []
      this.selectedDocuments = this.documents.map(document => document._id)
    },
    toggleSelectDocuments(id) {
      let index = this.selectedDocuments.indexOf(id)

      if (index === -1) {
        this.selectedDocuments.push(id)
        return
      }

      this.selectedDocuments.splice(index, 1)
    },

    // LIST VIEW TYPES
    // =========================================================================
    onListViewClicked() {
      this.listViewType = LIST_VIEW_LIST
      this.saveListView()
    },
    onColumnViewClicked() {
      this.listViewType = LIST_VIEW_COLUMN
      this.saveListView()
    },
    onBoxesViewClicked() {
      this.listViewType = LIST_VIEW_BOXES
      this.saveListView()
    },
    onTimeSeriesClicked() {
      this.listViewType = LIST_VIEW_TIME_SERIES
      this.saveListView()
    },
    onMapViewClicked() {
      this.listViewType = LIST_VIEW_MAP
      this.saveListView()
    },
    // Collection Metadata management
    // =========================================================================
    loadListView() {
      if (this.$route.query.listViewType) {
        this.listViewType = this.$route.query.listViewType
      } else {
        const typeFromLS = localStorage.getItem(
          `${LOCALSTORAGE_PREFIX}:${this.indexName}/${this.collectionName}`
        )
        if (typeFromLS) {
          this.listViewType = typeFromLS
        } else {
          this.listViewType = LIST_VIEW_LIST
        }
      }
    },
    saveListView() {
      localStorage.setItem(
        `${LOCALSTORAGE_PREFIX}:${this.indexName}/${this.collectionName}`,
        this.listViewType
      )
      const otherQueryParams = _.omit(
        this.$router.currentRoute.query,
        'listViewType'
      )
      const mergedQuery = _.merge(
        { listViewType: this.listViewType },
        otherQueryParams
      )
      this.$router.push({ query: mergedQuery }).catch(() => {})
    },

    loadMappingInfo() {
      this.mappingGeopoints = this.listMappingGeopoints(this.collectionMapping)
      this.mappingGeoshapes = this.listMappingGeoshapes(this.collectionMapping)
      if (this.mappingGeopoints.length) {
        this.selectedGeopoint = this.mappingGeopoints[0]
      }
      if (this.mappingGeoshapes.length) {
        this.selectedGeoshape = this.mappingGeoshapes[0]
      }
    },
    // TODO: Refactor this method to avoid
    // cloning document list (computed property??)
    addHumanReadableDateFields() {
      if (!this.collectionMapping) {
        return
      }

      const dateFields = []
      const formattedDocuments = _.cloneDeep(this.documents)
      const findDateFields = (mapping, previousKey) => {
        for (const [field, value] of Object.entries(mapping)) {
          if (typeof value === 'object') {
            findDateFields(value, field)
          } else if (field === 'type' && value === 'date') {
            dateFields.push(previousKey)
          }
        }
      }

      const changeField = document => {
        for (const [field, value] of Object.entries(document)) {
          if (dateFields.includes(field)) {
            const date = dateFromTimestamp(value)

            if (date) {
              document[field] += ` (${date.toLocaleString('en-GB')})`
            }
          } else if (value && typeof value === 'object') {
            changeField(value)
          }
        }
      }

      findDateFields(this.collectionMapping, null)

      formattedDocuments.forEach(changeField)
      this.formattedDocuments = formattedDocuments
    },
    changeDisplayPagination(value) {
      this.displayPagination = value
    }
  }
}
</script>

<style lang="scss" scoped>
.DocumentList {
  margin-bottom: 5em;
}
.DocumentList--container {
  transition: max-width 0.6s;
}
.DocumentList--containerFluid {
  max-width: 100%;
}
.ResultPerPage {
  &--active {
    color: 'primary';
  }
  &--link {
    color: grey;
  }
}
</style>
