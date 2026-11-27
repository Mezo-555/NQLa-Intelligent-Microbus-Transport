import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Activity, Bell, BusFront, ChevronDown, CircleHelp, ClipboardList, Command,
  LayoutDashboard, Map, MapPinned, Menu, Route, ShieldCheck, Users, X,
  ChartNoAxesCombined, FlaskConical, UserRound, BrainCircuit, ArrowLeft,
} from 'lucide-react';
import { simulateNextReadError } from '../data/mockAdminApi';

const navigation = [
  { label: 'الرئيسية', path: '/', icon: LayoutDashboard, end: true, section: 'نظرة عامة' },
  { label: 'السائقون', path: '/drivers', icon: BusFront, section: 'إدارة التشغيل' },
  { label: 'الركاب', path: '/passengers', icon: Users, section: 'إدارة التشغيل' },
  { label: 'الطلبات', path: '/requests', icon: ClipboardList, section: 'إدارة التشغيل' },
  { label: 'الرحلات', path: '/trips', icon: Route, section: 'إدارة التشغيل' },
  { label: 'الخريطة التشغيلية', path: '/map', icon: MapPinned, section: 'التخطيط والتحليل' },
  { label: 'المسارات والمحطات', path: '/routes', icon: Map, section: 'التخطيط والتحليل' },
  { label: 'التقارير', path: '/reports', icon: ChartNoAxesCombined, section: 'التخطيط والتحليل' },
  { label: 'ذكاء التشغيل', path: '/ai-insights', icon: BrainCircuit, section: 'الذكاء الاصطناعي' },
];

const pageTitles: Record<string, { title: string; crumb: string }> = {
  '/': { title: 'مركز التشغيل', crumb: 'نظرة عامة' },
  '/drivers': { title: 'إدارة السائقين', crumb: 'إدارة التشغيل' },
  '/passengers': { title: 'إدارة الركاب', crumb: 'إدارة التشغيل' },
  '/requests': { title: 'الطلبات الواردة', crumb: 'إدارة التشغيل' },
  '/trips': { title: 'متابعة الرحلات', crumb: 'إدارة التشغيل' },
  '/map': { title: 'الخريطة التشغيلية', crumb: 'التخطيط والتحليل' },
  '/routes': { title: 'المسارات والمحطات', crumb: 'التخطيط والتحليل' },
  '/reports': { title: 'التقارير والتحليلات', crumb: 'التخطيط والتحليل' },
  '/ai-insights': { title: 'ذكاء التشغيل', crumb: 'الذكاء الاصطناعي' },
};

