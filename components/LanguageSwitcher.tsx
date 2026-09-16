"use client";
import {useI18n} from "./i18n";
export default function LanguageSwitcher(){const {lang,setLang}=useI18n();return <div className="lang-switch" aria-label="Language switcher"><button className={lang==="en"?"active":""} onClick={()=>setLang("en")}>EN</button><span>/</span><button className={lang==="vi"?"active":""} onClick={()=>setLang("vi")}>VI</button></div>}
