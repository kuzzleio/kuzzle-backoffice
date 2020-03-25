import * as getters from './getters'
import {
  dedupeRealtimeCollections,
  splitRealtimeStoredCollections,
  getRealtimeCollectionFromStorage
} from '../../../services/data'
import { removeIndex } from '../../../services/localStore'
import Promise from 'bluebird'
import Vue from 'vue'
import { IndexState } from './types'
import { createMutations, createModule, createActions } from 'direct-vuex'
import { moduleActionContext } from '@/vuex/store'

const state: IndexState = {
  indexesAndCollections: {},
  loadingIndexes: false
}

const mutations = createMutations<IndexState>()({
  reset(state) {
    state.indexesAndCollections = {}
    state.loadingIndexes = false
  },
  setLoadingIndexes(state, value) {
    state.loadingIndexes = value
  },
  receiveIndexesCollections(state, indexesAndCollections) {
    const indexes = Object.keys(indexesAndCollections)
    for (const index of indexes) {
      Vue.set(state.indexesAndCollections, index, indexesAndCollections[index])
    }
  },
  setCollectionsForIndex(state, { index, collections, type }) {
    if (type !== 'stored' || type !== 'realtime') {
      Vue.set(state.indexesAndCollections, `${index}.${type}`, collections)
    }
  },
  addStoredCollection(state, payload) {
    if (!state.indexesAndCollections[payload.index]) {
      Vue.set(state.indexesAndCollections, payload.index, {
        realtime: [],
        stored: []
      })
    }

    state.indexesAndCollections[payload.index].stored.push(payload.name)
  },
  addRealtimeCollection(state, payload) {
    if (!state.indexesAndCollections[payload.index]) {
      Vue.set(state.indexesAndCollections, payload.index, {
        realtime: [],
        stored: []
      })
    }

    state.indexesAndCollections[payload.index].realtime.push(payload.name)
  },
  addIndex(state, index) {
    Vue.set(state.indexesAndCollections, index, { realtime: [], stored: [] })
  },
  deleteIndex(state, index) {
    Vue.delete(state.indexesAndCollections, index)
  },
  removeRealtimeCollection(state, { index, collection }) {
    if (
      !state.indexesAndCollections[index] ||
      !state.indexesAndCollections[index].realtime
    ) {
      return
    }

    // prettier-ignore
    state.indexesAndCollections[index].realtime =
      state
        .indexesAndCollections[index]
        .realtime
        .filter(realtimeCollection => realtimeCollection !== collection)
  },
  removeStoredCollection(state, { index, collection }) {
    if (
      !state.indexesAndCollections[index] ||
      !state.indexesAndCollections[index].stored
    ) {
      return
    }

    const idx = state.indexesAndCollections[index].stored.indexOf(collection)
    Vue.delete(state.indexesAndCollections[index].stored, idx)
  }
})

const actions = createActions({
  async createIndex(context, index: string): Promise<void> {
    const { commit } = indexActionContext(context)

    await Vue.prototype.$kuzzle.index.create(index)
    commit.addIndex(index)
  },
  async deleteIndex(context, index) {
    const { commit } = indexActionContext(context)

    await Vue.prototype.$kuzzle.index.delete(index)
    removeIndex(index)
    commit.deleteIndex(index)
  },
  async listIndexes(context) {
    const { commit } = indexActionContext(context)
    commit.setLoadingIndexes(true)
    let result = await Vue.prototype.$kuzzle.index.list()
    result = result.filter(index => index !== '%kuzzle')

    for (const index of result) {
      commit.addIndex(index)
    }
    commit.setLoadingIndexes(false)
  },
  async listCollectionsForIndex(context, index) {
    const { commit } = indexActionContext(context)
    const res = await Vue.prototype.$kuzzle.collection.list(index, {
      size: 0
    })

    let collections = splitRealtimeStoredCollections(res.collections)

    if (!collections.realtime) {
      collections.realtime = []
    }

    collections.realtime = collections.realtime.concat(
      getRealtimeCollectionFromStorage(index)
    )
    collections = dedupeRealtimeCollections(collections)
    commit.setCollectionsForIndex({
      index,
      collections: collections.stored,
      type: 'stored'
    })
    commit.setCollectionsForIndex({
      index,
      collections: collections.realtime,
      type: 'realtime'
    })
  },

  async listIndexesAndCollections(context) {
    const { commit, dispatch, state } = indexActionContext(context)
    commit.reset()

    dispatch.listIndexes()
    Object.keys(state.indexesAndCollections).forEach(async index => {
      await dispatch.listCollectionsForIndex(index)
    })
  },
  async createCollectionInIndex(
    context,
    { index, collection, isRealtimeOnly, mapping, dynamic }
  ) {
    const { rootDispatch, commit, getters } = indexActionContext(context)

    if (!collection) {
      return new Error('Invalid collection name')
    }

    if (
      getters.indexCollections(index).stored.indexOf(collection) !== -1 ||
      getters.indexCollections(index).realtime.indexOf(collection) !== -1
    ) {
      return
      new Error(`Collection "${collection}" already exist`)
    }

    if (isRealtimeOnly) {
      let collections = JSON.parse(
        localStorage.getItem('realtimeCollections') || '[]'
      )
      collections.push({ index: index, collection: collection })
      localStorage.setItem('realtimeCollections', JSON.stringify(collections))
      commit.addRealtimeCollection({ index: index, name: collection })
      return Promise.resolve()
    }

    await rootDispatch.collection.createCollection({
      collection,
      index,
      mapping,
      dynamic
    })
    commit.addStoredCollection({ index: index, name: collection })
  },
  removeRealtimeCollection(context, { index, collection }) {
    const { commit } = indexActionContext(context)

    let collections = JSON.parse(
      localStorage.getItem('realtimeCollections') || '[]'
    )
    collections = collections.filter(
      o => o.index !== index && o.collection !== collection
    )
    localStorage.setItem('realtimeCollections', JSON.stringify(collections))

    commit.removeRealtimeCollection({ index, collection })
  },
  async deleteCollection(context, { index, collection }) {
    const { commit, dispatch } = indexActionContext(context)

    if (state.indexesAndCollections[index].stored.indexOf(collection) !== -1) {
      await Vue.prototype.$kuzzle.query({
        index,
        collection,
        controller: 'collection',
        action: 'delete'
      })
      commit.removeStoredCollection({ index, collection })
    }
    if (
      state.indexesAndCollections[index].realtime.indexOf(collection) !== -1
    ) {
      dispatch.removeRealtimeCollection({ index, collection })
    }
  }
})

const index = createModule({
  namespaced: true,
  state,
  mutations,
  actions,
  getters
})

export default index
export const indexActionContext = (context: any) =>
  moduleActionContext(context, index)
