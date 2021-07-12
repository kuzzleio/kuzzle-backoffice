<template>
  <b-modal
    id="modal-save-query"
    title="Choose a name for this query"
    @ok="handleOk"
    @keydown.native.enter="handleOk"
    ok-title-html='<span data-cy="api-actions-modal-ok-button">OK</span>'
  >
    <form ref="form" @submit.stop.prevent="handleOk">
      <b-form-group
        label="Name"
        label-for="name-input"
        :invalid-feedback="feedback"
        :state="nameState"
      >
        <b-form-input
          id="name-input"
          v-model="name"
          data-cy="api-actions-modal-name-input"
          autofocus
          :state="nameState"
          required
        ></b-form-input>
      </b-form-group>
    </form>
  </b-modal>
</template>

<script>
export default {
  props: {
    isQueryNameValid: {
      default: null
    }
  },
  data() {
    return {
      name: '',
      nameState: null,
      feedback: ''
    }
  },
  methods: {
    checkFormValidity() {
      const isPresent = this.$refs.form.checkValidity()
      const isValid = this.isQueryNameValid(this.name)
      this.nameState = isPresent && isValid
      if (!this.namestate) {
        this.feedback = isPresent ? 'Name already used' : 'Name is required'
      }
      return this.nameState
    },
    reset() {
      this.name = ''
      this.nameState = null
      this.feedback = ''
    },
    handleOk(bvModalEvt) {
      bvModalEvt.preventDefault()
      if (!this.checkFormValidity()) {
        return
      }
      this.$nextTick(() => {
        this.$bvModal.hide('modal-save-query')
      })
      this.$emit('storeNewQuery', this.name)
      this.reset()
    }
  }
}
</script>
