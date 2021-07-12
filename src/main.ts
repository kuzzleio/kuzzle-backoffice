import Vue from 'vue'
import { BootstrapVue, BootstrapVueIcons } from 'bootstrap-vue'
import createRoutes from './routes/index'
import './plugins/logger'

import VueFormGenerator from 'vue-form-generator'
import 'vue-form-generator/dist/vfg.css'
import JsonFormInput from '@/components/Data/Documents/FormInputs/JsonFormInput.vue'
import DateTimeFormInput from '@/components/Data/Documents/FormInputs/DateTimeFormInput.vue'
import 'leaflet/dist/leaflet.css'

import App from './App.vue'
import store from './vuex/store'

Reflect.defineProperty(window, 'kuzzle', {
  get() {
    return store.getters.kuzzle.$kuzzle
  }
})

Vue.use(BootstrapVue)
Vue.use(BootstrapVueIcons)

const router = createRoutes(Vue.prototype.$log)

Vue.component('fieldJsonFormInput', JsonFormInput)
Vue.component('fieldDateTimeFormInput', DateTimeFormInput)
Vue.use(VueFormGenerator)

// Vue.config.errorHandler = (err, vm, info) => {
//   // TODO : use vue-logger instead of console.error,
//   // idk why but here vm.$log is undefined
//   console.error(`Error: ${err.toString()}\nInfo: ${info}`)

//   vm.$bvToast.toast('The complete error has been printed to the console.', {
//     title: 'Ooops! Something went wrong.',
//     variant: 'warning',
//     toaster: 'b-toaster-bottom-right',
//     appendToast: true,
//     dismissible: true,
//     noAutoHide: true
//   })
// }

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store: store.original,
  render: h => h(App)
})
