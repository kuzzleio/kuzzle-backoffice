<template>
  <b-container class="IndexesPage" ref="page-indexes">
    <headline>
      Indexes
      <b-button
        class="float-right mt-3"
        data-cy="IndexesPage-createBtn"
        v-if="canCreateIndex"
        variant="primary"
        :title="
          !canCreateIndex ? `Your rights disallow you to create indexes` : ''
        "
        @click.prevent="openCreateModal"
      >
        <i class="fa fa-plus-circle left" />
        Create an index
      </b-button>
    </headline>

    <list-not-allowed v-if="!canSearchIndex" />
    <template v-else>
      <b-row class="mb-3">
        <b-col class="text-secondary pt-2">
          {{ indexes.length }}
          {{ indexes.length === 1 ? 'index' : 'indexes' }}
        </b-col>
        <b-col sm="10">
          <b-row>
            <b-col cols="6" class="text-right">
              <b-button
                variant="outline-dark"
                class="mr-2"
                @click="onToggleAllClicked"
              >
                <i
                  :class="
                    `far ${
                      selectedIndexes.length === filteredIndexes.length
                        ? 'fa-check-square'
                        : 'fa-square'
                    } left`
                  "
                />
                Toggle all
              </b-button>

              <b-button
                variant="outline-danger"
                data-cy="IndexesPage-bulkDelete--btn"
                :disabled="!bulkDeleteEnabled"
                @click="openBulkDeleteModal"
              >
                <i class="fa fa-minus-circle left" />
                Delete
              </b-button>
            </b-col>
            <b-col cols="6">
              <b-input-group>
                <template v-slot:prepend>
                  <b-input-group-text>Filter</b-input-group-text>
                </template>

                <auto-focus-input
                  name="index"
                  v-model="filter"
                  :disabled="indexes.length === 0"
                  @submit="navigateToIndex"
                />
              </b-input-group>
            </b-col>
          </b-row>
        </b-col>
      </b-row>

      <b-table
        class="IndexPage-table"
        responsive
        striped
        outlined
        show-empty
        :items="indexes"
        :fields="tableFields"
        :filter="filter"
        @filtered="updateFilteredIndexes"
      >
        <template v-slot:empty>
          <h4 class="text-secondary text-center">There is no index.</h4>
          <p class="text-secondary text-center" v-if="canCreateIndex">
            You can create one by hitting the button above.
          </p>
        </template>
        <template v-slot:emptyfiltered>
          <h4 class="text-secondary text-center">
            There is no index matching your filter.
          </h4>
        </template>
        <template v-slot:cell(selected)="row">
          <b-form-checkbox
            class="d-inline-block align-middle"
            type="checkbox"
            unchecked-value="false"
            value="true"
            :data-cy="`IndexesPage-checkbox--${row.item.name}`"
            :checked="isChecked(row.item)"
            @change="onCheckboxClick(row.item)"
          />
        </template>
        <template v-slot:cell(collectionCount)="row">
          <span>{{ row.item.collectionsCount || '--' }}</span>
        </template>
        <template v-slot:cell(icon)>
          <i class="fa fa-2x fa-database mr-2"></i>
        </template>
        <template v-slot:cell(indexName)="row">
          <router-link
            :data-cy="`IndexesPage-name--${row.item.name}`"
            :title="row.item.name"
            :to="{
              name: 'Collections',
              params: { indexName: row.item.name }
            }"
          >
            {{ row.item.name }}
          </router-link>
        </template>
        <template v-slot:cell(actions)="row">
          <div class="IndexesPage-actions">
            <b-button
              class="mx-1"
              title="browse this index"
              variant="link"
              :data-cy="`IndexesPage-browse--${row.item.name}`"
              :to="{
                name: 'Collections',
                params: { index: row.item.name }
              }"
              ><i class="fa fa-eye"></i
            ></b-button>
            <b-button
              class="mx-1"
              title="Create a collection in this index"
              variant="link"
              :data-cy="`IndexesPage-createCollection--${row.item.name}`"
              :to="{
                name: 'CreateCollection',
                params: { index: row.item.name }
              }"
              ><i class="fa fa-plus"></i
            ></b-button>
            <b-button
              class="mx-1"
              :data-cy="`IndexesPage-delete--${row.item.name}`"
              title="Delete index"
              variant="link"
              @click="openDeleteModal(row.item)"
              ><i class="fa fa-trash"></i
            ></b-button>
          </div>
        </template>
      </b-table>
    </template>
    <CreateIndexModal
      :modalId="createIndexModalId"
      @create-successful="onCreateModalSuccess"
    />
    <DeleteIndexModal
      ref="deleteIndexModal"
      :index="indexToDelete"
      :modalId="deleteIndexModalId"
      @confirm-deletion="onConfirmDeleteModal"
      @cancel="onCancelDeleteModal"
    />
    <BulkDeleteIndexesModal
      :indexes="selectedIndexes"
      :modalId="bulkDeleteIndexesModalId"
      @delete-successful="onDeleteModalSuccess"
    />
  </b-container>
