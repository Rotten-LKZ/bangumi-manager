<script setup lang="tsx">
import { dialog } from '@tauri-apps/api'
import { reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElButton, ElMessage } from 'element-plus'
import FileManager from '../utils/filemanager'
import type { ACGN, Bangumi, Data } from '../utils/filemanager'

const isInit = ref(false)
const showBangumiDialog = ref(false)
const data = ref<Data>({ works: [] })
const bangumiForm = reactive({
  id: -1,
  name: '',
  path: '',
  tagStr: '',
  tags: [] as string[],
  watched: false,
  type: 'anime' as ACGN,
})
const { t } = useI18n()
const manager = new FileManager()

async function importFolder() {
  const res = await dialog.open({
    title: t('homePage.dialog.importFolder.title'),
    directory: true,
    multiple: false,
  })
  if (typeof res === 'string') {
    await manager.init({ folderPath: res })
    updateData()
  }
}

async function importSettingsFile() {
  const res = await dialog.open({
    title: t('homePage.dialog.importSettingsFile.title'),
    filters: [{ name: 'JSON', extensions: ['json'] }],
    multiple: false,
  })
  if (typeof res === 'string') {
    await manager.init({ settingsFilePath: res })
    updateData()
  }
}

function confirmOne() {
  const { id, name, path, tags, watched, type } = bangumiForm
  if (!name || !path || !tags) {
    ElMessage({
      type: 'error',
      message: t('homePage.form.errors.nullValue'),
    })
    return
  }
  if (id === -1) {
    // New
    manager.data.works.push({
      id: manager.data.works.length,
      name,
      relativePath: path,
      tags,
      watched,
      type,
    })
  }
  else {
    // Edit
    manager.data.works[id] = {
      id,
      name,
      relativePath: path,
      tags,
      watched,
      type,
    }
  }
  updateData()

  // Change to default values
  bangumiForm.id = -1
  bangumiForm.name = ''
  bangumiForm.path = ''
  bangumiForm.tagStr = ''
  bangumiForm.tags = []
  bangumiForm.watched = false
  bangumiForm.type = 'anime'
  showBangumiDialog.value = false
}

function updateData() {
  data.value = JSON.parse(JSON.stringify(manager.data))
  manager.save()
}

function handleEdit(work: Bangumi) {
  bangumiForm.id = work.id
  bangumiForm.name = work.name
  bangumiForm.path = work.relativePath
  bangumiForm.tags = work.tags
  bangumiForm.watched = work.watched
  bangumiForm.type = work.type
  showBangumiDialog.value = true
}

function handleDelete(work: Bangumi) {
  manager.data.works.splice(work.id, 1)
  for (let i = 0; i < manager.data.works.length; i++)
    manager.data.works[i].id = i
  updateData()
}

watch([bangumiForm], () => {
  if (bangumiForm.tagStr.endsWith(' ')) {
    const tag = bangumiForm.tagStr.split(' ')[0]
    if (!bangumiForm.tags.includes(tag))
      bangumiForm.tags.push(bangumiForm.tagStr.split(' ')[0])
    bangumiForm.tagStr = ''
  }
})
</script>

<template>
  <div class="func">
    <el-dropdown trigger="click">
      <span class="el-dropdown-link">
        <el-button type="primary">
          {{ t('homePage.import') }}
        </el-button>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click="importFolder">
            {{ t('homePage.importFolder') }}
          </el-dropdown-item>
          <el-dropdown-item @click="importSettingsFile">
            {{ t('homePage.importSettingsFile') }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <el-button type="default" :disabled="!manager.isInit" @click="showBangumiDialog = true">
      {{ t('homePage.new') }}
    </el-button>
    <span class="path">{{ manager.settingsFilePath }}</span>
  </div>
  <div class="data-show">
    <el-table :data="data.works" style="width: 100%">
      <el-table-column :label="t('homePage.table.name')" width="350">
        <template #default="scope">
          <span>{{ scope.row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('homePage.table.path')" width="230">
        <template #default="scope">
          <span>{{ scope.row.relativePath }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('homePage.table.tags')" width="260">
        <template #default="scope">
          <span v-for="(value, index) of scope.row.tags" :key="`show-${index}`" class="tags">{{ value }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('homePage.table.operations')">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">
            {{ t('homePage.table.edit') }}
          </el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">
            {{ t('homePage.table.delete') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>

  <el-dialog v-model="showBangumiDialog" :title="t('homePage.form.title')">
    <el-form :model="bangumiForm">
      <el-form-item :label="t('homePage.table.name')">
        <el-input v-model="bangumiForm.name" :placeholder="t('homePage.table.name')" autocomplete="off" />
      </el-form-item>
      <el-form-item :label="t('homePage.table.path')">
        <el-input v-model="bangumiForm.path" :placeholder="t('homePage.table.path')" autocomplete="off" />
      </el-form-item>
      <el-form-item :label="t('homePage.table.tags')">
        <el-input v-model="bangumiForm.tagStr" :placeholder="t('homePage.table.tags')" autocomplete="off" />
        <span v-for="(value, index) of bangumiForm.tags" :key="index" class="tags form-tags">{{ value }}</span>
      </el-form-item>
      <el-form-item :label="t('homePage.form.tips.type')">
        <el-radio v-model="bangumiForm.type" label="anime">
          {{ t('homePage.form.tips.types.anime') }}
        </el-radio>
        <el-radio v-model="bangumiForm.type" label="comic">
          {{ t('homePage.form.tips.types.comic') }}
        </el-radio>
        <el-radio v-model="bangumiForm.type" label="novel">
          {{ t('homePage.form.tips.types.novel') }}
        </el-radio>
      </el-form-item>
      <el-form-item :label="t('homePage.form.tips.watched')">
        <el-checkbox v-model="bangumiForm.watched" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showBangumiDialog = false">{{ t('cancel') }}</el-button>
        <el-button type="primary" @click="confirmOne">{{ t('confirm') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style lang="scss">
.func {
  button, .path {
    margin-left: 10px;
  }
}

.tags {
  background-color: #f7f7f7;
  border: 1px solid #d6d5d5;
  border-radius: 5px;
  padding: 4px;
  margin-right: 7px;
  line-height: 1.2rem;
}

.form-tags {
  margin-top: 3px;
}
</style>
