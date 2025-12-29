import React, { useState, useEffect } from "react";
import leadService, { Lead, CreateLeadData, UpdateLeadData } from "../services/leadsService";
import LeadForm from "./LeadForm";
import GDPiliaComposer from "./GDPiliaComposer";
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  FunnelIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import StatusBadge from "./StatusBadge";

type Status = "to_be_treated" | "qualified" | "archived";

const Leads: React.FC<{ searchTerm?: string }> = ({ searchTerm }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [filterLocation, setFilterLocation] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "">("");
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch leads from API with filters
  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      try {
        const filters: any = {
          full_name: searchTerm,
          location: filterLocation,
          company: filterCompany,
          position: filterPosition,
          status: filterStatus,
        };
        const response = await leadService.filterLeads(filters);
        setLeads(response.data);
      } catch {
        setError("Failed to fetch leads");
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, [searchTerm, filterLocation, filterCompany, filterPosition, filterStatus]);

  // Compute filtered & sorted leads
  const filteredLeads = [...leads].filter((lead) => {
    return (
      (filterStatus ? lead.status === filterStatus : true) &&
      (filterCompany ? lead.company.toLowerCase().includes(filterCompany.toLowerCase()) : true) &&
      (filterPosition ? lead.position.toLowerCase().includes(filterPosition.toLowerCase()) : true) &&
      (filterLocation ? lead.location.toLowerCase().includes(filterLocation.toLowerCase()) : true)
    );
  });

  const sortedLeads = filteredLeads.sort((a, b) =>
    sortNewestFirst
      ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const totalPages = Math.ceil(sortedLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLeads = sortedLeads.slice(startIndex, endIndex);

 const handleSaveLead = async (leadData: CreateLeadData | UpdateLeadData) => {
  try {
    if (editingLead) {
      const updatedLead = await leadService.updateLead(editingLead.id, leadData as UpdateLeadData);
      setLeads(leads.map((l) => (l.id === editingLead.id ? updatedLead : l)));
    } else {
      const newLead = await leadService.createLead(leadData as CreateLeadData);
      setLeads([newLead, ...leads]);
    }
    setIsModalOpen(false);
    setEditingLead(null);
  } catch (error: any) { // Add error parameter
    console.error('Save lead error:', error); // Log the error
    setError(`Failed to save lead: ${error.message || 'Unknown error'}`);
  }
};

  const handleDeleteLead = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this lead?")) return;
    try {
      await leadService.deleteLead(id);
      setLeads(leads.filter((lead) => lead.id !== id));
      if (currentLeads.length === 1 && currentPage > 1) setCurrentPage(currentPage - 1);
    } catch {
      setError("Failed to delete lead");
    }
  };

  const handleStatusChange = async (id: number, status: Status) => {
    try {
      const updatedLead = await leadService.updateLead(id, { status });
      setLeads(leads.map((lead) => (lead.id === id ? updatedLead : lead)));
    } catch (err) {
      console.error("Failed to update lead status:", err);
    }
  };

  const goToPage = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  const resetFilters = () => {
    setFilterLocation("");
    setFilterCompany("");
    setFilterPosition("");
    setFilterStatus("");
    setCurrentPage(1);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leads...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="text-center p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      </div>
    );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="mt-2 text-sm text-gray-700">A list of all leads including their details</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              showFilters ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
            {(filterLocation || filterCompany || filterPosition || filterStatus) && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">Active</span>
            )}
          </button>
          <button
            onClick={() => {
              setEditingLead(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-500">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input
                type="text"
                value={filterCompany}
                onChange={(e) => {
                  setFilterCompany(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Filter by company..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <input
                type="text"
                value={filterPosition}
                onChange={(e) => {
                  setFilterPosition(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Filter by position..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={filterLocation}
                onChange={(e) => {
                  setFilterLocation(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Filter by location..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {/* Status & Sort */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value as Status | "");
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Statuses</option>
                  <option value="to_be_treated">To be treated</option>
                  <option value="qualified">Qualified</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <button
                  onClick={() => setSortNewestFirst(!sortNewestFirst)}
                  className={`w-full px-3 py-2 border rounded-md text-sm font-medium flex items-center justify-center ${
                    sortNewestFirst ? "bg-purple-50 border-purple-300 text-purple-700" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {sortNewestFirst ? (
                    <>
                      <ArrowDownIcon className="h-4 w-4 mr-2" />
                      Newest First
                    </>
                  ) : (
                    <>
                      <ArrowUpIcon className="h-4 w-4 mr-2" />
                      Oldest First
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{filteredLeads.length}</span> leads found
              {filteredLeads.length !== leads.length && ` (filtered from ${leads.length} total)`}
            </div>
            <div className="flex space-x-2">
              <button onClick={resetFilters} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <LeadForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveLead} lead={editingLead} />
      <GDPiliaComposer isOpen={isComposerOpen} onClose={() => setIsComposerOpen(false)} lead={editingLead} />

      {/* Table */}
      <div className="mt-6 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Company</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Position</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Location</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Profile</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {currentLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    No leads found
                  </td>
                </tr>
              ) : (
                currentLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="py-4 pl-6 pr-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                          <span className="font-semibold text-blue-600">{lead.full_name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">{lead.full_name}</p>
                          {lead.created_at && <p className="text-xs text-gray-500">Added {new Date(lead.created_at).toLocaleDateString()}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4"><StatusBadge status={lead.status} /></td>
                    <td className="px-3 py-4 text-sm text-gray-900 font-medium">{lead.email}</td>
                    <td className="px-3 py-4 text-sm text-gray-900 font-medium">{lead.company}</td>
                    <td className="px-3 py-4 text-sm text-gray-900">{lead.position}</td>
                    <td className="px-3 py-4 text-sm text-gray-900">{lead.location}</td>
                    <td className="px-3 py-4">
                      <a
                        href={lead.profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.preventDefault();
                          if (lead.status === "to_be_treated") {
                            handleStatusChange(lead.id, "qualified").then(() => window.open(lead.profile_url, "_blank"));
                          } else {
                            window.open(lead.profile_url, "_blank");
                          }
                        }}
                        className="inline-flex items-center justify-center p-2 rounded-full text-blue-600 bg-blue-50 cursor-pointer hover:text-blue-700 hover:bg-blue-100 active:scale-95 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <UserIcon className="h-5 w-5" />
                      </a>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex space-x-2">
                        <button onClick={() => { setEditingLead(lead); setIsModalOpen(true); }} className="p-1 text-gray-500 hover:text-gray-700"><PencilIcon className="h-5 w-5" /></button>
                        <button onClick={() => handleDeleteLead(lead.id)} className="p-1 text-red-500 hover:text-red-700"><TrashIcon className="h-5 w-5" /></button>
                        <button onClick={() => { setEditingLead(lead); setIsComposerOpen(true); }} className="p-1 text-gray-500 hover:text-gray-700"><EnvelopeIcon className="h-5 w-5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leads;
