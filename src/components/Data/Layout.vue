<template>
  <Multipane
    class="DataLayout Custom-resizer"
    layout="vertical"
    @paneResizeStop="saveNewPaneSize($event)"
  >
    <div
      class="DataLayout-sidebarWrapper"
      :style="{ width: this.paneSize }"
      data-cy="DataLayout-sidebarWrapper"
    >
      <treeview
        :indexName="$route.params.indexName"
        :collectionName="$route.params.collectionName"
      />
    </div>
    <MultipaneResizer data-cy="sidebarResizer" />
    <div class="DataLayout-contentWrapper">
      <template v-if="loading">
        <main-spinner></main-spinner>
      </template>
      <template v-else>
        <data-not-found v-if="dataNotFound" class="mt-3"></data-not-found>
        <router-view v-else />
      </template>
    </div>
  </Multipane>
</template>

<script>
import MainSpinner from '../Common/MainSpinner'
import { Multipane, MultipaneResizer } from 'vue-multipane'
import Treeview from '@/components/Data/Leftnav/Treeview'
import DataNotFound from './Data404'
import { mapGetters } from 'vuex'
import { setPersistedItem, getPersistedItem } from './itemsStorage'

export default {
  name: 'DataLayout',
  components: {
    MainSpinner,
    Treeview,
    Multipane,
    MultipaneResizer,
    DataNotFound
  },
  data() {
    return {
      isFetching: true,
      dataNotFound: false,
      paneSize: ''
    }
  },
  computed: {
    ...mapGetters('index', ['loadingIndexes', 'loadingCollections']),
    ...mapGetters('auth', ['isAuthenticated']),
    indexName() {
      return this.$route.params.indexName
    },
    collectionName() {
      return this.$route.params.collectionName
    },
    loading() {
      if (this.isFetching) {
        return true
      }

      if (this.loadingIndexes) {
        return true
      }

      if (this.indexName && this.loadingCollections(this.indexName)) {
        return true
      }

      return false
    }
  },
  methods: {
    saveNewPaneSize(size) {
      setPersistedItem('paneSize', size.scrollWidth)
      this.paneSize = `${getPersistedItem('paneSize')}px`
    },
    async fetchIndexList() {
      try {
        await this.$store.direct.dispatch.index.fetchIndexList()
      } catch (error) {
        this.$log.error(error)
        this.$bvToast.toast(
          'The complete error has been printed to the console.',
          {
            title:
              'Ooops! Something went wrong while fetching the indexes list.',
            variant: 'warning',
            toaster: 'b-toaster-bottom-right',
            appendToast: true,
            dismissible: true,
            noAutoHide: true
          }
        )
      }
    },
    async fetchCollectionList() {
      try {
        const index = this.$store.direct.getters.index.getOneIndex(
          this.indexName
        )

        if (!index) {
          this.handleDataNotFound()
          return
        }

        await this.$store.direct.dispatch.index.fetchCollectionList(index)
      } catch (error) {
        this.$log.error(error)
        this.$bvToast.toast(
          'The complete error has been printed to the console.',
          {
            title:
              'Ooops! Something went wrong while fetching the collection list.',
            variant: 'warning',
            toaster: 'b-toaster-bottom-right',
            appendToast: true,
            dismissible: true,
            noAutoHide: true
          }
        )
      }
    },
    async fetchCollectionMapping() {
      try {
        const index = this.$store.direct.getters.index.getOneIndex(
          this.indexName
        )

        if (!index) {
          this.handleDataNotFound()
          return
        }

        const collection = this.$store.direct.getters.index.getOneCollection(
          index,
          this.collectionName
        )

        if (!collection) {
          this.handleDataNotFound()
          return
        }

        await this.$store.direct.dispatch.index.fetchCollectionMapping({
          index,
          collection
        })
      } catch (error) {
        this.$log.error(error)
        this.$bvToast.toast(
          'The complete error has been printed to the console.',
          {
            title:
              'Ooops! Something went wrong while fetching the collection mapping.',
            variant: 'warning',
            toaster: 'b-toaster-bottom-right',
            appendToast: true,
            dismissible: true,
            noAutoHide: true
          }
        )
      }
    },
    handleDataNotFound() {
      this.dataNotFound = true
    },
    // @todo : handle lazy loading sequence only on the authenticated routes
    async lazyLoadingSequence() {
      if (!this.isAuthenticated) {
        this.$log.warn(
          'Lazy loading sequence started with a non-authenticated user.'
        )
        return
      }

      this.isFetching = true
      this.dataNotFound = false

      await this.fetchIndexList()

      if (this.$route.params.indexName) {
        await this.fetchCollectionList()
      }

      if (this.$route.params.indexName && this.$route.params.collectionName) {
        await this.fetchCollectionMapping()
      }

      this.isFetching = false
    }
  },
  async mounted() {
    await this.lazyLoadingSequence()
    this.paneSize = `${getPersistedItem('paneSize')}px`
  },
  watch: {
    $route: {
      handler() {
        this.lazyLoadingSequence()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.DataLayout {
  height: 100%;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
}

.DataLayout-sidebarWrapper {
  background-color: $light-grey-color;
  min-width: $sidebar-width;
  height: 100%;
  overflow: auto;
  z-index: 1;
}

.DataLayout-contentWrapper {
  position: unset;
  flex-grow: 1;
  height: 100%;
  overflow: auto;
  padding: $content-gutter;
}

.Custom-resizer > .multipane-resizer {
  margin: 0;
  left: 0;
  position: relative;
  padding: 3px;
  border: 1px solid #ccc;
  box-shadow: 2px 0px 5px -2px rgba(112, 112, 112, 1);
  &:before {
    display: block;
    content: '';
    width: 1px;
    height: 50px;
    position: absolute;
    top: 45%;
    left: 50%;
    border-left: 1px solid #aaa;
  }
  &:hover {
    &:before {
      border-color: #777;
      background-color: #f5f5f5;
    }
  }
}
</style>
