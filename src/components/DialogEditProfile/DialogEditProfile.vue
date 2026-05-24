<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="handleClose">
      <div class="modal modal-large">
        <h3 class="modal-title">
          {{ isEditMode ? '编辑方案' : '新建方案' }}
        </h3>
        <div class="config-form">
          <BaseInput v-model="formData.name" label="方案名称" placeholder="输入方案名称" />
          <BaseInput
            v-model.number="formData.local_port"
            label="本地端口"
            type="number"
            placeholder="3000"
          />
          <BaseInput
            v-model="formData.target_base_url"
            label="目标接口地址"
            placeholder="https://api.example.com/v1"
          />
          <div class="form-row">
            <BaseInput
              v-model.number="formData.max_retries"
              label="最大重试次数"
              type="number"
              placeholder="3"
            />
            <BaseInput
              v-model.number="formData.retry_delay_ms"
              label="重试延迟 (ms)"
              type="number"
              placeholder="1000"
            />
          </div>
          <BaseInput
            v-model="retryCodesText"
            label="重试状态码 (逗号分隔)"
            placeholder="429,500,502,503,504"
          />
        </div>
        <div class="modal-actions">
          <BaseButton type="default" @click="handleClose"> 取消 </BaseButton>
          <BaseButton v-if="isEditMode && showDeleteButton" type="danger" @click="handleDelete">
            删除方案
          </BaseButton>
          <BaseButton type="primary" @click="handleSubmit">
            {{ isEditMode ? '保存配置' : '创建方案' }}
          </BaseButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import type { ProxyProfile } from '@/stores/config'

type ProfileFormData = Omit<ProxyProfile, 'id'> & { id?: string }

interface Props {
  modelValue: boolean
  profile?: ProxyProfile | null
  showDeleteButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  profile: null,
  showDeleteButton: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [profile: ProxyProfile]
  create: [profile: Omit<ProxyProfile, 'id'>]
  delete: [id: string]
}>()

const defaultProfile = (): ProfileFormData => ({
  name: '',
  local_port: 3000,
  target_base_url: '',
  max_retries: 3,
  retry_delay_ms: 1000,
  retry_status_codes: [429, 500, 502, 503, 504],
})

const formData = ref<ProfileFormData>(defaultProfile())

const isEditMode = computed(() => props.profile !== null)

const retryCodesText = computed({
  get: () => formData.value.retry_status_codes.join(','),
  set: (val: string) => {
    formData.value.retry_status_codes = val
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n))
  },
})

watch(
  () => props.modelValue,
  visible => {
    if (visible) {
      if (props.profile) {
        formData.value = { ...props.profile }
      } else {
        formData.value = defaultProfile()
      }
    }
  }
)

function handleClose() {
  emit('update:modelValue', false)
}

function handleSubmit() {
  if (isEditMode.value && formData.value.id) {
    emit('save', formData.value as ProxyProfile)
  } else {
    const createData: Omit<ProxyProfile, 'id'> = {
      name: formData.value.name,
      local_port: formData.value.local_port,
      target_base_url: formData.value.target_base_url,
      max_retries: formData.value.max_retries,
      retry_delay_ms: formData.value.retry_delay_ms,
      retry_status_codes: formData.value.retry_status_codes,
    }
    emit('create', createData)
  }
}

function handleDelete() {
  if (props.profile) {
    emit('delete', props.profile.id)
  }
}
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  width: 400px;
  max-width: 90%;

  &.modal-large {
    width: 500px;
    max-width: 95%;
  }
}

.modal-title {
  font-size: var(--font-xl);
  font-weight: 600;
  margin: 0 0 var(--spacing-md) 0;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}
</style>
