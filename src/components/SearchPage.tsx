import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  MapPin, 
  Calendar, 
  Tag, 
  Sparkles, 
  ChevronRight, 
  Bookmark, 
  RotateCcw,
  Camera,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { ReportItem, ItemCategory, CampusLocation } from '../types';
import { Card3D } from './Card3D';

interface SearchPageProps {
  reports: ReportItem[];
  campusLocations: CampusLocation[];
  onSelectItem: (item: ReportItem) => void;
  onOpenVisualSearch: () => void;
  onOpenReport: (type: 'lost' | 'found') => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  reports,
  campusLocations,
  onSelectItem,
  onOpenVisualSearch,
  onOpenReport,
}) => {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'lost' | 'found'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [savedSearches, setSavedSearches] = useState<string[]>([]);

  const categories: ItemCategory[] = [
    'ID card',
    'wallet',
    'mobile phone',
    'laptop',
    'earphones',
    'books',
    'bag',
    'keys',
    'clothing',
    'accessories',
    'documents',
    'electronics',
    'water bottle',
    'other'
  ];

  const filteredReports = useMemo(() => {
    let list = [...reports];

    if (typeFilter !== 'all') {
      list = list.filter(r => r.type === typeFilter);
    }
    if (categoryFilter !== 'all') {
      list = list.filter(r => r.category.toLowerCase() === categoryFilter.toLowerCase());
    }
    if (locationFilter !== 'all') {
      list = list.filter(r => r.locationId === locationFilter);
    }
    if (statusFilter !== 'all') {
      list = list.filter(r => r.status.toLowerCase() === statusFilter.toLowerCase());
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(r => 
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.locationName.toLowerCase().includes(q) ||
        (r.brand && r.brand.toLowerCase().includes(q)) ||
        (r.color && r.color.toLowerCase().includes(q)) ||
        r.id.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [reports, query, typeFilter, categoryFilter, locationFilter, statusFilter, sortBy]);

  const handleSaveSearch = () => {
    if (query.trim() && !savedSearches.includes(query.trim())) {
      setSavedSearches(prev => [query.trim(), ...prev.slice(0, 4)]);
    }
  };

  const handleResetFilters = () => {
    setQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setLocationFilter('all');
    setStatusFilter('all');
    setSortBy('newest');
  };

  return (
    <div className="space-y-6">
      {/* Top Search Controls Bar */}
      <div className="p-4 sm:p-6 rounded-3xl glass-panel shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by keywords, model, color, report ID, campus location..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
            />
          </div>

          {/* AI Visual Search Button */}
          <button
            onClick={onOpenVisualSearch}
            className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <Camera className="w-4 h-4" />
            <span>AI Visual Search</span>
          </button>

          {/* Save Search */}
          {query.trim() && (
            <button
              onClick={handleSaveSearch}
              title="Save current search"
              className="p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-all shrink-0 flex items-center gap-1.5 text-xs font-semibold"
            >
              <Bookmark className="w-4 h-4" />
              <span className="hidden md:inline">Save</span>
            </button>
          )}
        </div>

        {/* Saved Searches / Quick Suggestions */}
        {savedSearches.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto text-xs no-scrollbar pt-1">
            <span className="text-slate-400 font-semibold shrink-0">Saved Searches:</span>
            {savedSearches.map((s, i) => (
              <button
                key={i}
                onClick={() => setQuery(s)}
                className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-700 transition-all shrink-0"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Filters Matrix */}
        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Registry (Lost &amp; Found)</option>
            <option value="lost">Only Lost Items</option>
            <option value="found">Only Found Items</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>

          {/* Campus Location Filter */}
          <select
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200"
          >
            <option value="all">All GNIOT Locations</option>
            {campusLocations.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="possible match">Possible Match</option>
            <option value="claim pending">Claim Pending</option>
            <option value="resolved">Resolved / Reunited</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="title">Sort: Alphabetical</option>
          </select>
        </div>

        {/* View Switcher & Result Count */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
          <div className="flex items-center gap-2">
            <span>Showing <strong className="text-slate-900 dark:text-white">{filteredReports.length}</strong> items in registry</span>
            {(query || typeFilter !== 'all' || categoryFilter !== 'all' || locationFilter !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results View */}
      {filteredReports.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredReports.map(report => (
              <Card3D
                key={report.id}
                onClick={() => onSelectItem(report)}
                className="rounded-3xl glass-card border border-slate-200/90 dark:border-slate-800/90 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-md hover:shadow-xl cursor-pointer p-4 group"
              >
                <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-3.5">
                  <img
                    src={report.images[0]}
                    alt={report.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        report.type === 'lost'
                          ? 'bg-red-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {report.type}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-800 dark:text-slate-200">
                      {report.category}
                    </span>
                  </div>

                  <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-mono">
                    {report.id}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {report.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {report.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{report.locationName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{report.date}</span>
                    </div>
                  </div>
                </div>
              </Card3D>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReports.map(report => (
              <div
                key={report.id}
                onClick={() => onSelectItem(report)}
                className="p-4 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={report.images[0]}
                    alt={report.title}
                    className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          report.type === 'lost' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {report.type}
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-400">
                        {report.id}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {report.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {report.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {report.locationName}
                      </span>
                      <span>•</span>
                      <span>{report.date}</span>
                      {report.color && <span>• Color: {report.color}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                    View Details
                  </span>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="p-12 text-center rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Search className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
              No Matching Items Found
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              We couldn&apos;t find any records matching &quot;{query}&quot;. Try broadening your filters or register a report so our AI engine can alert you when found.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onOpenReport('lost')}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-all shadow-md"
            >
              Report as Lost Item
            </button>
            <button
              onClick={handleResetFilters}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