export function AdminLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [demoToolsOpen, setDemoToolsOpen] = useState(false);
  const current = pageTitles[location.pathname] ?? pageTitles['/'];
  const today = new Intl.DateTimeFormat('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  const sidebar = (
    <>
      <div className="brand-lockup">
        <div className="brand-mark"><BusFront size={23} strokeWidth={2.5} /><span className="brand-mark-dot" /></div>
        <div className="brand-word"><strong>NQLa</strong><span>لوحة الإدارة</span></div>
        <span className="brand-version">ADMIN</span>
      </div>
      <div className="admin-identity">
        <div className="identity-avatar"><UserRound size={22} /></div>
        <div className="identity-copy"><strong>مشرف تجريبي</strong><span><i /> جلسة محلية</span></div>
        <ChevronDown size={16} />
      </div>
      <nav className="side-navigation" aria-label="التنقل الرئيسي">
        {['نظرة عامة', 'إدارة التشغيل', 'التخطيط والتحليل', 'الذكاء الاصطناعي'].map((section) => {
          const items = navigation.filter((item) => item.section === section);
          return <div className="nav-section" key={section}>
            <div className="nav-section-label">{section}</div>
            {items.map(({ label, path, icon: Icon, end }) => <NavLink
              key={path}
              to={path}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            ><Icon size={19} strokeWidth={1.9} /><span>{label}</span>{path === '/requests' && <span className="nav-count">3</span>}</NavLink>)}
          </div>;
        })}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-live-card"><span className="live-icon"><Activity size={16} /></span><div><strong>واجهة العرض جاهزة</strong><small>بيانات تجريبية محلية</small></div><span className="pulse-dot" /></div>
        <button className="sidebar-help" onClick={() => window.alert('مركز المساعدة التجريبي — سيتم ربط الدعم لاحقًا.')}><CircleHelp size={17} /><span>مركز المساعدة</span></button>
        <div className="sidebar-foot"><ShieldCheck size={14} /><span>بيئة تجريبية آمنة</span><Command size={13} /></div>
      </div>
    </>
  );

  return <div className="admin-shell" dir="rtl">
    {mobileOpen && <button className="mobile-scrim" aria-label="إغلاق القائمة" onClick={() => setMobileOpen(false)} />}
    <aside className={`admin-sidebar${mobileOpen ? ' mobile-open' : ''}`}>
      <button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="إغلاق القائمة"><X size={20} /></button>
      {sidebar}
    </aside>
    <main className="admin-main">
      <header className="topbar">
        <div className="topbar-page">
          <button className="mobile-menu" aria-label="فتح القائمة" onClick={() => setMobileOpen(true)}><Menu size={21} /></button>
          <div className="breadcrumb"><span>NQLa</span><b>/</b><span>{current.crumb}</span><b>/</b><strong>{current.title}</strong></div>
        </div>
        <div className="topbar-actions">
          <div className="topbar-date"><span>اليوم</span><strong>{today}</strong></div>
          <div className="topbar-divider" />
          <button className={`icon-button notification-button${notificationsOpen ? ' active' : ''}`} aria-label="الإشعارات" onClick={() => setNotificationsOpen((value) => !value)}><Bell size={19} /><i /></button>
          <button className={`demo-mode${demoToolsOpen ? ' active' : ''}`} aria-expanded={demoToolsOpen} onClick={() => setDemoToolsOpen((value) => !value)}><span />وضع تجريبي <ChevronDown size={13} /></button>
        </div>
        {notificationsOpen && <div className="notification-popover"><div className="popover-heading"><strong>تنبيهات العرض</strong><span>٣ أمثلة</span></div><Link className="notification-row" to="/ai-insights?tab=governance" onClick={() => setNotificationsOpen(false)}><span className="notification-icon amber"><Activity size={16} /></span><div><b>فجوة مقاعد توضيحية</b><small>عينة عجز في العصافرة</small></div><time>Demo</time></Link><Link className="notification-row" to="/ai-insights?tab=governance" onClick={() => setNotificationsOpen(false)}><span className="notification-icon blue"><MapPinned size={16} /></span><div><b>حداثة بيانات الموقع</b><small>أحد المواقع التجريبية قديم</small></div><time>Demo</time></Link><Link className="notification-row" to="/ai-insights?tab=governance" onClick={() => setNotificationsOpen(false)}><span className="notification-icon teal"><ShieldCheck size={16} /></span><div><b>مراجعة بشرية مطلوبة</b><small>إشارة تصنيف تجريبية، ليست إثباتًا</small></div><time>Demo</time></Link><Link className="popover-footer" to="/ai-insights?tab=governance" onClick={() => setNotificationsOpen(false)}>فتح مركز التنبيهات <ArrowLeft size={14} /></Link></div>}
        {demoToolsOpen && <div className="demo-tools-popover"><div className="popover-heading"><strong>أدوات العرض</strong><span>محاكاة</span></div><p>اختبر حالات الواجهة دون Backend.</p><button onClick={() => { simulateNextReadError(); setDemoToolsOpen(false); window.alert('تم تجهيز خطأ تجريبي لمرة واحدة. افتح صفحة أخرى ثم استخدم «إعادة المحاولة».'); }}><FlaskConical size={17} /><span><b>محاكاة خطأ تحميل</b><small>يظهر عند فتح الصفحة التالية فقط</small></span></button></div>}
      </header>
      <section className="page-content"><Outlet /></section>
      <footer className="admin-footer"><span>© 2026 NQLa · لوحة إدارة النقل الذكي</span><span>نسخة العرض التجريبية <b>0.1</b></span></footer>
    </main>
  </div>;
}