</template>

<script>
import Headline from '../../Materialize/Headline'
import CreateIndexModal from './CreateIndexModal'
import DeleteIndexModal from './DeleteIndexModal'
import BulkDeleteIndexesModal from './BulkDeleteIndexesModal'
import ListNotAllowed from '../../Common/ListNotAllowed'
import AutoFocusInput from '../../Common/AutoFocusInput'
import { mapGetters } from 'vuex'

export default {
  name: 'IndexesPage',
  components: {
    Headline,
    CreateIndexModal,
    DeleteIndexModal,
    BulkDeleteIndexesModal,
    ListNotAllowed,
    AutoFocusInput
  },
  data() {
    return {
      createIndexModalId: 'createIndexModal',
      deleteIndexModalId: 'deleteIndexModal',
      bulkDeleteIndexesModalId: 'bulkDeleteIndexesModal',
      filter: '',
      indexToDelete: null,
      tableFields: [
        {
          class: 'CollectionList-type align-middle',
          key: 'selected',
          label: ''
        },
        {
          key: 'icon',
          label: '',
          tdClass: 'IndexesPage-icon text-secondary align-middle'
        },
        {
          key: 'indexName',
          label: 'Name',
          sortable: true,
          tdClass: 'IndexesPage-name code align-middle'
        },
        {
          key: 'collectionCount',
          sortable: true,
          label: 'Collections',
          class: 'IndexesPage-collectionCount text-center align-middle'
        },
        {
          key: 'actions',
          label: '',
          class: 'text-right align-middle'
        }
      ],
      filteredIndexes: [],
      selectedIndexes: []
    }
  },
  mounted() {
    this.updateFilteredIndexes(this.indexes)
  },
  computed: {
    ...mapGetters('auth', ['canSearchIndex', 'canCreateIndex']),
    ...mapGetters('index', ['indexes', 'loadingIndexes']),
    bulkDeleteEnabled() {
      return this.selectedIndexes.length > 0
    },
    allChecked() {
      if (!this.selectedIndexes || !this.filteredIndexes) {
        return false
      }
      return this.selectedIndexes.length === this.filteredIndexes.length
    }
  },
  methods: {
    openCreateModal() {
      this.$bvModal.show(this.createIndexModalId)
    },
    openDeleteModal(index) {
      this.indexToDelete = index
      this.$bvModal.show(this.deleteIndexModalId)
    },
    openBulkDeleteModal() {
      this.$bvModal.show(this.bulkDeleteIndexesModalId)
    },
    async onCancelDeleteModal() {
      this.$refs.deleteIndexModal.resetForm()
      this.$bvModal.hide(this.deleteIndexModalId)
      await this.refreshIndexes()
    },
    async onConfirmDeleteModal() {
      try {
        await this.$store.direct.dispatch.index.deleteIndex(this.indexToDelete)
        this.$bvModal.hide(this.deleteIndexModalId)
        await this.refreshIndexes()
      } catch (err) {
        this.$refs.deleteIndexModal.setError(err.message)
      }
    },
    async onDeleteModalSuccess() {
      await this.refreshIndexes()
    },
    async onCreateModalSuccess() {
      await this.refreshIndexes()
    },
    async refreshIndexes() {
      try {
        await this.$store.direct.dispatch.index.fetchIndexList()
      } catch (err) {
        this.$log.error(err)
        this.$bvToast.toast(
          'The complete error has been printed to the console.',
          {
            title: err.message,
            variant: 'danger',
            toaster: 'b-toaster-bottom-right',
            appendToast: true
          }
        )
      }
    },
    onToggleAllClicked() {
      if (this.allChecked) {
        this.selectedIndexes = []
        return
      }
      this.selectedIndexes = []
      this.selectedIndexes = this.filteredIndexes
    },
    isChecked(index) {
      return this.selectedIndexes.find(el => el.name === index.name)
        ? true
        : false
    },
    onCheckboxClick(index) {
      const indexAlreadySelected = this.selectedIndexes.find(
        el => el.name === index.name
      )

      if (!indexAlreadySelected) {
        this.selectedIndexes.push(index)
        return
      }

      this.selectedIndexes = this.selectedIndexes.filter(
        el => el.name !== index.name
      )
    },
    navigateToIndex() {
      const index = this.filteredIndexes[0]

      if (!index) {
        return
      }

      const route = {
        name: 'Collections',
        params: { indexName: index.name }
      }

      this.$router.push(route)
    },
    updateFilteredIndexes(filteredIndexes) {
      this.filteredIndexes = filteredIndexes
    }
  }
}
</script>

<style lang="scss" rel="stylesheet/scss">
.IndexesPage-icon {
  width: 2em;
}
.IndexesPage-name {
  a {
    color: #222;
    font-weight: 500;
  }
}
.IndexesPage-collectionCount {
  width: 2em;
}
.IndexesPage-actions {
  width: 100%;
}
</style>
