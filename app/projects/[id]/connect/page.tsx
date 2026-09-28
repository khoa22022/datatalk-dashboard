'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, API } from '@/lib/api';
import type { Project } from '@/lib/account-types';
import { useProjects } from '@/components/ProjectProvider';
import { useI18n } from '@/components/i18n';
import { Check, ChevronRight, Copy, Globe2, ArrowRight, Mail, RefreshCw, UserRound, UsersRound } from 'lucide-react';

type Status = { connected:boolean; event_count:number; first_event_at:string|null; last_event:{created_at?:string}|null; setup:any };
type Installation = 'self'|'developer'|'handoff';
type Lang = 'en'|'vi';
type Guide = {title:string;description:string;steps:string[];tip:string};

const copy = {
  en: {
    activation:'PROJECT ACTIVATION', connect:'Connect', intro:'Follow the simplest path for your platform, then verify the first real event.',
    progressProject:'Project', progressConnect:'2 Connect', progressReady:'3 Ready', noDomain:'No domain provided', installerTitle:'Who will install DataTalk?',
    selfTitle:'I will install it', selfSub:'I can edit the website or app.', developerTitle:'I have a developer', developerSub:'Give them the technical checklist.',
    handoffTitle:'Send instructions', handoffSub:'Copy a ready-to-share handoff.', notTechnical:'Not technical?', notTechnicalSub:'You do not need to understand the code. Follow the guide or share it with your developer.',
    trackingCode:'DataTalk tracking code', copied:'Copied', copyCode:'Copy code', projectKey:'Project key', developerChecklist:'Developer checklist', developerIntro:'Send these requirements to your developer.',
    devStep1:'Add the DataTalk script to the app shell.', devStep2:'Use this project key:', devStep3:'Publish a build and open the website once.', copyDeveloper:'Copy developer checklist',
    handoffHeading:'Ready-to-share instructions', handoffIntro:'Copy this short brief and send it to whoever manages the website.', copyInstructions:'Copy instructions',
    handoffText:(name:string,key:string)=>`Please add DataTalk to ${name}. Project key: ${key}. Add the tracking script to the site head, publish it, then open the site once.`,
    handoffClipboard:(name:string,key:string,codeText:string)=>`Please add DataTalk to ${name}. Project key: ${key}. Add the tracking script to the site head, publish it, then open the site once. Return to DataTalk and check the connection.\n\nTracking code:\n${codeText}`,
    developerClipboard:(name:string,platform:string,key:string,codeText:string)=>`DataTalk project: ${name}\nPlatform: ${platform}\nProject key: ${key}\nAdd: ${codeText}\nThen publish and open the site once.`,
    goodToKnow:'Good to know', step02:'STEP 02', checkConnection:'Check your connection', checkIntro:'Publish the change, open your website, then come back here.',
    receiving:'DataTalk is receiving data', eventsReceived:(count:number)=>`${count} events received`, waiting:'Waiting for your first event', waitingSub:'We have not seen a real visit yet.',
    saved:'Saved', saveProgress:'Save setup progress', checking:'Checking...', check:'Check connection', openDashboard:'Open dashboard',
    verifyHelp:'If it still does not connect, make sure the website is published and the script was added to the site head.',
    loadError:'We could not load this project', retry:'Try again', loading:'Loading project setup...', saveError:'Could not save setup progress', verifyError:'Could not check connection', copyError:'Select the code below and copy it manually.'
  },
  vi: {
    activation:'KÍCH HOẠT DỰ ÁN', connect:'Kết nối', intro:'Làm theo hướng dẫn phù hợp nhất với nền tảng của bạn, sau đó xác nhận sự kiện thực tế đầu tiên.',
    progressProject:'Dự án', progressConnect:'2 Kết nối', progressReady:'3 Hoàn tất', noDomain:'Chưa có tên miền', installerTitle:'Ai sẽ cài DataTalk?',
    selfTitle:'Tôi sẽ tự cài', selfSub:'Tôi có thể chỉnh sửa website hoặc ứng dụng.', developerTitle:'Tôi có developer', developerSub:'Gửi checklist kỹ thuật cho developer.',
    handoffTitle:'Gửi hướng dẫn', handoffSub:'Sao chép nội dung sẵn để chuyển cho người phụ trách.', notTechnical:'Không rành kỹ thuật?', notTechnicalSub:'Bạn không cần hiểu đoạn code. Chỉ cần làm theo hướng dẫn hoặc gửi cho developer của bạn.',
    trackingCode:'Mã tracking DataTalk', copied:'Đã sao chép', copyCode:'Sao chép mã', projectKey:'Mã dự án', developerChecklist:'Checklist cho developer', developerIntro:'Gửi các yêu cầu này cho developer của bạn.',
    devStep1:'Thêm script DataTalk vào phần khung chính của ứng dụng.', devStep2:'Sử dụng mã dự án này:', devStep3:'Publish bản mới và mở website ít nhất một lần.', copyDeveloper:'Sao chép checklist',
    handoffHeading:'Hướng dẫn sẵn để gửi', handoffIntro:'Sao chép nội dung ngắn này và gửi cho người đang quản lý website.', copyInstructions:'Sao chép hướng dẫn',
    handoffText:(name:string,key:string)=>`Vui lòng cài DataTalk cho ${name}. Mã dự án: ${key}. Thêm script tracking vào phần head của website, publish thay đổi, sau đó mở website ít nhất một lần.`,
    handoffClipboard:(name:string,key:string,codeText:string)=>`Vui lòng cài DataTalk cho ${name}. Mã dự án: ${key}. Thêm script tracking vào phần head của website, publish thay đổi, sau đó mở website ít nhất một lần. Quay lại DataTalk để kiểm tra kết nối.\n\nMã tracking:\n${codeText}`,
    developerClipboard:(name:string,platform:string,key:string,codeText:string)=>`Dự án DataTalk: ${name}\nNền tảng: ${platform}\nMã dự án: ${key}\nThêm đoạn mã: ${codeText}\nSau đó publish và mở website ít nhất một lần.`,
    goodToKnow:'Lưu ý', step02:'BƯỚC 02', checkConnection:'Kiểm tra kết nối', checkIntro:'Publish thay đổi, mở website của bạn, sau đó quay lại màn hình này.',
    receiving:'DataTalk đang nhận dữ liệu', eventsReceived:(count:number)=>`Đã nhận ${count} sự kiện`, waiting:'Đang chờ sự kiện đầu tiên', waitingSub:'DataTalk chưa ghi nhận lượt truy cập thực tế nào.',
    saved:'Đã lưu', saveProgress:'Lưu tiến độ cài đặt', checking:'Đang kiểm tra...', check:'Kiểm tra kết nối', openDashboard:'Mở tổng quan',
    verifyHelp:'Nếu vẫn chưa kết nối, hãy kiểm tra website đã được publish và script đã được thêm vào phần head của website.',
    loadError:'Không thể tải thông tin dự án', retry:'Thử lại', loading:'Đang tải thiết lập dự án...', saveError:'Không thể lưu tiến độ cài đặt', verifyError:'Không thể kiểm tra kết nối', copyError:'Hãy chọn đoạn mã bên dưới và sao chép thủ công.'
  }
} as const;

