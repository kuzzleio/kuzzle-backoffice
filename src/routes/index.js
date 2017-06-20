import Login from '../components/Login'
import CreateEnvironmentPage from '../components/Common/Environments/CreateEnvironmentPage'
// import NotFound from '../components/404'
import store from '../vuex/store'
import {SET_ROUTE_BEFORE_REDIRECT} from '../vuex/modules/common/routing/mutation-types'
import {hasSecurityRights} from '../services/userAuthorization'
import SecuritySubRoutes from './children/security'
import DataSubRoutes from './children/data'

export default function createRoutes (VueRouter) {
  let router = new VueRouter({
    routes: [
      {
        path: '/',
        name: 'Home',
        redirect: '/data',
        component (resolve) {
          require(['../components/Home'], resolve)
        },
        meta: {
          auth: true
        },
        children: [
          {
            path: '/security',
            name: 'Security',
            redirect: '/security/users',
            component (resolve) {
              if (!hasSecurityRights()) {
                require(['../components/Common/PageNotAllowed'], resolve)
              } else {
                require(['../components/Security/Layout'], resolve)
              }
            },
            children: SecuritySubRoutes
          },
          {
            path: '/data',
            name: 'DataLayout',
            meta: {
              auth: true
            },
            component (resolve) {
              require(['../components/Data/Layout'], resolve)
            },
            children: DataSubRoutes
          }
        ]
      },
      {
        path: '/signup',
        name: 'Signup',
        component (resolve) {
          require(['../components/Signup'], resolve)
        }
      },
      {
        path: '/login',
        name: 'Login',
        meta: {
          auth: false
        },
        component: Login
      },
      {
        path: '/create-env',
        name: 'CreateEnv',
        meta: {
          auth: false
        },
        component: CreateEnvironmentPage
      }
    ]}, 'hash')

  router.afterEach(() => {
    Array.prototype.forEach.call(document.querySelectorAll('.loader'), element => {
      element.classList.remove('loading')
    })
  })

  router.beforeEach((to, from, next) => {
    Array.prototype.forEach.call(document.querySelectorAll('.loader'), element => {
      element.classList.add('loading')
    })

    if (!store.getters.hasEnvironment) {
      if (to.name !== 'CreateEnv') {
        next('/create-env')
        return
      }
    } else if (!store.getters.adminAlreadyExists) {
      if (to.name !== 'Signup') {
        next('/signup')
        return
      }
    } else if (!store.getters.isAuthenticated) {
      if (to.matched.some(record => record.meta.auth)) {
        store.commit(SET_ROUTE_BEFORE_REDIRECT, to.name)
        next('/login')
        return
      }
    }

    if ((to.name === 'CreateEnv' && store.getters.hasEnvironment) ||
      (to.name === 'Signup' && store.getters.adminAlreadyExists) ||
      (to.name === 'Login' && store.getters.isAuthenticated)) {
      next('/')
    } else {
      next()
    }
  })

  return router
}
