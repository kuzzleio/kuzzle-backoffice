<template>
  <div class="LoginPage">
    <b-row align-h="center" class="w-100">
      <b-col xl="6" lg="7" md="8" sm="10">
        <b-card>
          <b-card-body>
            <div class="text-center">
              <img
                src="../assets/logo.svg"
                alt="Welcome to the Kuzzle Admin Console"
                class="mb-5 img-fluid"
              />
            </div>
            <b-alert
              class="text-center"
              variant="info"
              data-cy="noAdminAlert"
              :show="displayNoAdminBanner"
            >
              <b>Warning!</b> Your Kuzzle has no administrator user. It is
              strongly recommended
              <a class="alert-link" data-cy="NoAdminAlert-link" href="#/signup">
                that you create one.</a
              >
            </b-alert>
            <b-form-group
              label="Connected to"
              label-cols-sm="4"
              label-cols-lg="3"
            >
              <environment-switch
                @environment::create="editEnvironment"
                @environment::delete="deleteEnvironment"
                @environment::importEnv="importEnv"
              />
            </b-form-group>
            <login-form :on-login="onLogin" />
          </b-card-body>
        </b-card>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import LoginForm from './Common/Login/Form'
import EnvironmentSwitch from './Common/Environments/EnvironmentsSwitch'
import { mapGetters } from 'vuex'

export default {
  name: 'Login',
  components: {
    LoginForm,
    EnvironmentSwitch
  },
  data() {
    return {
      environmentId: null
    }
  },
  computed: {
    ...mapGetters('kuzzle', ['currentEnvironment']),
    displayNoAdminBanner() {
      return (
        !this.currentEnvironment.hideAdminBanner &&
        !this.$store.direct.getters.auth.adminAlreadyExists
      )
    }
  },
  methods: {
    onLogin() {
      // Set the body overflow to visible because the login modal set it to 'hidden'.
      // After login, the index route is pushed to view router and the body overflow is
      // not set to his original state
      // see src/components/Materialize/Modale.vue#62
      window.document.body.style.overflow = 'visible'

      if (this.$store.getters.routeBeforeRedirect) {
        this.$store.direct.commit.routing.setRouteBeforeRedirect(undefined)
        this.$router.push({ name: this.$store.getters.routeBeforeRedirect })
      } else {
        this.$router.push('/')
      }
    },
    editEnvironment(id) {
      this.$emit('environment::create', id)
    },
    deleteEnvironment(id) {
      this.$emit('environment::delete', id)
    },
    importEnv() {
      this.$emit('environment::importEnv')
    }
  }
}
</script>

<style type="text/css" scoped>
.LoginPage {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