const guides:Record<Lang,Record<string,Guide>> = {
  en:{
    Website:{title:'Website',description:'Add one small script to your published website.',steps:['Copy the DataTalk code below.','Paste it before the closing </head> tag.','Publish your website.','Return here and check the connection.'],tip:'If you use a website builder, the same script can usually be added in the custom code or head area.'},
    'Web App':{title:'React / Next.js',description:'Add the DataTalk SDK once at the app shell.',steps:['Add the DataTalk script to the root layout or document head.','Publish the latest build.','Open the app and visit one page.','Return here and check the connection.'],tip:'Use the developer handoff if someone else manages deployment.'},
    'Mobile App':{title:'Mobile app',description:'Native mobile SDK support is planned.',steps:['Keep the project created.','Share the project key with your developer.','Native SDK setup will be enabled in a later release.'],tip:'Do not paste the web script into a native mobile app.'},
    'Figma Site':{title:'Figma Site',description:'Use the published site custom-code area.',steps:['Open your published Figma Site settings.','Add the script to the custom code / head area.','Publish the site.','Return here and check the connection.'],tip:'A design-only prototype that is not published cannot send real website events.'}
  },
  vi:{
    Website:{title:'Website',description:'Chỉ cần thêm một script nhỏ vào website đã publish.',steps:['Sao chép mã DataTalk bên dưới.','Dán mã trước thẻ đóng </head>.','Publish website.','Quay lại đây và kiểm tra kết nối.'],tip:'Nếu dùng website builder, bạn thường có thể thêm script này trong mục Custom Code hoặc phần Head.'},
    'Web App':{title:'React / Next.js',description:'Thêm DataTalk SDK một lần ở phần khung chính của ứng dụng.',steps:['Thêm script DataTalk vào root layout hoặc document head.','Deploy bản build mới nhất.','Mở ứng dụng và truy cập ít nhất một trang.','Quay lại đây và kiểm tra kết nối.'],tip:'Nếu người khác phụ trách deploy, hãy dùng lựa chọn gửi checklist cho developer.'},
    'Mobile App':{title:'Ứng dụng di động',description:'SDK native cho mobile sẽ được hỗ trợ ở phiên bản sau.',steps:['Giữ nguyên dự án đã tạo.','Gửi mã dự án cho developer.','Thiết lập SDK native sẽ được mở ở phiên bản sau.'],tip:'Không dán script dành cho website vào ứng dụng mobile native.'},
    'Figma Site':{title:'Figma Site',description:'Sử dụng khu vực Custom Code của Figma Site đã publish.',steps:['Mở phần cài đặt của Figma Site đã publish.','Thêm script vào Custom Code / vùng Head.','Publish site.','Quay lại đây và kiểm tra kết nối.'],tip:'Prototype chỉ ở chế độ thiết kế và chưa publish sẽ không thể gửi sự kiện website thực tế.'}
  }
};

