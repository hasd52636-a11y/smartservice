import React from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  LayoutDashboard, Package, BarChart3, Settings as SettingsIcon,
  Search, Bell, User, BookOpen, MessageSquare,
  CheckCircle2
} from 'lucide-react';
import Dashboard from './Dashboard';
import ProjectList from './ProjectList';
import ProjectDetail from './ProjectDetail';
import Analytics from './Analytics';
import TicketManager from './TicketManager';
import Settings from './Settings';
import Diagnostics from './Diagnostics';
import KnowledgeBase from './KnowledgeBase';
import AdminDashboard from './AdminDashboard';
import ManualEvaluationPanel from './ManualEvaluationPanel';
import CoreRuleEditor from './CoreRuleEditor';
import { ProductProject } from '../types';

interface AdminLayoutProps {
  projects: ProductProject[];
  onAdd?: (name: string, description: string) => void;
  onUpdate?: (updated: ProductProject) => void;
  onToggleStatus?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const SidebarLink: React.FC<{
  to: string;
  icon: React.ReactNode;
  labelEn: string;
  labelZh: string;
}> = ({ to, icon, labelEn, labelZh }) => (
  <a
    href={to}
    className="flex items-center gap-4 px-5 py-4 text-slate-500 hover:bg-slate-100 hover:text-amber-500 rounded-2xl transition-all duration-500 group relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <span className="group-hover:scale-110 transition-transform z-10 group-hover:text-amber-500">{icon}</span>
    <div className="flex flex-col z-10">
      <span className="text-sm font-black tracking-wide text-slate-700 group-hover:text-amber-500 transition-colors uppercase">{labelZh}</span>
      <span className="text-[9px] opacity-50 uppercase font-black group-hover:opacity-100 group-hover:text-amber-600 transition-all">{labelEn}</span>
    </div>
  </a>
);

const Sidebar: React.FC<{ projects: ProductProject[] }> = ({ projects }) => (
  <div className="w-72 glass-card flex flex-col h-screen sticky top-0 z-20">
    <div className="p-8">
      <div className="flex items-center gap-3 text-violet-600 font-black text-2xl tracking-tight">
        <div className="purple-gradient-btn p-2 rounded-2xl text-white shadow-lg gold-border-glow">
          <MessageSquare size={24} />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-slate-800">AI虚拟客服</span>
          <span className="text-[10px] text-amber-500 uppercase font-black tracking-[0.2em] mt-1">AI Service</span>
        </div>
      </div>
    </div>

    <nav className="flex-1 px-4 space-y-2 mt-4">
      <SidebarLink to="/admin/dashboard" icon={<LayoutDashboard size={20} />} labelEn="Dashboard" labelZh="控制面板" />
      <SidebarLink to="/admin/projects" icon={<Package size={20} />} labelEn="Products" labelZh="产品管理" />
      <SidebarLink to="/admin/analytics" icon={<BarChart3 size={20} />} labelEn="Analytics" labelZh="数据分析" />
      <SidebarLink to="/admin/tickets" icon={<MessageSquare size={20} />} labelEn="Tickets" labelZh="工单管理" />
      <SidebarLink to="/admin/settings" icon={<SettingsIcon size={20} />} labelEn="API Settings" labelZh="API设置" />
      <SidebarLink to="/admin/diagnostics" icon={<CheckCircle2 size={20} />} labelEn="Diagnostics" labelZh="系统诊断" />
      <div className="px-5 py-2 mt-4">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">内容管理</span>
      </div>
      <SidebarLink to="/admin/knowledge" icon={<BookOpen size={20} />} labelEn="Knowledge Base" labelZh="知识库" />
      <SidebarLink to="/admin/search" icon={<Search size={20} />} labelEn="Smart Search" labelZh="智能搜索" />
    </nav>

    <div className="p-6 border-t border-slate-200">
      <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200 group hover:border-amber-500/30 transition-all">
        <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 flex items-center justify-between">
          PRO STATUS <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_#f59e0b]" />
        </div>
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden p-[1px] border border-slate-200">
          <div className="purple-gradient-btn h-full" style={{ width: `${Math.min((projects.length / 20) * 100, 100)}%` }} />
        </div>
        <p className="text-[10px] text-slate-500 mt-3 font-black uppercase tracking-tighter">{projects.length} / 20 Projects 已用项目</p>
      </div>
    </div>
  </div>
);

const AdminHeader: React.FC = () => (
  <header className="h-24 border-b border-slate-200 bg-white/80 flex items-center justify-between px-12 sticky top-0 z-10 backdrop-blur-2xl">
    <div className="flex items-center gap-4 bg-slate-100 border border-slate-200 px-6 py-3 rounded-2xl w-[450px] shadow-inner focus-within:border-amber-500/50 transition-all">
      <Search size={18} className="text-slate-500" />
      <input
        type="text"
        placeholder="搜索资产或向导 Search guide assets..."
        className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-500 font-medium"
      />
    </div>
    <div className="flex items-center gap-10">
      <button className="text-slate-500 hover:text-amber-500 transition-all relative">
        <Bell size={24} />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full border-4 border-white shadow-lg" />
      </button>
      <div className="flex items-center gap-5 pl-10 border-l border-slate-200">
        <div className="text-right">
          <p className="text-sm font-black text-slate-700 leading-none uppercase tracking-wide">Alex Merchant</p>
          <p className="text-[10px] text-amber-500 uppercase font-black mt-2 tracking-[0.2em] opacity-80">PRO Admin</p>
        </div>
        <div className="w-12 h-12 rounded-2xl purple-gradient-btn gold-border-glow flex items-center justify-center text-white shadow-2xl">
          <User size={24} />
        </div>
      </div>
    </div>
  </header>
);

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  projects,
  onAdd,
  onUpdate,
  onToggleStatus,
  onDelete
}) => {
  return (
    <>
      <Sidebar projects={projects} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        <main className="p-12 pb-24">
          <Routes>
            <Route path="/dashboard" element={<Dashboard projects={projects} />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/evaluation" element={<ManualEvaluationPanel />} />
            <Route path="/rules" element={<CoreRuleEditor />} />
            <Route path="/projects" element={
              <ProjectList
                projects={projects}
                onAdd={onAdd || (() => {})}
                onToggleStatus={onToggleStatus || (() => {})}
                onDelete={onDelete || (() => {})}
              />
            } />
            <Route path="/projects/:id" element={
              <ProjectDetail
                projects={projects}
                onUpdate={onUpdate || (() => {})}
              />
            } />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/tickets" element={<TicketManager />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/diagnostics" element={<Diagnostics />} />
            <Route path="/knowledge" element={<KnowledgeBase />} />
          </Routes>
        </main>
      </div>
    </>
  );
};

export default AdminLayout;
