<template>
  <form class="BasicFilter" @submit.prevent="submitSearch">
    <div class="BasicFilter-predicates">
      <div class="BasicFilter-predicate">
        <div
          v-for="(orBlock, groupIndex) in filters.basic"
          :key="`orBlock-${groupIndex}`"
          class="BasicFilter-orBlock"
        >
          <b-card body-bg-variant="light">
            <template
              v-if="groupIndex === filters.basic.length - 1"
              v-slot:footer
            >
              <b-button @click="addOrCondition" variant="outline-secondary">
                <i class="fa fa-plus left mr-2" />OR
              </b-button>
            </template>
            <b-row
              align-v="center"
              align-h="center"
              class="mt-1"
              v-for="(andBlock, filterIndex) in orBlock"
              :key="`andBlock-${filterIndex}`"
              no-gutters
            >
              <b-col xl="11">
                <b-row align-v="center" align-h="center" no-gutters>
                  <b-col cols="11" class="mt-1">
                    <b-row align-v="center" align-h="center">
                      <b-col class="text-center mb-1 px-0" xl="1">
                        <span
                          v-if="filterIndex !== 0"
                          class="text-secondary font-weight-bold"
                        >
                          AND
                        </span>
                      </b-col>
                      <b-col xl="4" class="mb-1">
                        <b-row align-v="center" align-h="center">
                          <template v-if="filterIndex === 0">
                            <b-col cols="1" class="ml-3">
                              <i
                                class="fas fa-question-circle fa-lg"
                                v-b-popover.hover.top="
                                  'For an attribute to be in the list, it must be contained in the mapping.'
                                "
                              ></i>
                            </b-col>
                          </template>
                          <b-col>
                            <b-form-select
                              placeholder="Attribute"
                              :data-cy="
                                `BasicFilter-attributeSelect--${groupIndex}.${filterIndex}`
                              "
                              @change="
                                attribute =>
                                  selectAttribute(
                                    attribute,
                                    groupIndex,
                                    filterIndex
                                  )
                              "
                              :value="
                                filters.basic[groupIndex][filterIndex]
                                  .attribute || ''
                              "
                              :options="selectAttributesValues"
                            >
                              <template v-slot:first>
                                <b-form-select-option :value="''" disabled
                                  >Attribute</b-form-select-option
                                >
                              </template>
                            </b-form-select>
                          </b-col>
                        </b-row>
                      </b-col>
                      <b-col xl="3" class="mb-1">
                        <b-form-select
                          v-model="andBlock.operator"
                          :data-cy="`BasicFilter-operator`"
                          :options="availableOperandsFormatted"
                        />
                      </b-col>
                      <b-col
                        xl="4"
                        class="mb-1"
                        v-if="
                          andBlock.operator !== 'exists' &&
                            andBlock.operator !== 'not_exists'
                        "
                      >
                        <template v-if="andBlock.operator !== 'range'">
                          <b-form-input
                            class="BasicFilter--value validate"
                            placeholder="Value"
                            type="text"
                            :data-cy="
                              `BasicFilter-valueInput--${groupIndex}.${filterIndex}`
                            "
                            v-model="andBlock.value"
                          />
                        </template>
                        <template v-else>
                          <b-form-input
                            v-model="andBlock.gt_value"
                            placeholder="Value 1"
                            type="text"
                            :data-cy="`BasicFilter-operator-Range-Value1`"
                            class="BasicFilter--gtValue validate mb-1"
                          />
                          <b-form-input
                            v-model="andBlock.lt_value"
                            placeholder="Value 2"
                            type="text"
                            :data-cy="`BasicFilter-operator-Range-Value2`"
                            class="BasicFilter--ltValue validate mt-1"
                          />
                        </template>
                      </b-col>
                    </b-row>
                  </b-col>
                  <b-col sm="1" class="text-center">
                    <b-button
                      v-if="filterIndex > 0"
                      @click="removeAndCondition(groupIndex, filterIndex)"
                    >
                      <i class="fa fa-times pointer" />
                    </b-button>
                  </b-col>
                </b-row>
              </b-col>
              <b-col xl="1">
                <b-row align-v="center" align-h="center">
                  <b-button
                    v-if="filterIndex === orBlock.length - 1"
                    variant="outline-secondary"
                    @click="addAndCondition(groupIndex)"
                  >
                    <i class="fa fa-plus left mr-1" />AND
                  </b-button>
                </b-row>
              </b-col>
            </b-row>
          </b-card>

          <b-row v-if="groupIndex < filters.basic.length - 1">
            <b-col class="pr-0 mr-0" md="5"><hr /></b-col>
            <b-col
              md="2"
              class="pr-0 mr-0 pl-0 ml-0 mt-2 text-center text-secondary"
            >
              <b>OR</b>
            </b-col>
            <b-col class="pl-0 ml-0" md="5"><hr /></b-col>
          </b-row>
        </div>
      </div>
    </div>

    <b-row align-h="center" align-v="center">
      <b-col md="4">
        <b-input-group v-if="sortingEnabled" class="ml-1" prepend="Sort">
          <b-form-select
            data-cy="BasicFilter-sortAttributeSelect"
            placeholder="Attribute"
            :value="filters.sorting.attribute || ''"
            @change="attribute => setSortAttr(attribute)"
            :options="sortAttributesValues"
          >
            <template v-slot:first>
              <b-form-select-option :value="''" disabled
                >Attribute</b-form-select-option
              >
            </template></b-form-select
          >
        </b-input-group>
      </b-col>
      <b-col md="2" class="px-0"
        ><b-select
          v-if="sortingEnabled"
          v-model="filters.sorting.order"
          data-cy="BasicFilter-sortOrderSelect"
          :options="[
            { value: 'asc', text: 'Ascending' },
            { value: 'desc', text: 'Descending' }
          ]"
      /></b-col>
      <b-col v-if="actionButtonsVisible" class="text-right">
        <b-button
          class="BasicFilter-generateRawBtn mt-2 mb-2 mr-2"
          data-cy="BasicFilter-generateRawBtn"
          @click.prevent="generateRawFilter"
        >
          <i class="fas fa-scroll"></i>&nbsp; Generate Raw JSON
        </b-button>
        <b-button
          class="BasicFilter-resetBtn mr-2"
          data-cy="BasicFilter-resetBtn"
          variant="outline-secondary"
          @click="resetSearch"
        >
          Reset
        </b-button>
        <b-button
          data-cy="BasicFilter-submitBtn"
          class="BasicFilter-submitBtn mt-2 mb-2"
          variant="primary"
          @click.prevent="submitSearch"
        >
          {{ submitButtonLabel }}
        </b-button>
      </b-col>
    </b-row>
  </form>