export default function ConnectProject(){
  const {id}=useParams<{id:string}>();
  const router=useRouter();
  const projectScope=useProjects();
  const {lang}=useI18n();
  const c=copy[lang];
  const [project,setProject]=useState<Project|null>(null);
  const [status,setStatus]=useState<Status|null>(null);
  const [error,setError]=useState('');
  const [copied,setCopied]=useState(false);
  const [checking,setChecking]=useState(false);
  const [saved,setSaved]=useState(false);
  const [installation,setInstallation]=useState<Installation>('self');

  useEffect(()=>{
    let alive=true;
    Promise.all([api<Project>(`/api/projects/${id}`),api<Status>(`/api/projects/${id}/tracking/status`)]).then(([p,s])=>{
      if(!alive)return;
      setProject(p);setStatus(s);
      const existing=s.setup?.installation_type;
      if(existing==='self'||existing==='developer'||existing==='handoff')setInstallation(existing);
    }).catch(()=>{if(alive)setError(c.loadError)});
    return()=>{alive=false};
  },[id,c.loadError]);

  const guide=useMemo(()=>guides[lang][project?.platform || 'Website'] || guides[lang].Website,[lang,project?.platform]);
  if(error&&!project)return <div className="card onboarding-error"><h2>{c.loadError}</h2><p>{error}</p><button className="btn outline" onClick={()=>location.reload()}>{c.retry}</button></div>;
  if(!project || !status)return <div className="card onboarding-error" role="status">{c.loading}</div>;

  const projectId=project.id;
  const code=`<script defer src="${API}/sdk/datatalk.js" data-project="${project.tracking_key}"></script>`;

  async function saveSetup(setupStep:string){
    try{
      setError('');
      await api(`/api/projects/${projectId}/tracking/setup`,{method:'PATCH',body:JSON.stringify({installation_type:installation,setup_step:setupStep})});
      setSaved(true);
    }catch{setError(c.saveError)}
  }

  async function verify(){
    setChecking(true);setError('');setSaved(false);
    try{
      const next=await api<Status>(`/api/projects/${projectId}/tracking/status`);
      setStatus(next);
      const setupStep=next.connected?'active':'installed';
      await api(`/api/projects/${projectId}/tracking/setup`,{method:'PATCH',body:JSON.stringify({installation_type:installation,setup_step:setupStep,first_event_at:next.first_event_at})});
    }catch{setError(c.verifyError)}
    finally{setChecking(false)}
  }

  async function copyText(text:string){
    try{await navigator.clipboard.writeText(text);setCopied(true)}catch{setError(c.copyError)}
  }

  return <div className="onboarding">
    <div className="onboarding-header"><div><span className="eyebrow">{c.activation}</span><h1>{c.connect} {project.name}</h1><p>{c.intro}</p></div><div className="onboarding-progress"><span className="done"><Check size={14}/>{c.progressProject}</span><ChevronRight size={14}/><span className="active">{c.progressConnect}</span><ChevronRight size={14}/><span>{c.progressReady}</span></div></div>
    <div className="onboarding-grid">
      <aside className="onboarding-side"><div className="setup-summary"><div className="platform-icon"><Globe2 size={21}/></div><strong>{project.platform}</strong><span>{project.domain || c.noDomain}</span></div><h3>{c.installerTitle}</h3>
        <button className={`install-choice ${installation==='self'?'selected':''}`} onClick={()=>{setInstallation('self');setSaved(false)}}><UserRound size={18}/><span><b>{c.selfTitle}</b><small>{c.selfSub}</small></span></button>
        <button className={`install-choice ${installation==='developer'?'selected':''}`} onClick={()=>{setInstallation('developer');setSaved(false)}}><UsersRound size={18}/><span><b>{c.developerTitle}</b><small>{c.developerSub}</small></span></button>
        <button className={`install-choice ${installation==='handoff'?'selected':''}`} onClick={()=>{setInstallation('handoff');setSaved(false)}}><Mail size={18}/><span><b>{c.handoffTitle}</b><small>{c.handoffSub}</small></span></button>
        <div className="setup-help"><strong>{c.notTechnical}</strong><span>{c.notTechnicalSub}</span></div>
      </aside>
      <section className="onboarding-main">
        {error&&<div className="account-alert error" role="alert">{error}</div>}
        <div className="onboarding-card"><div className="onboarding-card-head"><div><span className="step-number">01</span><h2>{guide.title}</h2><p>{guide.description}</p></div></div>
          {installation==='self'&&<><div className="guide-steps">{guide.steps.map((text,index)=><div className="guide-step" key={text}><span>{index+1}</span><p>{text}</p></div>)}</div>{project.platform!=='Mobile App'&&<div className="code-block-wrap"><div className="code-block-head"><span>{c.trackingCode}</span><button onClick={()=>void copyText(code)}><Copy size={15}/>{copied?c.copied:c.copyCode}</button></div><pre className="code code-block">{code}</pre><div className="tracking-key-row"><span>{c.projectKey}</span><code>{project.tracking_key}</code></div></div>}</>}
          {installation==='developer'&&<div className="handoff-card"><h3>{c.developerChecklist}</h3><p>{c.developerIntro}</p><ol><li>{c.devStep1}</li><li>{c.devStep2} <code>{project.tracking_key}</code></li><li>{c.devStep3}</li></ol><button className="btn primary" onClick={()=>void copyText(c.developerClipboard(project.name,project.platform,project.tracking_key,code))}><Copy size={15}/>{c.copyDeveloper}</button></div>}
          {installation==='handoff'&&<div className="handoff-card"><h3>{c.handoffHeading}</h3><p>{c.handoffIntro}</p><div className="share-copy">{c.handoffText(project.name,project.tracking_key)}</div><button className="btn primary" onClick={()=>void copyText(c.handoffClipboard(project.name,project.tracking_key,code))}><Copy size={15}/>{c.copyInstructions}</button></div>}
          <div className="guide-tip"><strong>{c.goodToKnow}</strong><span>{guide.tip}</span></div>
        </div>
        <div className="verify-card"><div><span className="eyebrow">{c.step02}</span><h2>{c.checkConnection}</h2><p>{c.checkIntro}</p></div><div className={`connection-result ${status.connected?'connected':'pending'}`}>{status.connected?<><Check size={20}/><div><strong>{c.receiving}</strong><span>{c.eventsReceived(status.event_count)}</span></div></>:<><RefreshCw size={20}/><div><strong>{c.waiting}</strong><span>{c.waitingSub}</span></div></>}</div><div className="verify-actions"><button className="btn outline" onClick={()=>void saveSetup(status.connected?'verified':'installed')} disabled={saved}><Check size={15}/>{saved?c.saved:c.saveProgress}</button><button className="btn primary" onClick={()=>void verify()} disabled={checking}>{checking?c.checking:c.check}<ArrowRight size={15}/></button>{status.connected&&<button className="btn primary" onClick={()=>{projectScope.select(projectId);router.push('/dashboard')}}>{c.openDashboard}</button>}</div>{!status.connected&&<div className="verify-help">{c.verifyHelp}</div>}</div>
      </section>
    </div>
  </div>;
}
