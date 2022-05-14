import { createI18n } from 'vue-i18n'
import zhCn from './zhCn'
import en from './en'

export const i18n = createI18n({
  locale: 'en',
  messages: { en, zhCn },
})
