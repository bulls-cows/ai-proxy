<template>
  <!-- DialogEditProfile - 配置方案编辑弹窗 -->
  <Teleport to="body">
    <!-- 模态框遮罩层 -->
    <div v-if="modelValue" class="modal-overlay" @click.self="handleClose">
      <!-- 模态框主体 -->
      <div class="modal modal-large">
        <!-- 模态框标题 -->
        <h3 class="modal-title">
          {{ isEditMode ? '编辑方案' : '新建方案' }}
        </h3>
        <!-- 配置表单 -->
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
          <!-- 表单行：最大重试次数 & 重试延迟 -->
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
        <!-- 操作按钮组 -->
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
/**
 * DialogEditProfile.vue - 配置方案编辑弹窗组件
 *
 * 业务职责：
 * - 提供新建和编辑配置方案的表单界面
 * - 支持配置代理基本信息：方案名称、本地端口、目标地址
 * - 支持配置重试策略：最大重试次数、重试延迟、重试状态码
 * - 支持删除配置方案（编辑模式下）
 *
 * 数据流向：
 * - 通过 props 接收编辑模式和现有配置数据
 * - 通过 emits 发送保存、创建、删除事件
 *
 * @author Auto Generated
 * @since 2026-05-24
 */
import { ref, computed, watch } from 'vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import type { ProxyProfile } from '@/stores/config'

// 表单数据类型（包含可选 id）
type ProfileFormData = Omit<ProxyProfile, 'id'> & { id?: string }

// Props 定义
interface Props {
  // modelValue: 弹窗显示状态
  modelValue: boolean
  // profile: 要编辑的配置方案（null 表示新建模式）
  profile?: ProxyProfile | null
  // showDeleteButton: 是否显示删除按钮
  showDeleteButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  profile: null,
  showDeleteButton: true,
})

// Emits 定义
const emit = defineEmits<{
  // update:modelValue: 弹窗显示状态变更
  'update:modelValue': [value: boolean]
  // save: 保存配置方案事件
  save: [profile: ProxyProfile]
  // create: 新建配置方案事件
  create: [profile: Omit<ProxyProfile, 'id'>]
  // delete: 删除配置方案事件
  delete: [id: string]
}>()

// 默认表单数据工厂函数
const defaultProfile = (): ProfileFormData => ({
  name: '',
  local_port: 3000,
  target_base_url: '',
  max_retries: 3,
  retry_delay_ms: 1000,
  retry_status_codes: [429, 500, 502, 503, 504],
})

// ref: 表单数据
const formData = ref<ProfileFormData>(defaultProfile())

// computed: 是否为编辑模式
const isEditMode = computed(() => props.profile !== null)

// computed: 重试状态码文本（用于输入框显示）
const retryCodesText = computed({
  get: () => formData.value.retry_status_codes.join(','),
  set: (val: string) => {
    formData.value.retry_status_codes = val
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n))
  },
})

// watch: 监听 modelValue 变化，打开弹窗时重置表单
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

/**
 * 关闭弹窗
 */
function handleClose() {
  emit('update:modelValue', false)
}

/**
 * 提交表单
 */
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

/**
 * 删除配置方案
 */
function handleDelete() {
  if (props.profile) {
    emit('delete', props.profile.id)
  }
}
</script>

<style lang="scss" scoped>
/* 模态框遮罩层 */
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

/* 模态框容器 */
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

/* 模态框标题 */
.modal-title {
  font-size: var(--font-xl);
  font-weight: 600;
  margin: 0 0 var(--spacing-md) 0;
}

/* 配置表单 */
.config-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

/* 表单行 */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

/* 操作按钮组 */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}
</style>
