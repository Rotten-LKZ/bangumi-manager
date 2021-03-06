<script setup lang="tsx">
import { dialog, path } from '@tauri-apps/api'
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElButton, ElMessage } from 'element-plus'
import FileManager from '../utils/filemanager'
import type { ACGN, Bangumi, Data } from '../utils/filemanager'

const lastBangumiFormPathNumber = ref(1)
const tableSearch = ref('')
const relativePath = ref('')
const dirs = ref<string[]>([])
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
const works = computed(() => {
  const results: Bangumi[] = []
  for (const work of data.value.works) {
    if (work.name.toLowerCase().includes(tableSearch.value.toLowerCase()))
      results.push(work)
  }
  return results
})

async function importFolder() {
  const res = await dialog.open({
    title: t('homePage.dialog.importFolder.title'),
    directory: true,
    multiple: false,
  })
  if (typeof res === 'string') {
    await manager.init({ folderPath: res })
    updateData()
    updateDirs()
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
    updateDirs()
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
  setFormToDefaultValues()
  showBangumiDialog.value = false
}

function closeDialog() {
  setFormToDefaultValues()
  showBangumiDialog.value = false
}

function setFormToDefaultValues() {
  bangumiForm.id = -1
  bangumiForm.name = ''
  bangumiForm.path = ''
  bangumiForm.tagStr = ''
  bangumiForm.tags = []
  bangumiForm.watched = false
  bangumiForm.type = 'anime'
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

function nameSearch(str: string, cb: any) {
  const results: { value: string }[] = []
  for (const work of manager.data.works) {
    if (work.name.toLowerCase().includes(str.toLowerCase()) && !results.includes({ value: work.name })) {
      let hasName = false
      for (const result of results) {
        if (result.value === work.name)
          hasName = true
      }
      if (!hasName)
        results.push({ value: work.name })
    }
  }
  cb(results)
}

function pathSearch(str: string, cb: any) {
  const results: { value: string }[] = []
  for (const dir of dirs.value) {
    if (dir.toLowerCase().includes(str.toLowerCase())) {
      results.push({
        value: dir,
      })
    }
  }
  cb(results)
}

async function updateDirs() {
  if (manager.isInit) {
    const folders = (await manager.getDirs(relativePath.value)).filter(value => value.children !== undefined)
    const foldersStr: string[] = []
    for (const folder of folders)
      foldersStr.push(folder.path.substring(manager.folderPath.replace(/\\/g, '/').endsWith('/') ? manager.folderPath.length : manager.folderPath.length + 1).replace(/\\/g, '/'))
    dirs.value = foldersStr
  }
}

function deleteTag(value: string) {
  const index = bangumiForm.tags.indexOf(value)
  if (index !== -1)
    bangumiForm.tags.splice(index, 1)
}

watch(() => bangumiForm.tagStr, () => {
  if (bangumiForm.tagStr.endsWith(' ')) {
    const tag = bangumiForm.tagStr.split(' ')[0]
    if (!bangumiForm.tags.includes(tag))
      bangumiForm.tags.push(bangumiForm.tagStr.split(' ')[0])
    bangumiForm.tagStr = ''
  }
})

watch(() => bangumiForm.path, () => {
  const paths = bangumiForm.path.split('/')
  if (paths.length !== lastBangumiFormPathNumber.value) {
    lastBangumiFormPathNumber.value = paths.length
    relativePath.value = paths.slice(0, paths.length - 1).join('/')
  }
})

watch(() => bangumiForm.id, () => {
  if (bangumiForm.id === -1) {
    relativePath.value = ''
  }
  else {
    const paths = manager.data.works[bangumiForm.id].relativePath.split('/')
    paths.splice(paths.length - 1, 1)
    relativePath.value = paths.join('/')
  }
})

watch(relativePath, updateDirs)
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
    <el-table :data="works" style="width: 100%">
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
          <el-tag v-for="(value, index) of scope.row.tags" :key="`show-table-${index}`" type="info">
            {{ value }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('homePage.table.operations')">
        <template #header>
          <el-input v-model="tableSearch" size="small" :placeholder="t('homePage.table.typeToSearch')" />
        </template>
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

  <el-dialog v-model="showBangumiDialog" :title="t('homePage.form.title')" @close="closeDialog">
    <el-form :model="bangumiForm">
      <el-form-item :label="t('homePage.table.name')">
        <el-autocomplete
          v-model="bangumiForm.name"
          :fetch-suggestions="nameSearch"
          :placeholder="t('homePage.table.name')"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item :label="t('homePage.table.path')">
        <el-autocomplete
          v-model="bangumiForm.path"
          :fetch-suggestions="pathSearch"
          :placeholder="t('homePage.table.path')"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item :label="t('homePage.table.tags')">
        <el-input v-model="bangumiForm.tagStr" :placeholder="t('homePage.table.tags')" autocomplete="off" />
        <el-tag v-for="(value, index) of bangumiForm.tags" :key="`dialog-form-${index}`" type="info" closable class="form-tags" @close="deleteTag(value)">
          {{ value }}
        </el-tag>
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
        <el-button @click="closeDialog">{{ t('cancel') }}</el-button>
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

.form-tags {
  margin-top: 3px;
}
</style>