</template>

<script>
import { mapGetters } from 'vuex'
const emptyBasicFilter = { attribute: null, operator: 'contains', value: null }
const emptySorting = { attribute: null, order: 'asc' }

export default {
  name: 'BasicFilter',
  props: {
    basicFilter: Array,
    sorting: Object,
    availableOperands: {
      type: Object,
      required: true
    },
    submitButtonLabel: {
      type: String,
      required: false,
      default: 'Search'
    },
    actionButtonsVisible: {
      type: Boolean,
      required: false,
      default: true
    },
    sortingEnabled: {
      type: Boolean,
      required: false,
      default: true
    },
    mappingAttributes: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      filters: {
        active: 'basic',
        basic: null,
        sorting: { ...emptySorting }
      }
    }
  },
  computed: {
    ...mapGetters('kuzzle', ['wrapper']),
    selectAttributesValues() {
      return [
        { text: '_id', value: '_id' },
        ...Object.keys(this.mappingAttributes).map(a => ({
          text: a,
          value: a
        }))
      ]
    },
    sortAttributesValues() {
      return Object.keys(this.mappingAttributes)
        .filter(a => this.mappingAttributes[a].type !== 'text')
        .map(a => ({
          text: a,
          value: a
        }))
    },
    availableOperandsFormatted() {
      return Object.keys(this.availableOperands).map(e => ({
        value: e,
        text: this.availableOperands[e]
      }))
    },
    isFilterValid: function() {
      // For each andBlocks in orBlocks, check if attribute and value field are filled
      for (const orBlock of this.filters.basic) {
        for (const andBlock of orBlock) {
          if (
            (andBlock.operator === 'exists' ||
              andBlock.operator === 'not_exists') &&
            andBlock.attribute
          ) {
            return true
          }
          if (
            (!andBlock.attribute && andBlock.value) ||
            (andBlock.attribute &&
              !andBlock.value &&
              !andBlock.lt_value &&
              !andBlock.gt_value)
          ) {
            return false
          }
        }
      }

      return true
    }
  },
  watch: {
    basicFilter: {
      immediate: true,
      handler(value) {
        if (value) {
          this.filters.basic = value
        } else {
          this.filters.basic = [[{ ...emptyBasicFilter }]]
        }
      }
    },
    sorting: {
      immediate: true,
      handler(value) {
        if (value) {
          this.filters.sorting = value
        } else {
          this.filters.sorting = { ...emptySorting }
        }
      }
    }
  },
  methods: {
    setSortAttr(attribute) {
      this.$set(this.filters.sorting, 'attribute', attribute)
    },
    selectAttribute(attribute, groupIndex, filterIndex) {
      this.filters.basic[groupIndex][filterIndex].attribute = attribute
    },
    generateRawFilter() {
      const raw = this.wrapper.basicSearchToESQuery(
        this.filters.basic,
        this.mappingAttributes
      )
      this.$log.debug(JSON.stringify(raw, null, 2))
      this.$emit('generate-raw-filter', raw)
    },
    submitSearch() {
      if (!this.isFilterValid) {
        return
      }

      let filters = this.filters.basic

      if (
        this.filters.basic.length === 1 &&
        this.filters.basic[0].length === 1 &&
        !this.filters.basic[0][0].attribute
      ) {
        filters = null
      }

      if (this.sortingEnabled) {
        let sorting = this.filters.sorting

        if (!this.filters.sorting.attribute) {
          sorting = null
        }

        this.$emit('filter-submitted', filters, sorting)
      } else {
        this.$emit('filter-submitted', filters)
      }
    },
    resetSearch() {
      this.filters.basic = [[{ ...emptyBasicFilter }]]
      this.filters.sorting = { ...emptySorting }
      this.submitSearch()
    },
    addOrCondition() {
      this.filters.basic.push([{ ...emptyBasicFilter }])
    },
    addAndCondition(groupIndex) {
      if (!this.filters.basic[groupIndex]) {
        return false
      }

      this.filters.basic[groupIndex].push({ ...emptyBasicFilter })
    },
    removeAndCondition(groupIndex, filterIndex) {
      if (
        !this.filters.basic[groupIndex] ||
        !this.filters.basic[groupIndex][filterIndex]
      ) {
        return false
      }

      if (
        this.filters.basic.length === 1 &&
        this.filters.basic[0].length === 1
      ) {
        this.$set(this.filters.basic[0], 0, { ...emptyBasicFilter })
        return
      }

      if (
        this.filters.basic[groupIndex].length === 1 &&
        this.filters.basic.length > 1
      ) {
        this.filters.basic.splice(groupIndex, 1)
        return
      }

      this.filters.basic[groupIndex].splice(filterIndex, 1)
    }
  }
}
</script>

<style lang="scss" scoped>
a.btn {
  i.left {
    margin-right: 8px;
  }
  padding-left: 10px;
  padding-right: 10px;
  margin-left: 10px;
}

p {
  margin-bottom: 10px;
  margin-top: 10px;
  i {
    font-size: 1.1em;
    margin-right: 10px;
  }
}

.BasicFilter {
  height: 100%;
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0 auto;
}

.BasicFilter-predicates {
  flex-grow: 1;
  overflow-y: auto;
}

.BasicFilter-orBtn {
  margin-bottom: 10px;
}

.BasicFilter-removeBtn {
  margin-top: 25px;
  color: grey;
  cursor: pointer;
}

.BasicFilter-orBlock {
}

.BasicFilter-andBlock {
  margin-bottom: 0;
  border-left: 1px dotted rgba(0, 0, 0, 0.26);
  padding-bottom: 5px;
}

.BasicFilter-sortBlock {
  margin-top: 15px;
  margin-bottom: 0;

  .block-content {
    margin-left: 5px;
    margin-bottom: 5px;
  }
}
</style>
