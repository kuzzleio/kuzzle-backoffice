<template>
  <b-row class="h-100 text-center mx-0" align-v="center" align-h="center">
    <b-col cols="12" class="h-100 px-0">
      <b-card class="h-100 backgroundCard" no-body>
        <b-card-body class="d-flex flex-column text-center m-0 p-0 h-100">
          <b-card-text class="px-1 py-3 h-100">
            <slot name="actions" />
            <b-row class="h-100" v-if="!paginatedQueries.length">
              <b-col>
                <b-card title="No API actions saved.">
                  <b-card-text>
                    <p>Your saved API Actions will appear in this list.</p>
                  </b-card-text>
                </b-card>
              </b-col>
            </b-row>
            <template v-else>
              <b-card no-body header="Saved API Actions">
                <b-list-group class="leftNav-container" ref="leftNav-container">
                  <b-list-group-item
                    v-for="query of paginatedQueries"
                    class="px-3 py-0"
                    :key="`saved-query-${query.idx}`"
                    :active="query.idx === currentQueryIndex"
                    :ref="`saved-query-${query.idx}`"
                    :data-cy="`api-actions-saved-query-${query.name}`"
                  >
                    <b-row align-v="center">
                      <b-col
                        cols="9"
                        class="text-left py-3 pointer leftTab"
                        @click="loadSavedQuery(query.idx)"
                        :id="`query-list-${query.idx}`"
                      >
                        <span>{{ query.name }}</span>
                      </b-col>
                      <b-col cols="3" class="py-3">
                        <i
                          class="fas fa-trash pointer"
                          @click="deleteSavedQuery(query)"
                        />
                      </b-col>
                    </b-row>
                  </b-list-group-item>
                </b-list-group>
              </b-card>
            </template>
          </b-card-text>
        </b-card-body>
      </b-card>
    </b-col>
  </b-row>
</template>

<script>
export default {
  props: {
    currentQueryName: {},
    savedQueries: {}
  },
  data() {
    return {}
  },
  computed: {
    currentQueryIndex() {
      return this.savedQueries.findIndex(q => q.name === this.currentQueryName)
    },
    paginatedQueries() {
      return this.savedQueries.map((q, index) => {
        q.idx = index
        return q
      })
    }
  },
  methods: {
    deleteSavedQuery(query) {
      this.$bvModal
        .msgBoxConfirm('Please confirm the deletion of the API Action.', {
          title: `Api Action ${query.name} deletion`,
          size: 'md',
          buttonSize: 'sm',
          okVariant: 'danger',
          okTitle: 'YES',
          cancelTitle: 'NO',
          footerClass: 'p-2',
          hideHeaderClose: false
        })
        .then(value => {
          if (value) {
            this.$emit('deleteSavedQuery', query.idx)
          }
        })
        .catch(err => {
          this.$log.error(err)
        })
    },
    loadSavedQuery(savedQueryIdx) {
      this.$emit('loadSavedQuery', savedQueryIdx)
    }
  },
  watch: {
    currentQueryIndex: {
      handler(value) {
        const ref = this.$refs[`saved-query-${value}`]
        if (!ref) {
          return
        }
        const elem = ref[0]
        if (!elem) {
          return
        }
        this.$refs['leftNav-container'].scrollTo(
          0,
          elem.offsetTop - elem.offsetHeight
        )
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.leftTab {
  white-space: nowrap;
  overflow-y: hidden;
  overflow-x: hidden;
}
.list-item {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
.leftNav-container {
  overflow: auto;
  height: 100%;
}
</style>
