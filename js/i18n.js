// 国际化模块
class I18n {
    constructor() {
        this.currentLang = this.getDefaultLanguage();
       this.translations = window.TRANSLATIONS || TRANSLATIONS;
    }
    
    // get default language
    getDefaultLanguage() {
        const savedLang = localStorage.getItem('app-language');
        if (savedLang) return savedLang;
        
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.startsWith('zh')) {
            return 'zh-CN';
        } else {
            return 'en';
        }
    }
    
    // set language
    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLang = lang;
            localStorage.setItem('app-language', lang);
            this.updateUI();
        }
    }
    
    // get translation
    t(key) {
        const translation = this.translations[this.currentLang]?.[key];
        return translation || key;
    }
    
    // update UI
    updateUI() {
        // update document title
        document.title = this.t('app.title');
        
        // update header title and subtitle
        const headerTitle = document.querySelector('.header h1');
        if (headerTitle) headerTitle.textContent = this.t('app.title');
        
        const headerSubtitle = document.querySelector('.header p');
        if (headerSubtitle) headerSubtitle.textContent = this.t('app.subtitle');
        
        // update navigation tabs
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            const tabName = tab.dataset.tab;
            if (tabName) {
                tab.textContent = this.t(`nav.${tabName}`);
            }
        });
        
        // trigger custom event to notify other modules to update
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: this.currentLang }
        }));
    }
}

// create global instance
window.i18n = new I18n();