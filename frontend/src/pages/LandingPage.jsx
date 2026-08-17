import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sun, Wind, Map, CloudSun, Calculator, TrendingUp, Sliders, Award,
  FileText, GitCompare, CheckCircle2, ArrowRight, ShieldCheck, Layers,
  Mountain, Navigation, Sprout, DollarSign, Database, Users, ChevronRight,
  FolderKanban, MapPin, Activity, Check, Menu, X
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-orange-500 selection:text-white">
      
      {/* ── 1. PUBLIC STICKY NAVIGATION BAR ────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo & Name */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 p-1 flex items-center justify-center shadow-xs">
                <Sun className="w-5 h-5 text-orange-500" />
                <Wind className="w-4 h-4 text-sky-500 -ml-1" />
              </div>
              <div>
                <span className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  SOLAR & WIND <span className="text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-200 font-mono font-bold">ENGINE</span>
                </span>
                <p className="text-[10px] text-slate-500 hidden sm:block font-medium">Deployment Intelligence Engine</p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-8 text-xs font-medium text-slate-600">
              <button onClick={() => scrollToSection('home')} className="hover:text-orange-600 transition-colors">Home</button>
              <button onClick={() => scrollToSection('platform')} className="hover:text-orange-600 transition-colors">Platform</button>
              <button onClick={() => scrollToSection('how-it-works')} className="hover:text-orange-600 transition-colors">How It Works</button>
              <button onClick={() => scrollToSection('features')} className="hover:text-orange-600 transition-colors">Features</button>
              <button onClick={() => scrollToSection('stakeholders')} className="hover:text-orange-600 transition-colors">About</button>
            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-all shadow-xs"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <span>Register</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 text-xs shadow-md">
            <button onClick={() => scrollToSection('home')} className="block w-full text-left py-2 text-slate-700 hover:text-orange-600 font-medium">Home</button>
            <button onClick={() => scrollToSection('platform')} className="block w-full text-left py-2 text-slate-700 hover:text-orange-600 font-medium">Platform</button>
            <button onClick={() => scrollToSection('how-it-works')} className="block w-full text-left py-2 text-slate-700 hover:text-orange-600 font-medium">How It Works</button>
            <button onClick={() => scrollToSection('features')} className="block w-full text-left py-2 text-slate-700 hover:text-orange-600 font-medium">Features</button>
            <button onClick={() => scrollToSection('stakeholders')} className="block w-full text-left py-2 text-slate-700 hover:text-orange-600 font-medium">About</button>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link to="/login" className="w-full text-center py-2.5 rounded-xl bg-white border border-slate-200 font-semibold text-slate-700">Login</Link>
              <Link to="/register" className="w-full text-center py-2.5 rounded-xl bg-orange-500 font-bold text-white shadow-xs">Register</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── 2. HERO SECTION ────────────────────────────────────────────────── */}
      <section id="home" className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Subtle Ambient Glow Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-orange-200/20 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-amber-200/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-mono font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Deterministic GIS & Engineering Analysis</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Plan Smarter <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent">
                  Renewable Energy
                </span> Deployments
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed mx-auto lg:mx-0 font-normal">
                Evaluate solar and wind potential, assess site suitability, forecast energy generation, and identify the best deployment opportunities — all from one intelligent planning platform.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => scrollToSection('platform')}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm transition-all flex items-center justify-center space-x-2 shadow-xs"
                >
                  <span>Explore Platform</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Tech Badges */}
              <div className="pt-6 flex items-center justify-center lg:justify-start space-x-6 text-[11px] font-mono text-slate-500 font-medium">
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> PostGIS Spatial Engine</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-sky-600" /> Open-Meteo & NASA Telemetry</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-orange-600" /> 100% Deterministic</span>
              </div>
            </div>

            {/* Right Graphic / Interactive UI Mockup Card */}
            <div className="lg:col-span-5">
              <div className="relative p-6 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-5">
                {/* Header card pill */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 font-medium">
                    GIS COORDINATE GRID: 35.0123°N, 115.4567°W
                  </span>
                </div>

                {/* Main Card Overview Mockup */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-orange-50/50 border border-orange-200/80 space-y-1">
                    <div className="flex items-center justify-between text-slate-600 text-[11px] font-medium">
                      <span>Solar GHI Irradiance</span>
                      <Sun className="w-3.5 h-3.5 text-orange-500" />
                    </div>
                    <p className="text-lg font-bold font-mono text-orange-600">2,150 kWh/m²</p>
                    <span className="text-[10px] text-slate-400">NASA POWER Telemetry</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-sky-50/50 border border-sky-200/80 space-y-1">
                    <div className="flex items-center justify-between text-slate-600 text-[11px] font-medium">
                      <span>Wind Speed (100m)</span>
                      <Wind className="w-3.5 h-3.5 text-sky-600" />
                    </div>
                    <p className="text-lg font-bold font-mono text-sky-700">8.45 m/s</p>
                    <span className="text-[10px] text-slate-400">Open-Meteo Weather Grid</span>
                  </div>
                </div>

                {/* Score & Technology Recommendation Mockup */}
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-700 font-semibold">5-Factor Suitability Index</span>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300">
                      EXCELLENT (92.1 / 100)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full w-[92%]" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 font-mono">
                    <span>Tech Selection: <strong className="text-orange-600">HYBRID PV + WIND</strong></span>
                    <span>25-Yr AEP: <strong className="text-emerald-700">131,400 MWh</strong></span>
                  </div>
                </div>

                {/* GIS Layer Pill Strip */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                  <span className="flex items-center gap-1"><Layers className="w-3 h-3 text-sky-600" /> DEM Slope: 2.1°</span>
                  <span className="flex items-center gap-1"><Navigation className="w-3 h-3 text-orange-500" /> Substation: 4.2 km</span>
                  <span className="flex items-center gap-1"><Sprout className="w-3 h-3 text-emerald-600" /> Reserve Setback: OK</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. TRUST / VALUE STRIP ─────────────────────────────────────────── */}
      <section className="bg-white border-y border-slate-200 py-6 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
            {[
              { icon: Map, label: 'GIS-Enabled', color: 'text-sky-600' },
              { icon: CloudSun, label: 'Environmental Data', color: 'text-orange-500' },
              { icon: Sun, label: 'Solar Analysis', color: 'text-orange-600' },
              { icon: Wind, label: 'Wind Analysis', color: 'text-sky-600' },
              { icon: Calculator, label: 'Site Scoring', color: 'text-purple-600' },
              { icon: TrendingUp, label: 'Energy Forecasting', color: 'text-emerald-600' },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center space-x-2 text-xs font-semibold text-slate-700">
                  <Icon className={`w-4 h-4 ${item.color}`} />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 4. PLATFORM OVERVIEW (6 FEATURE CARDS) ────────────────────────── */}
      <section id="platform" className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-mono font-bold text-orange-700 uppercase tracking-wider bg-orange-50 px-3.5 py-1 rounded-full border border-orange-200">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Everything You Need to Evaluate a Renewable Energy Site
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-normal">
            Deterministic engineering equations and geospatial PostGIS spatial queries combined in a unified decision framework.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: CloudSun,
              title: '1. Environmental Intelligence',
              desc: 'Solar irradiance (GHI), 100m hub-height wind speed, ambient temperature, rainfall, humidity, and cloud cover telemetry.',
              color: 'text-orange-500',
              border: 'hover:border-orange-300',
            },
            {
              icon: Map,
              title: '2. GIS & Spatial Analysis',
              desc: 'DEM elevation profiles, slope angle constraints (<3° optimal), land cover, vegetation, road network, and 230kV grid substation proximity.',
              color: 'text-sky-600',
              border: 'hover:border-sky-300',
            },
            {
              icon: Sun,
              title: '3. Solar & Wind Analysis',
              desc: 'Calculate renewable resource potential, Wind Power Density (WPD in W/m²), peak sun hours, and annual energy output (AEP in MWh).',
              color: 'text-orange-600',
              border: 'hover:border-orange-300',
            },
            {
              icon: Calculator,
              title: '4. Site Suitability & Scoring',
              desc: 'Evaluate resource (35%), geographic (25%), infrastructure (15%), environmental (15%), and economic (10%) factors with exact MCDA score formulas.',
              color: 'text-purple-600',
              border: 'hover:border-purple-300',
            },
            {
              icon: TrendingUp,
              title: '5. Energy Forecasting',
              desc: 'Estimate 12-month seasonal variations and 25-year long-term annual generation and tariff revenue using 0.5%/yr degradation models.',
              color: 'text-emerald-600',
              border: 'hover:border-emerald-300',
            },
            {
              icon: Award,
              title: '6. Deployment Recommendations',
              desc: 'Compare technology choices (Solar PV vs Wind Turbines vs Hybrid) with rule-based CAPEX feasibility and payback horizon advice.',
              color: 'text-sky-600',
              border: 'hover:border-sky-300',
            },
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className={`p-6 rounded-2xl bg-white border border-slate-200 shadow-sm ${card.border} transition-all duration-300 space-y-4 group hover:shadow-md`}
              >
                <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">{card.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{card.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 5. HOW IT WORKS (VISUAL WORKFLOW) ─────────────────────────────── */}
      <section id="how-it-works" className="bg-white py-20 lg:py-28 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-mono font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
              End-to-End Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              From Site Selection to Deployment Decision
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Step-by-step engineering pipeline matching the actual platform execution workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative">
            {[
              { step: '01', title: 'Create Project', desc: 'Define project scope, regional boundary, target capacity (MW), and CAPEX budget.' },
              { step: '02', title: 'Select Deployment Site', desc: 'Add candidate site coordinates (latitude/longitude), land area, and elevation.' },
              { step: '03', title: 'Collect Environmental & GIS Data', desc: 'Fetch NASA POWER solar irradiance and Open-Meteo 100m wind telemetry.' },
              { step: '04', title: 'Analyze Solar & Wind Potential', desc: 'Run fluid mechanics wind power density and PV yield equations.' },
              { step: '05', title: 'Calculate Site Suitability', desc: 'Execute 5-factor weighted Multi-Criteria Decision Analysis (SSI score).' },
              { step: '06', title: 'Score & Forecast', desc: 'Model 12-month seasonal generation and 25-year revenue decay projections.' },
              { step: '07', title: 'Optimize Deployment', desc: 'Perform spatial MW density optimization based on terrain slope & buffer zones.' },
              { step: '08', title: 'Generate Recommendation', desc: 'Receive rule-based technology selection (Solar vs Wind vs Hybrid) and payback.' },
              { step: '09', title: 'Export Reports', desc: 'Generate binary PDF and Excel feasibility reports for decision-makers.' },
            ].map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 relative hover:border-orange-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black font-mono text-orange-500/40">{s.step}</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">{s.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. SOLAR + WIND SPLIT SECTION ─────────────────────────────────── */}
      <section id="features" className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-mono font-bold text-sky-700 uppercase tracking-wider bg-sky-50 px-3.5 py-1 rounded-full border border-sky-200">
            Dual Energy Modeling
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Integrated Solar PV & Wind Resource Engines
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Physics equations modeling solar photovoltaic performance and wind turbine power curves.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Solar Card */}
          <div className="p-8 rounded-3xl bg-white border border-orange-200 shadow-sm space-y-6 relative overflow-hidden">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center">
                <Sun className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">SOLAR ANALYSIS ENGINE</h3>
                <p className="text-xs text-slate-500 font-medium">Photovoltaic Physics Yield Model</p>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600">Solar Irradiance (GHI):</span>
                <span className="text-orange-600 font-bold">kWh/m²/day & Annual GHI</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600">Energy Output Formula:</span>
                <span className="text-emerald-700 font-bold">Capacity × PSH × 365 × PR</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600">Capacity Factor Target:</span>
                <span className="text-sky-700 font-bold">18.5% – 24.0%</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600">Resource Mapping:</span>
                <span className="text-purple-700 font-bold">NASA POWER Satellite Grid</span>
              </div>
            </div>
          </div>

          {/* Wind Card */}
          <div className="p-8 rounded-3xl bg-white border border-sky-200 shadow-sm space-y-6 relative overflow-hidden">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center">
                <Wind className="w-6 h-6 text-sky-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">WIND ANALYSIS ENGINE</h3>
                <p className="text-xs text-slate-500 font-medium">Fluid Mechanics Aerodynamic Model</p>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600">Wind Speed Telemetry:</span>
                <span className="text-sky-700 font-bold">100m Hub-Height Velocity (m/s)</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600">Wind Power Density:</span>
                <span className="text-orange-600 font-bold">WPD = 0.5 × ρ × v³ (W/m²)</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600">Pitch Control Capping:</span>
                <span className="text-emerald-700 font-bold">P_eff = min(P_aero, P_nameplate)</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600">Turbine Suitability:</span>
                <span className="text-purple-700 font-bold">IEC Class I to Class IV</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. GIS & SPATIAL VISUALIZATION SECTION ────────────────────────── */}
      <section className="bg-white py-20 lg:py-28 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-mono font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
                Interactive GIS Environment
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                See Renewable Potential on the Map
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Combine geographic, environmental and infrastructure information in a single interactive GIS environment.
              </p>

              <ul className="space-y-3 text-xs text-slate-700 font-medium">
                <li className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Interactive Maplibre/Leaflet spatial visualization canvas</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-sky-600 flex-shrink-0" />
                  <span>Candidate site location markers with popup analytics</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <span>Suitability heatmaps, solar GHI, and wind speed overlays</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span>Road network and 230kV grid substation infrastructure proximity layers</span>
                </li>
              </ul>

              <div className="pt-2">
                <Link
                  to="/register"
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm transition-all"
                >
                  <span>Explore the Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* GIS Map Visualization Graphic */}
            <div className="lg:col-span-6">
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-4 shadow-md relative">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center space-x-2">
                    <Map className="w-4 h-4 text-sky-600" />
                    <span className="text-xs font-bold text-slate-900">PostGIS Spatial Overlay Canvas</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300 font-bold">
                    LAYER: SUITABILITY HEATMAP
                  </span>
                </div>

                <div className="h-64 rounded-2xl bg-white border border-slate-200 relative overflow-hidden flex items-center justify-center shadow-xs">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.1),transparent_70%)]" />
                  {/* Grid Lines Mockup */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-60" />

                  {/* Marker 1 */}
                  <div className="absolute top-1/3 left-1/3 p-2 rounded-xl bg-white border border-orange-500 text-[10px] font-mono shadow-md flex items-center space-x-1.5 z-10">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
                    <span className="font-bold text-slate-900">Site Alpha (Score: 92.1)</span>
                  </div>

                  {/* Marker 2 */}
                  <div className="absolute bottom-1/4 right-1/3 p-2 rounded-xl bg-white border border-sky-400 text-[10px] font-mono shadow-md flex items-center space-x-1.5 z-10">
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <span className="font-bold text-slate-700">Site Beta (Score: 84.5)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. DECISION INTELLIGENCE PROGRESSION ──────────────────────────── */}
      <section className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-mono font-bold text-purple-700 uppercase tracking-wider bg-purple-50 px-3.5 py-1 rounded-full border border-purple-200">
            Decision Pipeline
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Turn Data Into Deployment Decisions
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Transparent, calculation-based decision pipeline converting raw environmental telemetry into actionable investment choices.
          </p>
        </div>

        {/* Horizontal Progression Chain */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center font-mono">
          {['DATA', 'ANALYSIS', 'SUITABILITY', 'SCORING', 'FORECAST', 'OPTIMIZATION', 'RECOMMENDATION'].map((step, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1 hover:border-orange-300 transition-colors">
              <span className="text-[10px] text-slate-400 block font-medium">STEP 0{idx + 1}</span>
              <span className="text-xs font-bold text-orange-600 block">{step}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 9. REPORTING SECTION ──────────────────────────────────────────── */}
      <section className="bg-white py-20 lg:py-28 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-mono font-bold text-orange-700 uppercase tracking-wider bg-orange-50 px-3.5 py-1 rounded-full border border-orange-200">
              Exportable Reports
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Generate Professional Project Reports
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Export comprehensive binary PDF document packages and formatted Excel workbooks for stakeholders and investors.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Site Assessment Report', desc: 'Full multi-criteria evaluation and coordinate analysis.' },
              { title: 'Feasibility Study Report', desc: 'Detailed CAPEX, revenue projections, and payback analysis.' },
              { title: 'Solar Potential Report', desc: 'GHI irradiance, PR performance, and annual yield breakdown.' },
              { title: 'Investment Return Report', desc: '25-year financial cash flow and energy forecast models.' },
            ].map((rep, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 hover:border-orange-300 transition-colors">
                <FileText className="w-6 h-6 text-orange-500" />
                <h4 className="text-sm font-bold text-slate-900">{rep.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{rep.desc}</p>
                <span className="text-[10px] font-mono text-emerald-700 font-bold block pt-2 border-t border-slate-200">
                  PDF & EXCEL FORMATS
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10. ROLE-BASED PLATFORM SECTION ───────────────────────────────── */}
      <section id="stakeholders" className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-mono font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
            Multi-Stakeholder Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Built for Every Project Stakeholder
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Tailored role perspectives providing customized workflows for each team discipline.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { role: 'Energy Planner', desc: 'Plan renewable deployment projects and evaluate candidate sites.', icon: Sun, color: 'text-orange-500' },
            { role: 'GIS Analyst', desc: 'Analyze spatial, terrain, slope angle, and infrastructure information.', icon: Map, color: 'text-sky-600' },
            { role: 'Project Manager', desc: 'Manage projects, sites, forecasts, and deployment decisions.', icon: FolderKanban, color: 'text-emerald-600' },
            { role: 'Administrator', desc: 'Manage users, roles, data sources, and system activity logs.', icon: ShieldCheck, color: 'text-purple-600' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 hover:border-orange-300 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <h4 className="text-base font-bold text-slate-900">{item.role}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 11. FINAL CTA ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-white border-t border-slate-200 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Ready to Find the Right Renewable Energy Site?
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Start evaluating solar and wind deployment opportunities with a unified GIS and data-driven planning platform.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md transition-all"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm transition-all shadow-xs"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* ── 12. FOOTER ────────────────────────────────────────────────────── */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center">
                <Sun className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <span className="font-bold text-slate-900">SOLAR & WIND</span>
                <p className="text-[10px] text-slate-500 font-medium">Deployment Intelligence Engine</p>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-xs text-slate-600 font-medium">
              <button onClick={() => scrollToSection('platform')} className="hover:text-orange-600">Platform</button>
              <button onClick={() => scrollToSection('how-it-works')} className="hover:text-orange-600">How It Works</button>
              <button onClick={() => scrollToSection('features')} className="hover:text-orange-600">Features</button>
              <Link to="/login" className="hover:text-orange-600">Login</Link>
              <Link to="/register" className="hover:text-orange-600">Register</Link>
            </div>

            <p className="text-[11px] font-mono text-slate-500">
              © 2026 Solar & Wind Deployment Intelligence Platform
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}

