<script setup lang="ts">
import { window as tauriWindow } from '@tauri-apps/api'
import { ElConfigProvider } from 'element-plus'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import zhCn from 'element-plus/lib/locale/lang/zh-cn'
import en from 'element-plus/lib/locale/lang/en'

import TranslateIcon from './assets/icons/TranslateIcon.vue'
import Home from './pages/Home.vue'

const lang = ref('en')
const { t, locale } = useI18n({ useScope: 'global' })

function toggleLang() {
  const newLang = lang.value === 'en' ? 'zhCn' : 'en'
  locale.value = newLang
  lang.value = newLang
  tauriWindow.getCurrent().setTitle(t('title'))
}
</script>

<template>
  <ElConfigProvider :locale="lang === 'en' ? en : zhCn">
    <div class="basic">
      <div class="main">
        <Home />
        <TranslateIcon @click="toggleLang" />
      </div>
    </div>
  </ElConfigProvider>
</template>

<style lang="scss">
body {
  margin: 0;
  padding: 0;
}

.basic {
  height: 100vh;

  .main {
    padding: $main-padding $main-padding 0px $main-padding;
    position: relative;

    .bi-translate {
      transform: scale(2.6);
      position: absolute;
      right: 20px;
      top: 20px;
      z-index: 99;
    }

    .bi-translate:hover {
      cursor: pointer;
    }
  }
}
</style>
